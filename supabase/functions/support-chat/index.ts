import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SYSTEM_PROMPT = `Você é o assistente de suporte do React to HTML Compiler, uma plataforma SaaS que converte projetos React gerados por ferramentas de IA (como Lovable, Bolt, v0, Cursor e outras) em HTML estático, usando GitHub Actions e Vite.

Você ajuda usuários com:
- Como fazer upload de projetos e iniciar compilações
- Problemas com builds falhos (erros do Vite, dependências faltando, etc.)
- Como configurar deploy via GitHub Pages, FTP ou SFTP
- Planos e limites diários de compilação
- Programa de indicações e créditos
- Integração com ferramentas de IA (Lovable, Bolt, v0, Cursor e similares)

Seja direto, útil e amigável. Responda sempre em português do Brasil. Se não souber a resposta, diga isso honestamente e sugira que o usuário entre em contato via formulário de contato.`;

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const { messages } = await req.json() as { messages: { role: string; content: string }[] };
    if (!messages?.length) return new Response(JSON.stringify({ error: 'messages required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // If no Anthropic key, return a helpful fallback
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({
        reply: 'O assistente de IA não está configurado no momento. Por favor, use o formulário de contato para enviar sua dúvida e nossa equipe responderá em breve.',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic error:', err);
      return new Response(JSON.stringify({
        reply: 'Desculpe, o assistente está temporariamente indisponível. Tente novamente em alguns instantes ou use o formulário de contato.',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const data = await res.json();
    const reply = data.content?.[0]?.text ?? 'Sem resposta.';

    return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
