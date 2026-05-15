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

  const { build_id } = await req.json();
  if (!build_id) return Response.json({ error: 'Missing build_id' }, { status: 400 });

  const { data: build } = await supabase.from('build_history').select('compiled_file_url, project_name, user_id').eq('id', build_id).single();
  if (!build) return Response.json({ error: 'Build not found' }, { status: 404 });
  if (build.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (!build.compiled_file_url) return Response.json({ error: 'No compiled file' }, { status: 404 });

  // Extract path from URL for signed URL
  const path = build.compiled_file_url.split('/storage/v1/object/public/builds/')[1];
  if (!path) return Response.json({ compiled_file_url: build.compiled_file_url }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  const { data, error } = await supabase.storage.from('builds').createSignedUrl(path, 3600);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ signed_url: data.signedUrl, project_name: build.project_name }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
});
