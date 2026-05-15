import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DEFAULT_GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const { project_id, build_id } = await req.json();
    if (!project_id || !build_id) return new Response(JSON.stringify({ error: 'project_id and build_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // Load project and verify ownership
    const { data: project, error: projError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();
    if (projError || !project) return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    // Load build
    const { data: build, error: buildError } = await supabase
      .from('build_history')
      .select('*')
      .eq('id', build_id)
      .eq('user_id', user.id)
      .single();
    if (buildError || !build) return new Response(JSON.stringify({ error: 'Build not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    if (build.status !== 'completed') return new Response(JSON.stringify({ error: 'Build not completed yet' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const GITHUB_TOKEN = project.github_token || DEFAULT_GITHUB_TOKEN;
    const repo = project.github_repo;
    const branch = project.deploy_branch || 'build-output';

    if (!repo) return new Response(JSON.stringify({ error: 'No github_repo configured' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    // Create deployment record
    const { data: deployment } = await supabase.from('deployments').insert({
      project_id, build_id, status: 'pushing',
    }).select().single();

    const logs: { ts: string; message: string }[] = [];
    const log = (msg: string) => { logs.push({ ts: new Date().toISOString(), message: msg }); console.log(msg); };

    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
    const [owner, repoName] = repo.split('/');

    log(`Getting signed URL for compiled file...`);
    const compiledStoragePath = build.compiled_file_url?.split('/storage/v1/object/public/builds/')?.[1]
      ?? build.compiled_file_url?.split('/storage/v1/object/')?.[1]?.replace(/^(authenticated|public)\/builds\//, '');

    let zipBuffer: ArrayBuffer;
    if (compiledStoragePath) {
      const { data: signed } = await supabase.storage.from('builds').createSignedUrl(compiledStoragePath, 600);
      if (!signed?.signedUrl) throw new Error('Failed to create signed URL');
      const zipRes = await fetch(signed.signedUrl);
      if (!zipRes.ok) throw new Error(`Failed to download compiled file: ${zipRes.status}`);
      zipBuffer = await zipRes.arrayBuffer();
      log(`Downloaded compiled ZIP (${(zipBuffer.byteLength / 1024).toFixed(0)} KB)`);
    } else {
      throw new Error('Cannot determine compiled file storage path');
    }

    // Get repo default branch
    log(`Fetching repo info for ${repo}...`);
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers: ghHeaders });
    if (!repoRes.ok) throw new Error(`Cannot access repo: ${repoRes.status} ${await repoRes.text()}`);
    const repoData = await repoRes.json();

    const defaultBranch = repoData.default_branch ?? 'main';
    const baseRefRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`, { headers: ghHeaders });
    if (!baseRefRes.ok) throw new Error(`Cannot get base ref: ${baseRefRes.status}`);
    const baseSha = (await baseRefRes.json()).object.sha;
    log(`Base commit: ${baseSha.slice(0, 7)}`);

    // The compiled file is a ZIP — we'll create a blob for it and commit
    const zipB64 = btoa(String.fromCharCode(...new Uint8Array(zipBuffer)));
    log(`Creating blob...`);
    const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
      method: 'POST', headers: ghHeaders,
      body: JSON.stringify({ content: zipB64, encoding: 'base64' }),
    });
    if (!blobRes.ok) throw new Error(`Failed to create blob: ${blobRes.status}`);
    const blobData = await blobRes.json();

    // Create tree with the zip as 'dist.zip' and a minimal index.html pointing to it
    const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${project.name} — Build Output</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f0f0f0;margin:0}</style>
</head>
<body>
<div style="text-align:center;padding:2rem;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.1)">
<h1>🎉 ${project.name}</h1>
<p>Build <code>${build_id.slice(0, 8)}</code> deployado em ${new Date().toISOString().slice(0, 10)}</p>
<a href="dist.zip" style="display:inline-block;margin-top:1rem;padding:.75rem 1.5rem;background:#6750A4;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">⬇ Baixar dist.zip</a>
</div>
</body>
</html>`;

    const indexBlobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
      method: 'POST', headers: ghHeaders,
      body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(indexHtml))), encoding: 'base64' }),
    });
    const indexBlobData = await indexBlobRes.json();

    log(`Creating tree...`);
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST', headers: ghHeaders,
      body: JSON.stringify({
        base_tree: baseSha,
        tree: [
          { path: 'dist.zip', mode: '100644', type: 'blob', sha: blobData.sha },
          { path: 'index.html', mode: '100644', type: 'blob', sha: indexBlobData.sha },
        ],
      }),
    });
    if (!treeRes.ok) throw new Error(`Failed to create tree: ${treeRes.status}`);
    const treeData = await treeRes.json();

    log(`Creating commit...`);
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST', headers: ghHeaders,
      body: JSON.stringify({
        message: `deploy: build ${build_id.slice(0, 8)} — ${build.project_name}`,
        tree: treeData.sha,
        parents: [baseSha],
      }),
    });
    if (!commitRes.ok) throw new Error(`Failed to create commit: ${commitRes.status}`);
    const commitData = await commitRes.json();
    const commitSha = commitData.sha;
    log(`Commit: ${commitSha.slice(0, 7)}`);

    // Update or create branch
    log(`Pushing to branch "${branch}"...`);
    const branchCheckRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers: ghHeaders });
    if (branchCheckRes.ok) {
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

    // Enable GitHub Pages if requested
    let githubPagesUrl = `https://${owner}.github.io/${repoName}/`;
    if (project.github_pages_enabled) {
      log(`Enabling GitHub Pages...`);
      await fetch(`https://api.github.com/repos/${owner}/${repoName}/pages`, {
        method: 'POST', headers: ghHeaders,
        body: JSON.stringify({ source: { branch, path: '/' } }),
      }).catch(() => {/* may already exist */});
    }

    log(`Deploy complete! ${githubPagesUrl}`);

    await supabase.from('deployments').update({
      status: 'success',
      commit_sha: commitSha,
      repository_url: `https://github.com/${repo}`,
      commit_url: `https://github.com/${repo}/commit/${commitSha}`,
      github_pages_url: githubPagesUrl,
      deployment_logs: logs,
    }).eq('id', deployment?.id);

    await supabase.from('projects').update({ last_build_id: build_id }).eq('id', project_id);

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: '🚀 Deploy concluído',
      message: `"${project.name}" publicado em ${githubPagesUrl}`,
      icon: '🚀',
    });

    return new Response(JSON.stringify({ success: true, commit_sha: commitSha, github_pages_url: githubPagesUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
