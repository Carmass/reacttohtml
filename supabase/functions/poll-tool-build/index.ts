import { createClient } from 'npm:@supabase/supabase-js@2';

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
const BUILDS_REPO = 'react-html-builds';

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

async function tryDeleteBranch(owner: string, branch: string) {
  try {
    await gh(`/repos/${owner}/${BUILDS_REPO}/git/refs/heads/${branch}`, { method: 'DELETE' });
  } catch (_) {}
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { build_id, repo, github_username, project_name } = await req.json();
  if (!build_id || !repo || !github_username) return Response.json({ error: 'Missing params' }, { status: 400 });

  try {
    // ── Step 1: DB-first check ───────────────────────────────────────────────
    // GitHub Actions updates the DB directly — so the DB is the source of truth.
    // This avoids downloading artifacts inside the Edge Function (timeout risk).
    const { data: buildRecord } = await supabase
      .from('build_history')
      .select('status, compiled_file_url, error_message, user_id')
      .eq('id', build_id)
      .single();

    if (buildRecord?.status === 'completed') {
      let compiledUrl = buildRecord.compiled_file_url ?? '';

      // Generate fresh signed URL if missing or expired
      if (!compiledUrl || !compiledUrl.includes('token=')) {
        const storagePath = `compiled/${build_id}/output.zip`;
        const { data: signedData } = await supabase.storage
          .from('builds')
          .createSignedUrl(storagePath, 7 * 24 * 3600);
        if (signedData?.signedUrl) {
          compiledUrl = signedData.signedUrl;
          await supabase.from('build_history')
            .update({ compiled_file_url: compiledUrl })
            .eq('id', build_id);
        }
      }

      return Response.json(
        { status: 'completed', success: true, compiled_file_url: compiledUrl, compiled_url: compiledUrl },
        { headers: CORS }
      );
    }

    if (buildRecord?.status === 'failed') {
      return Response.json(
        { status: 'failed', error: buildRecord.error_message ?? 'Build falhou' },
        { headers: CORS }
      );
    }

    // ── Step 2: DB ainda 'processing' — verificar GitHub apenas para detectar falhas ──
    // repo = branchName; todos os builds ficam no BUILDS_REPO permanente
    const runsRes = await gh(
      `/repos/${github_username}/${BUILDS_REPO}/actions/runs?branch=${encodeURIComponent(repo)}&per_page=5`
    );
    if (!runsRes.ok) {
      // GitHub API indisponível — transiente, continuar polling
      return Response.json({ status: 'running' }, { headers: CORS });
    }

    const { workflow_runs } = await runsRes.json();

    if (!workflow_runs?.length) {
      // Runner ainda não iniciou (queue)
      return Response.json({ status: 'running' }, { headers: CORS });
    }

    // Filtrar pelo branch exato para suportar builds paralelos
    const run = workflow_runs.find((r: any) => r.head_branch === repo) ?? workflow_runs[0];

    if (run.status === 'in_progress' || run.status === 'queued') {
      // Buscar progresso por step para os logs
      let logs = '';
      try {
        const jobsRes = await gh(`/repos/${github_username}/${BUILDS_REPO}/actions/runs/${run.id}/jobs`);
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
      return Response.json({ status: 'running', logs }, { headers: CORS });
    }

    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        // GitHub reports success but DB not yet updated — race condition.
        // The "Mark build completed" step should have updated the DB.
        // Try to generate signed URL directly from storage as fallback.
        const storagePath = `compiled/${build_id}/output.zip`;
        const { data: signedData } = await supabase.storage
          .from('builds')
          .createSignedUrl(storagePath, 7 * 24 * 3600);

        if (signedData?.signedUrl) {
          const compiledUrl = signedData.signedUrl;
          await supabase.from('build_history').update({
            status: 'completed',
            compiled_file_url: compiledUrl,
            build_steps: { upload: 'done', validate: 'done', install: 'done', build: 'done', optimize: 'done' },
          }).eq('id', build_id);
          await tryDeleteBranch(github_username, repo);

          await supabase.from('notifications').insert({
            user_id: buildRecord?.user_id,
            title: 'Build concluído! ✅',
            message: `${project_name} compilado com sucesso.`,
            icon: '✅', type: 'build', status: 'success',
          }).catch(() => {});

          return Response.json(
            { status: 'completed', success: true, compiled_file_url: compiledUrl, compiled_url: compiledUrl },
            { headers: CORS }
          );
        }

        // File not found in storage — upload step must have failed
        const errMsg = 'Build concluído no GitHub mas upload ao storage falhou';
        await supabase.from('build_history').update({ status: 'failed', error_message: errMsg }).eq('id', build_id);
        await tryDeleteBranch(github_username, repo);
        return Response.json({ status: 'failed', error: errMsg }, { headers: CORS });

      } else {
        // Workflow failed — "Mark build failed" step should have updated DB already.
        // Get detailed error for the notification.
        let errorMessage = `Build falhou: ${run.conclusion}`;
        try {
          const jobsRes = await gh(`/repos/${github_username}/${repo}/actions/runs/${run.id}/jobs`);
          if (jobsRes.ok) {
            const { jobs } = await jobsRes.json();
            const failed = jobs?.find((j: any) => j.conclusion === 'failure');
            if (failed?.steps) {
              const failStep = failed.steps.find((s: any) => s.conclusion === 'failure');
              if (failStep) errorMessage = `Falha na etapa: ${failStep.name}`;
            }
          }
        } catch (_) {}

        await supabase.from('build_history').update({
          status: 'failed',
          error_message: errorMessage,
        }).eq('id', build_id);
        await tryDeleteBranch(github_username, repo);

        await supabase.from('notifications').insert({
          user_id: buildRecord?.user_id,
          title: 'Falha no build ❌',
          message: `${project_name}: ${errorMessage}`,
          icon: '❌',
        }).catch(() => {});

        return Response.json({ status: 'failed', error: errorMessage }, { headers: CORS });
      }
    }

    // Unknown run status — keep polling
    return Response.json({ status: 'running' }, { headers: CORS });

  } catch (e) {
    console.error('poll-tool-build error:', String(e));
    // Return running only for transient errors — the frontend has its own 15-min timeout
    return Response.json({ status: 'running' }, { headers: CORS });
  }
});
