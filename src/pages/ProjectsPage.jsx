import { useState, useRef, useEffect } from 'react';
import { C } from '../lib/tokens.js';
import { useProjects, createProject, updateProject, deleteProject } from '../hooks/useDB.js';
import { callEdgeFunction } from '../lib/supabase.js';

const EMPTY_FORM = {
  name: '', description: '', deploy_protocol: 'ftp',
  ftp_host: '', ftp_port: 21, ftp_username: '', ftp_password: '',
  ftp_remote_path: '/public_html', auto_deploy: false,
  github_repo: '', deploy_branch: 'build-output',
};

export default function ProjectsPage({ showToast, go }) {
  const { data: projects, refetch } = useProjects();
  const [tab, setTab]       = useState('mine');
  const [search, setSearch] = useState('');
  const [dlg, setDlg]       = useState(false);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [deploying, setDeploying] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  // Close gear dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function openNew()   { setForm(EMPTY_FORM); setEditing(null); setDlg(true); setOpenMenu(null); }
  function openEdit(p) { setForm({ ...EMPTY_FORM, ...p }); setEditing(p.id); setDlg(true); setOpenMenu(null); }

  async function save() {
    if (!form.name.trim()) return;
    if (editing) await updateProject(editing, form);
    else await createProject(form);
    setDlg(false);
    refetch();
    showToast(editing ? '✅ Projeto atualizado!' : '✅ Projeto criado!');
  }

  async function remove(id) {
    if (!confirm('Excluir este projeto?')) return;
    await deleteProject(id);
    setOpenMenu(null);
    refetch();
    showToast('🗑 Projeto excluído');
  }

  async function deploy(project) {
    if (!project.last_build_id) { showToast('⚠️ Faça um build antes de fazer deploy'); return; }
    setDeploying(project.id);
    try {
      await callEdgeFunction('deploy-github', { project_id: project.id, build_id: project.last_build_id });
      showToast('🚀 Deploy iniciado!');
    } catch (e) {
      showToast('❌ Erro: ' + e.message);
    } finally {
      setDeploying(null);
    }
  }

  const mine = projects.filter(p => !p.shared_with_me);
  const shared = projects.filter(p => p.shared_with_me);
  const list = tab === 'mine' ? mine : shared;
  const filtered = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fade-in">
      {/* Search + New button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <span className="search-ico">🔍</span>
          <input
            className="fi search-input"
            placeholder="Buscar projetos por nome"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn bf" onClick={openNew}>
          + Novo Projeto
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={`tab ${tab === 'mine' ? 'a' : ''}`}
          onClick={() => setTab('mine')}
        >
          📁 Meus Projetos ({mine.length})
        </button>
        <button
          className={`tab ${tab === 'shared' ? 'a' : ''}`}
          onClick={() => setTab('shared')}
        >
          👥 Compartilhados comigo ({shared.length})
        </button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-ico">{search ? '🔍' : '📁'}</div>
          {search ? 'Nenhum projeto encontrado para esta busca.' : 'Nenhum projeto ainda.'}
          {!search && (
            <button className="btn bf bsm" style={{ marginTop: 8 }} onClick={openNew}>
              Criar Primeiro Projeto
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              menuRef={menuRef}
              onEdit={() => openEdit(p)}
              onDelete={() => remove(p.id)}
              onDeploy={() => deploy(p)}
              onDetails={() => go('project-details', { project: p })}
              deploying={deploying === p.id}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      {dlg && (
        <div className="dlg-bg" onClick={() => setDlg(false)}>
          <div className="dlg wide" onClick={e => e.stopPropagation()}>
            <div className="dlg-h">
              <span className="dlg-t">{editing ? 'Editar Projeto' : 'Novo Projeto'}</span>
              <button className="ib" onClick={() => setDlg(false)}>✕</button>
            </div>
            <div className="dlg-b">
              <div className="fld">
                <label>Nome do Projeto *</label>
                <input className="fi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Descrição</label>
                <input className="fi" placeholder="Descreva brevemente o projeto" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Protocolo de Deploy</label>
                <select className="fi" value={form.deploy_protocol} onChange={e => setForm(f => ({ ...f, deploy_protocol: e.target.value }))}>
                  <option value="ftp">FTP</option>
                  <option value="sftp">SFTP</option>
                  <option value="github">GitHub Pages</option>
                </select>
              </div>
              {(form.deploy_protocol === 'ftp' || form.deploy_protocol === 'sftp') && (
                <>
                  <div className="two">
                    <div className="fld"><label>Host</label><input className="fi" placeholder="ftp.seusite.com" value={form.ftp_host} onChange={e => setForm(f => ({ ...f, ftp_host: e.target.value }))} /></div>
                    <div className="fld"><label>Porta</label><input className="fi" type="number" value={form.ftp_port} onChange={e => setForm(f => ({ ...f, ftp_port: +e.target.value }))} /></div>
                  </div>
                  <div className="two">
                    <div className="fld"><label>Usuário</label><input className="fi" value={form.ftp_username} onChange={e => setForm(f => ({ ...f, ftp_username: e.target.value }))} /></div>
                    <div className="fld"><label>Senha</label><input className="fi" type="password" value={form.ftp_password} onChange={e => setForm(f => ({ ...f, ftp_password: e.target.value }))} /></div>
                  </div>
                  <div className="fld"><label>Caminho remoto</label><input className="fi" placeholder="/public_html" value={form.ftp_remote_path} onChange={e => setForm(f => ({ ...f, ftp_remote_path: e.target.value }))} /></div>
                </>
              )}
              {form.deploy_protocol === 'github' && (
                <>
                  <div className="fld"><label>Repositório (owner/repo)</label><input className="fi" placeholder="seunome/meu-site" value={form.github_repo} onChange={e => setForm(f => ({ ...f, github_repo: e.target.value }))} /></div>
                  <div className="fld"><label>Branch de deploy</label><input className="fi" value={form.deploy_branch} onChange={e => setForm(f => ({ ...f, deploy_branch: e.target.value }))} /></div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', background: C.s1, borderRadius: 8 }}>
                <input type="checkbox" id="auto-deploy" checked={form.auto_deploy} onChange={e => setForm(f => ({ ...f, auto_deploy: e.target.checked }))} />
                <label htmlFor="auto-deploy" style={{ fontSize: 13, cursor: 'pointer' }}>Deploy automático após cada compilação</label>
              </div>
            </div>
            <div className="dlg-f">
              <button className="btn bo" onClick={() => setDlg(false)}>Cancelar</button>
              <button className="btn bf" onClick={save}>💾 Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project: p, openMenu, setOpenMenu, menuRef, onEdit, onDelete, onDeploy, onDetails, deploying }) {
  const isOpen = openMenu === p.id;
  const lastBuild = p.build_history?.[0];

  return (
    <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Gear menu */}
      <div ref={isOpen ? menuRef : null} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
        <button
          className="ib"
          style={{ fontSize: 14 }}
          onClick={e => { e.stopPropagation(); setOpenMenu(isOpen ? null : p.id); }}
        >
          ⚙
        </button>
        {isOpen && (
          <div style={{ position: 'absolute', top: 38, right: 0, width: 180, background: '#fff', border: '1px solid var(--ovV)', borderRadius: 10, boxShadow: 'var(--e3)', zIndex: 200, overflow: 'hidden', padding: 4 }}>
            {[
              { ico: '✏️', l: 'Editar Projeto', fn: onEdit },
              { ico: '📡', l: 'Configurar FTP', fn: onEdit },
              { ico: '⚡', l: 'Associar Builds', fn: () => { setOpenMenu(null); onDetails(); } },
              { ico: '👥', l: 'Gerenciar Equipe', fn: () => setOpenMenu(null) },
            ].map(item => (
              <button key={item.l} onClick={item.fn} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 7, fontFamily: 'inherit', color: 'var(--on)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--s1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span>{item.ico}</span> {item.l}
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--ovV)', margin: '4px 0' }} />
            <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 7, fontFamily: 'inherit', color: C.err }}
              onMouseEnter={e => e.currentTarget.style.background = C.errC}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span>🗑</span> Excluir
            </button>
          </div>
        )}
      </div>

      <div className="cb" style={{ flex: 1, paddingTop: 16, paddingRight: 44 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: C.on }}>{p.name}</div>
        {p.description && (
          <div style={{ fontSize: 12, color: C.onV, marginBottom: 10, lineHeight: 1.4 }}>{p.description}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: C.onV }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: C.sec }}>📅</span>
            Criado em: <strong style={{ color: C.on }}>{new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
          </div>
          {lastBuild && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: C.warn }}>⏱</span>
              Último build: <strong style={{ color: C.on }}>{new Date(lastBuild.created_at).toLocaleDateString('pt-BR')}</strong>
              <span className={`st-badge st-${lastBuild.status}`} style={{ fontSize: 10 }}>
                {lastBuild.status === 'completed' ? 'concluído' : lastBuild.status}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <button
          className="btn bt"
          style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
          onClick={onDetails}
        >
          ↗ Ver Detalhes Completos
        </button>
      </div>
    </div>
  );
}
