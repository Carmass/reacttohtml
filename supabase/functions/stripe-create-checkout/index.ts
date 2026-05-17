import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://project-9ml2b.vercel.app';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    if (!STRIPE_SECRET_KEY) return json({ error: 'Stripe not configured' }, 500);

    const { price_id, plan_name } = await req.json();
    if (!price_id) return json({ error: 'price_id required' }, 400);

    // Try to get authenticated user — auth is optional for public checkout
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    let customerId: string | undefined;
    let userId: string | undefined;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token).catch(() => ({ data: { user: null } }));
      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_customer_id, name')
          .eq('id', user.id)
          .single();

        customerId = profile?.stripe_customer_id;
        if (!customerId) {
          const custRes = await stripePost('customers', {
            email: user.email,
            name: profile?.name ?? '',
            metadata: { supabase_user_id: user.id },
          });
          customerId = custRes.id;
          await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
        }
      }
    }

    // Build checkout session — works with or without a logged-in user
    const sessionParams: Record<string, unknown> = {
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${APP_URL}/?checkout=success&plan=${encodeURIComponent(plan_name ?? '')}`,
      cancel_url: `${APP_URL}/Pricing?checkout=cancel`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          plan_name: plan_name ?? '',
          ...(userId ? { supabase_user_id: userId } : {}),
        },
      },
    };

    if (customerId) {
      sessionParams.customer = customerId;
    }
    if (userId) {
      sessionParams.client_reference_id = userId;
    }

    const session = await stripePost('checkout/sessions', sessionParams);
    return json({ url: session.url });
  } catch (e) {
    console.error('stripe-create-checkout error:', e);
    return json({ error: e.message ?? 'Internal error' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function stripePost(path: string, body: Record<string, unknown>) {
  const params = new URLSearchParams();
  flattenToFormData(body, '', params);

  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Stripe error ${res.status}`);
  return data;
}

function flattenToFormData(obj: unknown, prefix: string, params: URLSearchParams) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flattenToFormData(v, prefix ? `${prefix}[${k}]` : k, params);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => flattenToFormData(v, `${prefix}[${i}]`, params));
  } else {
    params.set(prefix, String(obj));
  }
}
