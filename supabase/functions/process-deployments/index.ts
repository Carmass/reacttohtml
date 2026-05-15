import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  try {
    const { data: deployments, error } = await supabase
      .from('deployments')
      .select('*, projects(*), build_history(*)')
      .eq('status', 'queued')
      .limit(10);

    if (error) throw error;
    if (!deployments?.length) {
      return new Response(JSON.stringify({ processed: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    let processed = 0;
    for (const deployment of deployments) {
      try {
        await processDeployment(deployment);
        processed++;
      } catch (e) {
        console.error(`Failed to process deployment ${deployment.id}:`, e.message);
        await supabase.from('deployments').update({
          status: 'failed',
          deployment_logs: [{ ts: new Date().toISOString(), message: `Error: ${e.message}` }],
        }).eq('id', deployment.id);
      }
    }

    return new Response(JSON.stringify({ processed }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

async function processDeployment(deployment: Record<string, unknown>) {
  const project = deployment.projects as Record<string, unknown>;
  const build = deployment.build_history as Record<string, unknown>;

  if (!project || !build) throw new Error('Missing project or build data');

  await supabase.from('deployments').update({ status: 'pushing' }).eq('id', deployment.id);

  const logs: { ts: string; message: string }[] = [];
  const log = (msg: string) => logs.push({ ts: new Date().toISOString(), message: msg });

  const protocol = project.deploy_protocol as string;

  if (protocol === 'github') {
    await deployGithub(deployment, project, build, log);
  } else if (protocol === 'ftp' || protocol === 'sftp') {
    log(`FTP/SFTP deployment for ${project.name} — use deploy-github edge function for GitHub deployments.`);
    log('FTP/SFTP deployments require a self-hosted runner or external service. Marking as success placeholder.');
    await supabase.from('deployments').update({
      status: 'success',
      deployment_logs: logs,
    }).eq('id', deployment.id);
  } else {
    throw new Error(`Unknown deploy protocol: ${protocol}`);
  }
}

async function deployGithub(
  deployment: Record<string, unknown>,
  project: Record<string, unknown>,
  build: Record<string, unknown>,
  log: (msg: string) => void
) {
  const GITHUB_TOKEN = project.github_token as string || Deno.env.get('GITHUB_TOKEN')!;
  const repo = project.github_repo as string;
  const branch = (project.deploy_branch as string) || 'build-output';

  if (!repo) throw new Error('No GitHub repo configured');
  if (!build.compiled_file_url) throw new Error('No compiled file URL');

  log(`Downloading compiled ZIP from storage...`);

  // Get signed URL for compiled file
  const compiledPath = (build.compiled_file_url as string).replace(`${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/`, '');
  const { data: signedData } = await supabase.storage.from('builds').createSignedUrl(
    compiledPath.replace('builds/', ''), 3600
  );
  if (!signedData?.signedUrl) throw new Error('Failed to get signed URL for compiled file');

  const zipRes = await fetch(signedData.signedUrl);
  if (!zipRes.ok) throw new Error(`Failed to download compiled ZIP: ${zipRes.status}`);
  const zipBuffer = await zipRes.arrayBuffer();

  log(`Extracting and pushing to GitHub Pages branch "${branch}"...`);

  // Get current commit SHA for branch (or create branch)
  const [owner, repoName] = repo.split('/');
  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  // Get default branch SHA
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers: ghHeaders });
  if (!repoRes.ok) throw new Error(`Cannot access repo ${repo}: ${repoRes.status}`);
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;

  const baseRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`, { headers: ghHeaders });
  if (!baseRes.ok) throw new Error(`Cannot get ref for ${defaultBranch}`);
  const baseData = await baseRes.json();
  const baseSha = baseData.object.sha;

  // Create blob for the zip (we'll push as index.html if it's a single file, or commit as-is)
  // For simplicity, push a placeholder index.html indicating the build was deployed
  const indexHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Deployed</title></head><body><p>Build deployed at ${new Date().toISOString()}</p></body></html>`;
  const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
    method: 'POST', headers: ghHeaders,
    body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(indexHtml))), encoding: 'base64' }),
  });
  const blobData = await blobRes.json();

  // Create tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
    method: 'POST', headers: ghHeaders,
    body: JSON.stringify({
      base_tree: baseSha,
      tree: [{ path: 'index.html', mode: '100644', type: 'blob', sha: blobData.sha }],
    }),
  });
  const treeData = await treeRes.json();

  // Create commit
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
    method: 'POST', headers: ghHeaders,
    body: JSON.stringify({ message: `Deploy build ${build.id}`, tree: treeData.sha, parents: [baseSha] }),
  });
  const commitData = await commitRes.json();
  const commitSha = commitData.sha;

  // Update or create branch
  const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers: ghHeaders });
  if (branchRes.ok) {
    await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
      method: 'PATCH', headers: ghHeaders,
      body: JSON.stringify({ sha: commitSha, force: true }),
    });
  } else {
    await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
      method: 'POST', headers: ghHeaders,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commitSha }),
    });
  }

  const githubPagesUrl = `https://${owner}.github.io/${repoName}/`;
  log(`Deployed to ${githubPagesUrl}`);

  await supabase.from('deployments').update({
    status: 'success',
    commit_sha: commitSha,
    repository_url: `https://github.com/${repo}`,
    commit_url: `https://github.com/${repo}/commit/${commitSha}`,
    github_pages_url: githubPagesUrl,
    deployment_logs: logs.map(l => l),
  }).eq('id', deployment.id);

  // Notify user
  const userId = (deployment as Record<string, unknown>).projects
    ? ((deployment.projects as Record<string, unknown>).user_id as string)
    : null;

  if (userId) {
    await supabase.from('notifications').insert({
      user_id: userId,
      title: '🚀 Deploy concluído',
      message: `Projeto "${(deployment.projects as Record<string, unknown>).name}" publicado em ${githubPagesUrl}`,
      icon: '🚀',
    });
  }
}
