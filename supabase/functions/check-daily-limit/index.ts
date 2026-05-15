import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

  // Admin has no limit
  if (profile.role === 'admin') {
    return Response.json({ can_compile: true, daily_usage: 0, effective_limit: -1, plan_name: 'admin' }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Reset if new day
  const today = new Date().toISOString().split('T')[0];
  let usage = profile.daily_usage ?? 0;
  if (profile.last_usage_date !== today) {
    usage = 0;
    await supabase.from('profiles').update({ daily_usage: 0, last_usage_date: today }).eq('id', user.id);
  }

  // Get plan limit
  const planName = profile.subscription_plan ?? 'Free';
  const { data: plan } = await supabase.from('plans').select('daily_limit').eq('name', planName).single();
  const planLimit = plan?.daily_limit ?? 3;
  const override = profile.daily_limit_override ?? null;
  const credits = profile.credits ?? 0;
  const effectiveLimit = override ?? (planLimit + credits);

  const canCompile = usage < effectiveLimit;

  return Response.json({ can_compile: canCompile, daily_usage: usage, effective_limit: effectiveLimit, plan_name: planName }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
});
