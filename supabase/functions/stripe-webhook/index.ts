import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Plan mapping from Stripe price ID to plan name
const PRICE_TO_PLAN: Record<string, string> = {
  [Deno.env.get('STRIPE_PRICE_STARTER') ?? '']: 'Starter',
  [Deno.env.get('STRIPE_PRICE_CREATOR') ?? '']: 'Creator',
  [Deno.env.get('STRIPE_PRICE_PRO') ?? '']: 'Pro',
  [Deno.env.get('STRIPE_PRICE_BUSINESS') ?? '']: 'Business',
};

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  // Verify Stripe signature using Web Crypto
  if (STRIPE_WEBHOOK_SECRET) {
    try {
      await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${e.message}` }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const eventType = event.type as string;
  const data = (event.data as Record<string, unknown>)?.object as Record<string, unknown>;

  try {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const customerId = data.customer as string;
        const priceId = (data.items as Record<string, unknown>)?.data?.[0]?.price?.id as string;
        const status = data.status as string;
        const planName = PRICE_TO_PLAN[priceId] ?? 'Starter';

        await supabase.from('profiles')
          .update({ subscription_plan: planName, subscription_status: status })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const customerId = data.customer as string;
        await supabase.from('profiles')
          .update({ subscription_plan: 'Free', subscription_status: 'canceled' })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const customerId = data.customer as string;
        const stripeInvoiceId = data.id as string;
        const amount = (data.amount_paid as number) / 100;
        const currency = data.currency as string;
        const invoiceUrl = data.hosted_invoice_url as string;

        const { data: profile } = await supabase.from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase.from('invoices').insert({
            user_id: profile.id,
            stripe_invoice_id: stripeInvoiceId,
            amount,
            currency,
            status: 'paid',
            invoice_url: invoiceUrl,
          });

          await supabase.from('notifications').insert({
            user_id: profile.id,
            title: '💳 Pagamento confirmado',
            message: `Fatura de ${currency.toUpperCase()} ${amount.toFixed(2)} paga com sucesso.`,
            icon: '💳',
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const customerId = data.customer as string;
        const { data: profile } = await supabase.from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase.from('notifications').insert({
            user_id: profile.id,
            title: '⚠️ Pagamento falhou',
            message: 'Não foi possível processar seu pagamento. Verifique seu método de pagamento no Stripe.',
            icon: '⚠️',
          });
        }
        break;
      }

      case 'checkout.session.completed': {
        const customerId = data.customer as string;
        const clientReferenceId = data.client_reference_id as string; // user UUID

        if (clientReferenceId && customerId) {
          await supabase.from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', clientReferenceId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(`Error handling event ${eventType}:`, e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Part = parts.find(p => p.startsWith('v1='));
  if (!tPart || !v1Part) throw new Error('Missing t or v1 in stripe-signature');

  const timestamp = tPart.slice(2);
  const expectedSig = v1Part.slice(3);
  const signedPayload = `${timestamp}.${payload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (computed !== expectedSig) throw new Error('Signature mismatch');

  // Prevent replay attacks: reject events older than 5 minutes
  const diff = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (diff > 300) throw new Error('Timestamp too old');
}
