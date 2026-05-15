import { useState } from 'react';
import { C } from '../lib/tokens.js';
import { useDeployments, useBuildHistory, updateProject } from '../hooks/useDB.js';
import { callEdgeFunction } from '../lib/supabase.js';

const STATUS_CHIP = { success: 'cs', failed: 'ce', pushing: 'cw', queued: 'cg' };

export default function ProjectDetailsPage({ params, showToast, go }) {
  const project = params?.project;
  const [tab, setTab]       = useState('overview');
  const [deploying, setDeploying] = useState(false);
  const [editDlg, setEditDlg]   = useState(false);

  const { data: deployments, refetch: refetchDeploy } = useDeployments(project?.id);
  const { data: allBuilds }  = useBuildHistory(200);

  if (!project) {
    return (
      <div className="empty">
        <div className="empty-ico">📁</div>
        <div>Projeto não encontrado</div>
        <button className="btn bt bsm" style={{ marginTop: 8 }} onClick={() => go('projects')}>← Voltar aos Projetos</button>
      </div>
    );
  }

  const projectBuilds = allBuilds.filter(b => b.project_id === project.id);
  const lastDeploy    = deployments[0];
  const protoIco      = project.deploy_protocol === 'github' ? '⬡' : project.deploy_protocol === 'sftp' ? '🔒' : '📡';

  async function deploy() {
    if (!project.last_build_id) { showToast('⚠️ Faça um build antes de fazer deploy'); return; }
    setDeploying(true);
    try {
      await callEdgeFunction('deploy-github', { project_id: project.id, build_id: project.last_build_id });
      showToast('🚀 Deploy iniciado!');
      setTimeout(refetchDeploy, 3000);
    } catch (e) {
      showToast('❌ Erro: ' + e.message);
    } finally {
      setDeploying(false);
    }
  }

  const TABS = [
    { id: 'overview',    label: '📊 Visão Geral' },
    { id: 'deployments', label: `🚀 Deployments (${deployments.length})` },
    { id: 'builds',      label: `⚡ Builds (${projectBuilds.length})` },
    { id: 'settings',    label: '⚙️ Configurações' },
  ];

  return (
    <div className="fade-in">
      <button className="btn bt bsm" style={{ marginBottom: 16 }} onClick={() => go('projects')}>← Projetos</button>

      {/* Project header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cb" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
            {protoIco}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.on }}>{project.name}</div>
            {project.description && (
              <div style={{ fontSize: 13, color: C.onV, marginTop: 2 }}>{project.description}</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="chip cg">{project.deploy_protocol?.toUpperCase()}</span>
              {project.auto_deploy && <span className="chip cs">Auto-deploy</span>}
              {project.github_pages_enabled && <span className="chip cp">GitHub Pages</span>}
              {lastDeploy && (
                <span className={`chip ${STATUS_CHIP[lastDeploy.status] ?? 'cg'}`}>
                  Deploy: {lastDeploy.status}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn bt bsm" onClick={() => setEditDlg(true)}>⚙️ Configurar</button>
            <button className="btn bf bsm" onClick={deploy} disabled={deploying}>
              {deploying ? '🚀 Iniciando…' : '🚀 Deploy'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'a' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'    && <OverviewTab project={project} deployments={deployments} builds={projectBuilds} go={go} />}
      {tab === 'deployments' && <DeploymentsTab deployments={deployments} />}
      {tab === 'builds'      && <BuildsTab builds={projectBuilds} go={go} />}
      {tab === 'settings'    && <SettingsTab project={project} showToast={showToast} go={go} />}
    </div>
  );
}

function OverviewTab({ project, deployments, builds, go }) {
  const completed = builds.filter(b => b.status === 'completed').length;
  const lastDeploy = deployments[0];

  return (
    <div>
      <div className="mg" style={{ marginBottom: 16 }}>
        {[
          { l: 'Total de Builds', v: builds.length, ico: '⚡', col: C.pC },
          { l: 'Compilados', v: completed, ico: '✅', col: C.sucC },
          { l: 'Deployments', v: deployments.length, ico: '🚀', col: C.secC },
          { l: 'Deploy status', v: lastDeploy?.status ?? '—', ico: '📡', col: C.warnC },
        ].map((m, i) => (
          <div key={i} className="card" style={{ background: m.col, border: 'none' }}>
            <div className="cb" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div className="ml">{m.l}</div>
                  <div className="mv">{m.v}</div>
                </div>
                <span style={{ fontSize: 26, opacity: .7 }}>{m.ico}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project info */}
      <div className="two">
        <div className="card">
          <div className="ch"><span className="ct">📁 Informações do Projeto</span></div>
          <div className="cb">
            {[
              ['Nome', project.name],
              ['Protocolo', project.deploy_protocol?.toUpperCase()],
              ['Host / Repositório', project.ftp_host || project.github_repo || '—'],
              ['Caminho remoto', project.ftp_remote_path || '—'],
              ['Auto-deploy', project.auto_deploy ? 'Ativo' : 'Inativo'],
              ['Criado em', new Date(project.created_at).toLocaleDateString('pt-BR')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--ovV)', fontSize: 13 }}>
                <span style={{ color: C.onV }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="ch"><span className="ct">🚀 Último Deployment</span></div>
          <div className="cb">
            {!lastDeploy ? (
              <div className="empty" style={{ padding: 24 }}>Nenhum deployment</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Status', lastDeploy.status],
                  ['Data', new Date(lastDeploy.created_at).toLocaleString('pt-BR')],
                  ['Commit SHA', lastDeploy.commit_sha?.slice(0, 8) ?? '—'],
                  ['URL', lastDeploy.github_pages_url ?? '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: C.onV }}>{k}</span>
                    {k === 'URL' && lastDeploy.github_pages_url
                      ? <a href={v} target="_blank" rel="noreferrer" style={{ color: C.p, fontSize: 12 }}>🌐 Abrir site</a>
                      : <span style={{ fontWeight: 600 }}>{v}</span>
                    }
                  </div>
                ))}
                {lastDeploy.deployment_logs?.length > 0 && (
                  <div className="logs-box" style={{ marginTop: 6 }}>
                    {lastDeploy.deployment_logs.slice(-5).map((l, i) => (
                      <div key={i}>{l.message}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeploymentsTab({ deployments }) {
  return (
    <div className="card">
      <div className="ch"><span className="ct">🚀 Histórico de Deployments ({deployments.length})</span></div>
      <div className="cb">
        {deployments.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>
            <div className="empty-ico">🚀</div>
            Nenhum deployment realizado ainda
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deployments.map(d => (
              <div key={d.id} style={{ padding: '14px 16px', background: C.s1, borderRadius: 12, border: '1px solid var(--ovV)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className={`chip ${STATUS_CHIP[d.status] ?? 'cg'}`}>{d.status}</span>
                  <span className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(d.created_at).toLocaleString('pt-BR')}</span>
                  {d.commit_sha && <span className="chip cg" style={{ fontSize: 9 }}>#{d.commit_sha.slice(0,8)}</span>}
                  {d.github_pages_url && (
                    <a href={d.github_pages_url} target="_blank" rel="noreferrer" className="btn bsm bt" style={{ textDecoration: 'none', marginLeft: 'auto' }}>
                      🌐 Ver site
                    </a>
                  )}
                </div>
                {d.deployment_logs?.length > 0 && (
                  <div className="logs-box">
                    {d.deployment_logs.map((l, i) => <div key={i}>{l.message}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BuildsTab({ builds, go }) {
  return (
    <div className="card">
      <div className="ch"><span className="ct">⚡ Builds Associados ({builds.length})</span></div>
      <div className="cb">
        {builds.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>
            <div className="empty-ico">⚡</div>
            Nenhum build associado a este projeto
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Projeto</th><th>Status</th><th>Data</th><th>Duração</th><th>Ações</th></tr></thead>
            <tbody>
              {builds.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.project_name}</td>
                  <td><span className={`chip ${b.status === 'completed' ? 'cs' : b.status === 'failed' ? 'ce' : 'cw'}`}>{b.status}</span></td>
                  <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(b.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{b.build_duration ? `${b.build_duration}s` : '—'}</td>
                  <td>
                    {b.compiled_file_url && (
                      <a href={b.compiled_file_url} download className="btn bsm bt" style={{ textDecoration: 'none', fontSize: 11 }}>⬇ Baixar</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SettingsTab({ project, showToast, go }) {
  const [form, setForm] = useState({ ...project });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await updateProject(project.id, form);
      showToast('✅ Configurações salvas!');
    } catch (e) {
      showToast('❌ ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">⚙️ Configurações do Projeto</span>
        <button className="btn bsm bf" onClick={save} disabled={saving}>{saving ? 'Salvando…' : '💾 Salvar'}</button>
      </div>
      <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="two">
          <div className="fld">
            <label>Nome do Projeto</label>
            <input className="fi" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="fld">
            <label>Protocolo de Deploy</label>
            <select className="fi" value={form.deploy_protocol} onChange={e => set('deploy_protocol', e.target.value)}>
              <option value="ftp">FTP</option>
              <option value="sftp">SFTP</option>
              <option value="github">GitHub Pages</option>
            </select>
          </div>
        </div>
        <div className="fld">
          <label>Descrição</label>
          <input className="fi" value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
        </div>
        {(form.deploy_protocol === 'ftp' || form.deploy_protocol === 'sftp') && (
          <>
            <div className="two">
              <div className="fld"><label>Host</label><input className="fi" value={form.ftp_host ?? ''} onChange={e => set('ftp_host', e.target.value)} placeholder="ftp.seusite.com" /></div>
              <div className="fld"><label>Porta</label><input className="fi" type="number" value={form.ftp_port ?? 21} onChange={e => set('ftp_port', +e.target.value)} /></div>
            </div>
            <div className="two">
              <div className="fld"><label>Usuário</label><input className="fi" value={form.ftp_username ?? ''} onChange={e => set('ftp_username', e.target.value)} /></div>
              <div className="fld"><label>Senha</label><input className="fi" type="password" value={form.ftp_password ?? ''} onChange={e => set('ftp_password', e.target.value)} /></div>
            </div>
            <div className="fld"><label>Caminho remoto</label><input className="fi" value={form.ftp_remote_path ?? '/public_html'} onChange={e => set('ftp_remote_path', e.target.value)} /></div>
          </>
        )}
        {form.deploy_protocol === 'github' && (
          <>
            <div className="fld"><label>Repositório (owner/repo)</label><input className="fi" value={form.github_repo ?? ''} onChange={e => set('github_repo', e.target.value)} placeholder="usuario/meu-site" /></div>
            <div className="fld"><label>Branch de deploy</label><input className="fi" value={form.deploy_branch ?? 'build-output'} onChange={e => set('deploy_branch', e.target.value)} /></div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: C.s1, borderRadius: 8 }}>
          <input type="checkbox" id="auto_deploy" checked={form.auto_deploy ?? false} onChange={e => set('auto_deploy', e.target.checked)} />
          <label htmlFor="auto_deploy" style={{ fontSize: 13, cursor: 'pointer' }}>Deploy automático após cada compilação</label>
        </div>
      </div>
    </div>
  );
}
