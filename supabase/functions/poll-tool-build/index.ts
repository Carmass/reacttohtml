import { createClient } from 'npm:@supabase/supabase-js@2';

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const gh = (path: string, opts: RequestInit = {}) =>
  fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...((opts as any).headers ?? {}),
    },
  });

async function deleteRepo(owner: string, repo: string) {
  await gh(`/repos/${owner}/${repo}`, { method: 'DELETE' });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { build_id, repo, github_username, project_name } = await req.json();
  if (!build_id || !repo || !github_username) return Response.json({ error: 'Missing params' }, { status: 400 });

  const startTime = Date.now();

  try {
    // 1. Get workflow runs
    const runsRes = await gh(`/repos/${github_username}/${repo}/actions/runs`);
    if (!runsRes.ok) return Response.json({ status: 'running' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    const { workflow_runs } = await runsRes.json();

    if (!workflow_runs || workflow_runs.length === 0) {
      return Response.json({ status: 'running' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const run = workflow_runs[0];

    if (run.status === 'in_progress' || run.status === 'queued') {
      // Get logs preview
      let logs = '';
      try {
        const jobsRes = await gh(`/repos/${github_username}/${repo}/actions/runs/${run.id}/jobs`);
        if (jobsRes.ok) {
          const { jobs } = await jobsRes.json();
          if (jobs?.[0]?.steps) {
            logs = jobs[0].steps
              .filter((s: any) => s.status === 'completed' || s.status === 'in_progress')
              .map((s: any) => `[${s.status === 'completed' ? '✓' : '▶'}] ${s.name}`)
              .join('\n');
          }
        }
      } catch (_) {}
      return Response.json({ status: 'running', logs }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Run completed
    if (run.status === 'completed') {
      const buildDuration = Math.floor((Date.now() - startTime) / 1000);

      if (run.conclusion === 'success') {
        // List artifacts
        const artRes = await gh(`/repos/${github_username}/${repo}/actions/runs/${run.id}/artifacts`);
        const { artifacts } = await artRes.json();
        const artifact = artifacts?.find((a: any) => a.name === 'build-output');

        if (!artifact) {
          await supabase.from('build_history').update({ status: 'failed', error_message: 'No artifact found' }).eq('id', build_id);
          await deleteRepo(github_username, repo);
          return Response.json({ status: 'failed' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        // Download artifact zip
        const dlRes = await gh(`/repos/${github_username}/${repo}/actions/artifacts/${artifact.id}/zip`, {
          redirect: 'follow',
        });
        const zipBytes = await dlRes.arrayBuffer();

        // Upload to Supabase Storage
        const fileName = `compiled/${build_id}/${project_name ?? 'output'}.zip`;
        const { error: uploadErr } = await supabase.storage
          .from('builds')
          .upload(fileName, zipBytes, { contentType: 'application/zip', upsert: true });

        let compiledUrl = '';
        if (!uploadErr) {
          const { data } = supabase.storage.from('builds').getPublicUrl(fileName);
          compiledUrl = data.publicUrl;
        }

        // Update build record
        await supabase.from('build_history').update({
          status: 'completed',
          compiled_file_url: compiledUrl,
          build_duration: buildDuration,
          build_steps: { upload: 'done', validate: 'done', install: 'done', build: 'done', optimize: 'done' },
        }).eq('id', build_id);

        // Delete temp repo
        await deleteRepo(github_username, repo);

        // Send notification
        await supabase.from('notifications').insert({
          user_id: (await supabase.from('build_history').select('user_id').eq('id', build_id).single()).data?.user_id,
          title: 'Build concluído! ✅',
          message: `${project_name} foi compilado com sucesso.`,
          icon: '✅',
        }).catch(() => {});

        return Response.json({ status: 'completed', compiled_url: compiledUrl }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      } else {
        // Failure — get logs
        let errorMessage = `Workflow failed: ${run.conclusion}`;
        try {
          const jobsRes = await gh(`/repos/${github_username}/${repo}/actions/runs/${run.id}/jobs`);
          if (jobsRes.ok) {
            const { jobs } = await jobsRes.json();
            const failed = jobs?.find((j: any) => j.conclusion === 'failure');
            if (failed?.steps) {
              const failStep = failed.steps.find((s: any) => s.conclusion === 'failure');
              if (failStep) errorMessage = `Falha em: ${failStep.name}`;
            }
          }
        } catch (_) {}

        await supabase.from('build_history').update({ status: 'failed', error_message: errorMessage, build_duration: buildDuration }).eq('id', build_id);
        await deleteRepo(github_username, repo);

        await supabase.from('notifications').insert({
          user_id: (await supabase.from('build_history').select('user_id').eq('id', build_id).single()).data?.user_id,
          title: 'Falha no build ❌',
          message: `${project_name}: ${errorMessage}`,
          icon: '❌',
        }).catch(() => {});

        return Response.json({ status: 'failed', error: errorMessage }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      }
    }

    return Response.json({ status: 'running' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return Response.json({ status: 'running', error: String(e) }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});
