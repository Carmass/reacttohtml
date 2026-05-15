import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://reacttohtml.vercel.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { build_id } = await req.json();
    if (!build_id) return json({ error: 'build_id required' }, 400);

    // Fetch build with user info
    const { data: build, error: buildError } = await supabase
      .from('build_history')
      .select('*, profiles(name, email:id)')
      .eq('id', build_id)
      .single();

    if (buildError || !build) return json({ error: 'Build not found' }, 404);

    // Get user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(build.user_id);
    const userEmail = user?.email ?? '';
    const userName = build.profiles?.name ?? userEmail.split('@')[0] ?? 'Usuário';

    const isSuccess = build.status === 'completed';
    const notifTitle = isSuccess
      ? `✅ Build concluído: ${build.project_name}`
      : `❌ Build falhou: ${build.project_name}`;
    const notifMessage = isSuccess
      ? `Seu projeto "${build.project_name}" foi compilado com sucesso e está pronto para download.`
      : `Ocorreu um erro ao compilar "${build.project_name}": ${build.error_message ?? 'Erro desconhecido'}`;

    // Insert in-app notification
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: build.user_id,
      title: notifTitle,
      message: notifMessage,
      type: 'build',
      status: isSuccess ? 'success' : 'error',
      link: `${APP_URL}/Compiler`,
      read: false,
    });

    if (notifError) console.error('Notification insert error:', notifError);

    // Send email via Resend (optional)
    if (RESEND_API_KEY && userEmail) {
      const emailHtml = isSuccess
        ? `<h2>🎉 Build Concluído!</h2>
           <p>Olá, ${userName}!</p>
           <p>Seu projeto <strong>${build.project_name}</strong> foi compilado com sucesso.</p>
           <p><a href="${APP_URL}/Compiler" style="background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">Fazer Download</a></p>
           <p style="color:#6B7280;font-size:12px;margin-top:24px">React to HTML Compiler</p>`
        : `<h2>⚠️ Build Falhou</h2>
           <p>Olá, ${userName}!</p>
           <p>Ocorreu um erro ao compilar <strong>${build.project_name}</strong>.</p>
           <p><strong>Erro:</strong> ${build.error_message ?? 'Erro desconhecido'}</p>
           <p><a href="${APP_URL}/Compiler" style="background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">Tentar Novamente</a></p>
           <p style="color:#6B7280;font-size:12px;margin-top:24px">React to HTML Compiler</p>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'React to HTML <noreply@reacttohtml.com>',
          to: [userEmail],
          subject: notifTitle,
          html: emailHtml,
        }),
      }).catch((e) => console.error('Email send error:', e));
    }

    return json({ ok: true, in_app: !notifError, email_sent: !!(RESEND_API_KEY && userEmail) });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
