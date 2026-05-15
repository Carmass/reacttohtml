import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: stuckBuilds, error } = await supabase
      .from('build_history')
      .select('id, user_id, project_name, github_run_id, created_at')
      .eq('status', 'processing')
      .lt('created_at', tenMinutesAgo);

    if (error) throw error;
    if (!stuckBuilds?.length) {
      return new Response(JSON.stringify({ recovered: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    let recovered = 0;
    for (const build of stuckBuilds) {
      try {
        await recoverBuild(build);
        recovered++;
      } catch (e) {
        console.error(`Failed to recover build ${build.id}:`, e.message);
      }
    }

    return new Response(JSON.stringify({ recovered }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

async function recoverBuild(build: { id: string; user_id: string; project_name: string; github_run_id: string | null }) {
  let realStatus = 'failed';
  let errorMessage = 'Build timed out — recovered automatically';

  if (build.github_run_id) {
    const [owner, repo] = build.github_run_id.split('/');
    if (owner && repo) {
      try {
        const runsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
          { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } }
        );
        if (runsRes.ok) {
          const runsData = await runsRes.json();
          const run = runsData.workflow_runs?.[0];
          if (run) {
            if (run.status === 'completed' && run.conclusion === 'success') {
              realStatus = 'completed';
              errorMessage = '';
            } else if (run.status === 'completed') {
              errorMessage = `GitHub Actions: ${run.conclusion}`;
            } else if (run.status === 'in_progress' || run.status === 'queued') {
              return; // still running, don't recover yet
            }
          }
        }
        // Try to delete the temp repo
        await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' },
        });
      } catch (_) { /* ignore cleanup errors */ }
    }
  }

  await supabase.from('build_history').update({
    status: realStatus,
    error_message: errorMessage || null,
  }).eq('id', build.id);

  await supabase.from('notifications').insert({
    user_id: build.user_id,
    title: realStatus === 'completed' ? '✅ Build concluído' : '❌ Build falhou',
    message: realStatus === 'completed'
      ? `"${build.project_name}" foi compilado com sucesso.`
      : `"${build.project_name}" falhou: ${errorMessage}`,
    icon: realStatus === 'completed' ? '✅' : '❌',
  });
}
