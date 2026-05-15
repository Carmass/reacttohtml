import { useState, useEffect, useRef } from 'react';
import { C } from '../lib/tokens.js';
import { supabase, callEdgeFunction } from '../lib/supabase.js';
import { useBuildHistory, createBuild, updateBuild, uploadBuildFile, deleteBuild, useAuth } from '../hooks/useDB.js';
import UploadZone from '../components/compiler/UploadZone.jsx';
import BuildProgressDetailed from '../components/compiler/BuildProgressDetailed.jsx';

const AI_TOOLS = [
  { id: 'Base44', ico: '🔷', color: '#7C3AED' },
  { id: 'Lovable', ico: '❤️', color: '#EC4899' },
  { id: 'Bolt', ico: '⚡', color: '#3B82F6' },
  { id: 'v0', ico: '▲', color: '#000' },
  { id: 'Outro', ico: '🛠️', color: '#6B7280' },
];

const POLL_INTERVAL = 8000;
const PAGE_SIZE = 8;

const STATUS_COLORS = {
  completed: C.suc, processing: C.warn, failed: C.err, queued: C.sec,
};
const STATUS_LABELS = {
  completed: 'Concluído', processing: 'Processando', failed: 'Falhou', queued: 'Na fila',
};
const STATUS_CHIP = {
  completed: 'cs', processing: 'cw', failed: 'ce', queued: 'cg',
};

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1 3h11M4 3V2h5v1M5.5 5.5v4M7.5 5.5v4M2 3l1 8h7l1-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M10.5 2.5A5 5 0 1 0 11.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11.5 2v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function CompilerPage({ showToast, go }) {
  const { profile } = useAuth();
  const [files, setFiles]           = useState([]);
  const [aiTool, setAiTool]         = useState('');
  const [appId, setAppId]           = useState('');
  const [webhook, setWebhook]       = useState('');
  const [activeBuilds, setActiveBuilds] = useState([]);
  const [filterTool, setFilterTool] = useState('all');
  const [page, setPage]             = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const pollRef = useRef(null);

  const { data: history, refetch: refetchHistory } = useBuildHistory(200);

  const planName    = profile?.subscription_plan ?? 'Free';
  const dailyUsage  = profile?.daily_usage ?? 0;
  const planLimits  = { Free: 3, Starter: 10, Creator: 25, Pro: 50, Business: 999 };
  const limit       = planLimits[planName] ?? 3;
  const usagePct    = Math.min(100, Math.round((dailyUsage / limit) * 100));

  useEffect(() => () => clearInterval(pollRef.current), []);

  function startPolling(buildIds) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollBuilds(buildIds), POLL_INTERVAL);
  }

  async function pollBuilds(buildIds) {
    const toRemove = [];
    for (const buildId of buildIds) {
      try {
        const { data: row } = await supabase.from('build_history').select('*').eq('id', buildId).single();
        if (!row) { toRemove.push(buildId); continue; }
        if (row.status === 'processing') {
          try {
            const res = await callEdgeFunction('poll-tool-build', {
              build_id: buildId,
              repo: row.github_run_id?.split('/')[1],
              github_username: row.github_run_id?.split('/')[0],
              project_name: row.project_name,
              ai_tool: row.ai_tool,
            });
            setActiveBuilds(prev => prev.map(b =>
              b.buildId === buildId
                ? { ...b, status: res.status, logs: res.logs ?? b.logs, elapsed: Math.floor((Date.now() - b.startTime) / 1000) }
                : b
            ));
            if (res.status === 'completed' || res.status === 'failed') {
              toRemove.push(buildId);
              showToast(res.status === 'completed' ? `✅ ${row.project_name} compilado!` : `❌ Falha em ${row.project_name}`);
              refetchHistory();
            }
          } catch (_) {}
        } else if (row.status !== 'queued') {
          toRemove.push(buildId);
          refetchHistory();
        }
      } catch (_) {}
    }
    if (toRemove.length > 0) {
      setActiveBuilds(prev => prev.filter(b => !toRemove.includes(b.buildId)));
      const remaining = buildIds.filter(id => !toRemove.includes(id));
      if (remaining.length === 0) clearInterval(pollRef.current);
    }
  }

  async function compileSingle(file) {
    const projectName = file.name.replace(/\.(zip|jsx|tsx|js)$/, '');

    // Check daily limit
    let limitData;
    try {
      limitData = await callEdgeFunction('check-daily-limit');
    } catch (e) {
      showToast('❌ Erro ao verificar limite: ' + e.message);
      return null;
    }
    if (!limitData.can_compile) {
      showToast(`⛔ Limite diário atingido (${limitData.daily_usage}/${limitData.effective_limit})`);
      return null;
    }

    // Upload file
    const path = `${Date.now()}-${file.name}`;
    let fileUrl;
    try {
      fileUrl = await uploadBuildFile(file, path);
    } catch (e) {
      showToast('❌ Erro no upload: ' + e.message);
      return null;
    }

    // Create build record
    let build;
    try {
      build = await createBuild({
        user_id: profile?.id,
        project_name: projectName,
        original_file_url: fileUrl,
        file_size: file.size,
        status: 'processing',
        ai_tool: aiTool || null,
        app_id: appId || null,
      });
    } catch (e) {
      showToast('❌ Erro ao criar build: ' + e.message);
      return null;
    }

    await callEdgeFunction('increment-usage').catch(() => {});

    // Start the GitHub Actions build
    try {
      await callEdgeFunction('start-tool-build', {
        file_url: fileUrl,
        project_name: projectName,
        build_id: build.id,
        ai_tool: aiTool || undefined,
        app_id: appId || undefined,
        webhook_url: webhook || undefined,
      });
    } catch (e) {
      await updateBuild(build.id, { status: 'failed', error_message: e.message }).catch(() => {});
      showToast('❌ Erro ao iniciar build: ' + e.message);
      return null;
    }

    return { buildId: build.id, projectName, status: 'processing', startTime: Date.now(), elapsed: 0, logs: '' };
  }

  async function handleCompile() {
    if (files.length === 0) { showToast('Selecione pelo menos um arquivo'); return; }
    let results;
    try {
      results = await Promise.all(files.map(f => compileSingle(f)));
    } catch (e) {
      showToast('❌ Erro inesperado: ' + e.message);
      return;
    }
    const started = results.filter(Boolean);
    if (started.length === 0) return;
    setActiveBuilds(prev => [...prev, ...started]);
    setFiles([]);
    showToast(`⚡ ${started.length} build${started.length > 1 ? 's' : ''} iniciado${started.length > 1 ? 's' : ''}!`);
    startPolling([...activeBuilds.map(b => b.buildId), ...started.map(b => b.buildId)]);
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este build?')) return;
    await deleteBuild(id);
    refetchHistory();
  }

  const filtered    = filterTool === 'all' ? history : history.filter(b => b.ai_tool === filterTool);
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const completedCount  = history.filter(b => b.status === 'completed').length;

  return (
    <div className="fade-in">
      {/* Usage bar - full width at top */}
      {profile && (
        <div className="card" style={{ marginBottom: 16, background: usagePct >= 80 ? C.warnC : C.pC, border: 'none' }}>
          <div className="cb" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.on }}>
                  Uso diário — Plano {planName}
                </span>
                <span style={{ fontSize: 12, color: C.onV }}>
                  {dailyUsage} / {limit === 999 ? '∞' : limit} compilações
                </span>
              </div>
              <div className="prog-bar">
                <div
                  className="prog-fill"
                  style={{
                    width: `${usagePct}%`,
                    background: usagePct >= 80 ? C.warn : 'var(--p)',
                  }}
                />
              </div>
            </div>
            {planName === 'Free' && (
              <button className="btn bsm bf" onClick={() => go('plans')} style={{ flexShrink: 0 }}>
                ⬆️ Fazer upgrade
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* ── LEFT: Compiler form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload card */}
          <div className="card">
            <div className="ch">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                <div>
                  <div className="ct">Upload do Projeto</div>
                  <div style={{ fontSize: 11, color: C.onV }}>ZIP, JSX, TSX ou JS</div>
                </div>
              </div>
            </div>
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* AI Tool selector */}
              <div className="fld">
                <label>Qual ferramenta de AI você usou para gerar este projeto?</label>
                <select className="fi" value={aiTool} onChange={e => setAiTool(e.target.value)}>
                  <option value="">Todas as ferramentas</option>
                  {AI_TOOLS.map(t => (
                    <option key={t.id} value={t.id}>{t.ico} {t.id}</option>
                  ))}
                </select>
              </div>

              {/* Upload zone */}
              <UploadZone files={files} onChange={setFiles} multiple />

              {/* Advanced options toggle */}
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.onV, fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'inherit' }}
                onClick={() => setShowAdvanced(v => !v)}
              >
                {showAdvanced ? '▲' : '▼'} Opções avançadas
              </button>

              {showAdvanced && (
                <div className="two" style={{ gap: 10 }}>
                  <div className="fld">
                    <label>APP ID (opcional)</label>
                    <input className="fi" placeholder="ID do app na plataforma de IA" value={appId} onChange={e => setAppId(e.target.value)} />
                  </div>
                  <div className="fld">
                    <label>Webhook de Formulários (opcional)</label>
                    <input className="fi" placeholder="https://seu-webhook.com" value={webhook} onChange={e => setWebhook(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Compile button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  className="btn bf blg"
                  onClick={handleCompile}
                  disabled={files.length === 0}
                >
                  ⚡ {files.length > 1 ? `Compilar ${files.length} Projetos` : 'Compilar Projeto'}
                </button>
                {files.length > 0 && (
                  <span style={{ fontSize: 12, color: C.onV }}>
                    {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active builds */}
          {activeBuilds.map(b => (
            <div key={b.buildId} className="card">
              <div className="ch">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1s infinite' }} />
                  <span className="ct">⚡ {b.projectName}</span>
                </div>
                <span className="chip cw">
                  {b.elapsed > 0 ? `${b.elapsed}s` : 'Iniciando…'}
                </span>
              </div>
              <div className="cb">
                <BuildProgressDetailed status={b.status} elapsed={b.elapsed} logs={b.logs} />
              </div>
            </div>
          ))}

          {/* How it works (empty state) */}
          {activeBuilds.length === 0 && files.length === 0 && (
            <div className="card">
              <div className="ch"><span className="ct">ℹ️ Como funciona</span></div>
              <div className="cb">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[
                    { n: '1', ico: '📤', t: 'Upload', d: 'Envie o ZIP ou JSX do seu projeto gerado por IA' },
                    { n: '2', ico: '⚙️', t: 'Compilação', d: 'GitHub Actions instala deps, aplica mocks e compila com Vite' },
                    { n: '3', ico: '⬇️', t: 'Download', d: 'Baixe o HTML estático pronto para hospedar em qualquer servidor' },
                  ].map(s => (
                    <div key={s.n} style={{ textAlign: 'center', padding: '20px 12px', background: C.pC, borderRadius: 12 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{s.ico}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: C.on }}>{s.t}</div>
                      <div style={{ fontSize: 12, color: C.onV, lineHeight: 1.5 }}>{s.d}</div>
                    </div>
                  ))}
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--ovV)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { l: 'Total de builds', v: history.length },
                    { l: 'Concluídos', v: completedCount },
                    { l: 'Taxa de sucesso', v: history.length ? `${Math.round(completedCount / history.length * 100)}%` : '—' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: C.p }}>{s.v}</div>
                      <div style={{ fontSize: 11, color: C.onV }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: History sidebar ── */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="ch" style={{ paddingBottom: 12, borderBottom: '1px solid var(--ovV)' }}>
            <span className="ct">Histórico de Builds</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                className="fi"
                style={{ height: 28, fontSize: 11, padding: '0 8px', width: 120 }}
                value={filterTool}
                onChange={e => { setFilterTool(e.target.value); setPage(1); }}
              >
                <option value="all">Todas</option>
                {AI_TOOLS.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
              </select>
              <span className="chip cp" style={{ fontSize: 10 }}>{filtered.length}</span>
            </div>
          </div>

          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {paginated.length === 0 ? (
              <div className="empty" style={{ padding: 40 }}>
                <div className="empty-ico">📭</div>
                <div style={{ fontSize: 12 }}>Nenhum build ainda</div>
              </div>
            ) : (
              paginated.map(b => (
                <BuildHistoryItem key={b.id} b={b} onDelete={handleDelete} go={go} />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--ovV)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <button className="btn bsm bt" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
              <span style={{ color: C.onV }}>{page} / {totalPages}</span>
              <button className="btn bsm bt" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          )}

          {history.length > 0 && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--ovV)' }}>
              <button className="btn bsm bt" style={{ width: '100%' }} onClick={() => go('dashboard')}>
                📊 Ver Dashboard completo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BuildHistoryItem({ b, onDelete, go }) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ovV)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      {/* Status dot */}
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[b.status] ?? C.onV, flexShrink: 0, marginTop: 5 }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.on, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
            {b.project_name}
          </span>
          {b.ai_tool && <span className="chip cp" style={{ fontSize: 9, padding: '2px 6px' }}>{b.ai_tool}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span className={`chip ${STATUS_CHIP[b.status] ?? 'cg'}`} style={{ fontSize: 9, padding: '2px 6px' }}>
            {STATUS_LABELS[b.status] ?? b.status}
          </span>
          {b.build_duration && <span style={{ fontSize: 10, color: C.onV }}>{b.build_duration}s</span>}
        </div>
        <div style={{ fontSize: 10, color: C.onV }}>
          {new Date(b.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </div>
        {b.error_message && (
          <div style={{ fontSize: 10, color: C.err, marginTop: 3, lineHeight: 1.3 }}>
            {b.error_message.slice(0, 60)}{b.error_message.length > 60 ? '…' : ''}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {b.status === 'completed' && b.compiled_file_url && (
          <a
            href={b.compiled_file_url}
            download
            style={{ width: 26, height: 26, borderRadius: 6, background: C.sucC, color: C.suc, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            title="Baixar"
          >
            <DownloadIcon />
          </a>
        )}
        <button
          style={{ width: 26, height: 26, borderRadius: 6, background: C.errC, color: C.err, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Excluir"
          onClick={() => onDelete(b.id)}
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
