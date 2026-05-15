import { useState } from 'react';
import { C } from '../lib/tokens.js';
import { useBuildHistory, useAuth } from '../hooks/useDB.js';

const TOOLS = ['Base44', 'Lovable', 'Bolt', 'v0', 'Outro'];
const TOOL_COLORS = ['#7C3AED', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EF4444'];
const PAGE_SIZE = 10;

const STATUS_LABELS = { completed: 'Concluído', processing: 'Processando', failed: 'Falhou', queued: 'Na fila' };
const STATUS_CHIP   = { completed: 'cs', processing: 'cw', failed: 'ce', queued: 'cg' };

/* ── Charts ── */
function DonutChart({ value, total, color, label }) {
  if (total === 0) return <div style={{ textAlign: 'center', padding: 20, color: C.onV, fontSize: 12 }}>Sem dados</div>;
  const pct = Math.round((value / total) * 100);
  const r = 48, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ovV)" strokeWidth="12" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .4s ease' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill={C.on}>{pct}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill={C.onV}>{label}</text>
      </svg>
    </div>
  );
}

function LineChart({ data }) {
  if (!data.length || data.every(d => d.count === 0)) {
    return <div className="empty" style={{ padding: 40, fontSize: 12 }}>Nenhum dado no período</div>;
  }
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 320, H = 80;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (d.count / max) * H * 0.9 - 4,
    ...d,
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M ${pts[0].x},${H} ` + pts.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${pts[pts.length-1].x},${H} Z`;

  return (
    <svg width="100%" height={H + 24} viewBox={`0 0 ${W} ${H + 24}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.p} stopOpacity="0.15" />
          <stop offset="100%" stopColor={C.p} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <polyline points={polyline} fill="none" stroke={C.p} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => p.count > 0 && (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={C.p} strokeWidth="2" />
        </g>
      ))}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H + 16} textAnchor="middle" fontSize="9" fill={C.onV}>{p.label}</text>
      ))}
    </svg>
  );
}

function BarChart({ data, maxVal }) {
  if (!data.length) return <div className="empty" style={{ padding: 24 }}>Sem dados</div>;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TOOL_COLORS[i % TOOL_COLORS.length] }}>{d.count}</span>
          <div style={{
            width: '80%',
            background: TOOL_COLORS[i % TOOL_COLORS.length],
            borderRadius: '4px 4px 0 0',
            height: `${Math.max(6, (d.count / maxVal) * 80)}px`,
            transition: 'height .3s',
          }} />
          <span style={{ fontSize: 10, color: C.onV, textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage({ go }) {
  const { data: builds } = useBuildHistory(500);
  const { profile }      = useAuth();
  const [period, setPeriod]       = useState('day');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTool, setFilterTool]     = useState('all');
  const [page, setPage]           = useState(1);

  const completed = builds.filter(b => b.status === 'completed').length;
  const failed    = builds.filter(b => b.status === 'failed').length;
  const processing = builds.filter(b => b.status === 'processing').length;
  const today     = builds.filter(b => b.created_at?.startsWith(new Date().toISOString().split('T')[0])).length;
  const avgTime   = builds.filter(b => b.build_duration).reduce((a, b) => a + b.build_duration, 0) /
                    (builds.filter(b => b.build_duration).length || 1);

  const byTool = TOOLS
    .map(t => ({ label: t, count: builds.filter(b => b.ai_tool === t).length }))
    .filter(d => d.count > 0);
  const maxTool = Math.max(...byTool.map(d => d.count), 1);

  const periodDays = period === 'day' ? 7 : period === 'week' ? 8 : 6;
  const trendData  = Array.from({ length: periodDays }, (_, i) => {
    const d = new Date();
    if (period === 'day') {
      d.setDate(d.getDate() - (periodDays - 1 - i));
      const key = d.toISOString().split('T')[0];
      return { label: d.toLocaleDateString('pt-BR', { weekday: 'short' }), count: builds.filter(b => b.created_at?.startsWith(key)).length };
    } else if (period === 'week') {
      d.setDate(d.getDate() - (periodDays - 1 - i) * 7);
      const weekStart = d.toISOString().split('T')[0];
      const weekEnd   = new Date(d); weekEnd.setDate(weekEnd.getDate() + 6);
      return { label: `S${i + 1}`, count: builds.filter(b => b.created_at >= weekStart && b.created_at <= weekEnd.toISOString()).length };
    } else {
      d.setMonth(d.getMonth() - (periodDays - 1 - i));
      const mo = d.toISOString().slice(0, 7);
      return { label: d.toLocaleDateString('pt-BR', { month: 'short' }), count: builds.filter(b => b.created_at?.startsWith(mo)).length };
    }
  });

  const filteredBuilds = builds.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterTool   !== 'all' && b.ai_tool !== filterTool)   return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredBuilds.length / PAGE_SIZE));
  const pageBuilds = filteredBuilds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="fade-in">
      {/* Metrics row */}
      <div className="mg" style={{ marginBottom: 20 }}>
        {[
          { l: 'Total de Builds', v: builds.length, d: 'todos os tempos', ico: '⚡', col: C.pC, vCol: C.p },
          { l: 'Compilados',  v: completed,  d: `${builds.length ? Math.round(completed / builds.length * 100) : 0}% de sucesso`, ico: '✅', col: C.sucC, vCol: C.suc },
          { l: 'Falhas',      v: failed,     d: `${builds.length ? Math.round(failed / builds.length * 100) : 0}% de falha`, ico: '❌', col: C.errC, vCol: C.err },
          { l: 'Tempo médio', v: avgTime > 0 ? `${Math.round(avgTime)}s` : '—', d: 'por build', ico: '⏱', col: C.warnC, vCol: C.warn },
        ].map((m, i) => (
          <div key={i} className="card" style={{ background: m.col, border: 'none' }}>
            <div className="cb" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div className="ml" style={{ marginBottom: 6 }}>{m.l}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: m.vCol, lineHeight: 1 }}>{m.v}</div>
                  <div className="md" style={{ marginTop: 4 }}>{m.d}</div>
                </div>
                <div style={{ fontSize: 28, opacity: .65 }}>{m.ico}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="two" style={{ marginBottom: 16 }}>
        {/* Trend chart */}
        <div className="card">
          <div className="ch" style={{ paddingBottom: 12 }}>
            <span className="ct">📈 Tendências</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[['day', '7D'], ['week', '8S'], ['month', '6M']].map(([k, l]) => (
                <button
                  key={k}
                  className={`btn bsm ${period === k ? 'bf' : 'bt'}`}
                  style={{ height: 26, padding: '0 10px', fontSize: 11 }}
                  onClick={() => setPeriod(k)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="cb" style={{ paddingTop: 8 }}>
            <LineChart data={trendData} />
          </div>
        </div>

        {/* Donut charts */}
        <div className="card">
          <div className="ch" style={{ paddingBottom: 8 }}>
            <span className="ct">🍩 Status</span>
          </div>
          <div className="cb" style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <DonutChart value={completed} total={builds.length} color={C.suc} label="sucesso" />
            <div style={{ flex: 1, minWidth: 120 }}>
              {[
                { l: 'Concluídos', v: completed, c: C.suc },
                { l: 'Falhas',     v: failed,    c: C.err },
                { l: 'Em andamento', v: processing, c: C.warn },
                { l: 'Hoje',       v: today,     c: C.p },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.c, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.onV, flex: 1 }}>{s.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.on }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tools bar chart */}
      {byTool.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="ch"><span className="ct">🛠️ Ferramentas Mais Usadas</span></div>
          <div className="cb">
            <BarChart data={byTool} maxVal={maxTool} />
          </div>
        </div>
      )}

      {/* History table */}
      <div className="card">
        <div className="ch">
          <span className="ct">📋 Histórico de Compilações</span>
          <button className="btn bsm bf" onClick={() => go('compiler')}>⚡ Novo Build</button>
        </div>
        <div className="cb" style={{ paddingTop: 10 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="fi" style={{ height: 32, fontSize: 12, padding: '0 8px', width: 140 }} value={filterTool} onChange={e => { setFilterTool(e.target.value); setPage(1); }}>
              <option value="all">Todas as ferramentas</option>
              {TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="fi" style={{ height: 32, fontSize: 12, padding: '0 8px', width: 140 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="all">Todos os status</option>
              <option value="completed">Concluído</option>
              <option value="failed">Falhou</option>
              <option value="processing">Processando</option>
              <option value="queued">Na fila</option>
            </select>
            <span style={{ fontSize: 12, color: C.onV, marginLeft: 'auto' }}>
              {filteredBuilds.length} resultado{filteredBuilds.length !== 1 ? 's' : ''}
            </span>
          </div>

          {builds.length === 0 ? (
            <div className="empty" style={{ padding: 60 }}>
              <div className="empty-ico">📭</div>
              <div style={{ fontWeight: 600 }}>Nenhum build ainda</div>
              <button className="btn bf bsm" style={{ marginTop: 10 }} onClick={() => go('compiler')}>
                Compilar primeiro projeto
              </button>
            </div>
          ) : (
            <>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Projeto</th>
                    <th>Status</th>
                    <th>Data / Hora</th>
                    <th>Duração</th>
                    <th>Tamanho</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageBuilds.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{b.project_name}</div>
                        {b.ai_tool && <span className="chip cp" style={{ fontSize: 9 }}>{b.ai_tool}</span>}
                      </td>
                      <td>
                        <span className={`chip ${STATUS_CHIP[b.status] ?? 'cg'}`}>
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: 11, color: C.onV }}>
                        {new Date(b.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="mono" style={{ fontSize: 11 }}>
                        {b.build_duration ? `${b.build_duration}s` : '—'}
                      </td>
                      <td className="mono" style={{ fontSize: 11 }}>
                        {b.file_size ? `${Math.round(b.file_size / 1024)}KB` : '—'}
                      </td>
                      <td>
                        {b.status === 'completed' && b.compiled_file_url && (
                          <a href={b.compiled_file_url} download className="btn bsm bt" style={{ textDecoration: 'none', fontSize: 11 }}>
                            ⬇ Baixar
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ovV)' }}>
                  <button className="btn bsm bt" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
                  <span style={{ fontSize: 12, color: C.onV }}>Página {page} de {totalPages}</span>
                  <button className="btn bsm bt" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
