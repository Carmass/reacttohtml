import { C } from '../lib/tokens.js';
import BuildProgressDetailed from '../components/compiler/BuildProgressDetailed.jsx';
import { callEdgeFunction } from '../lib/supabase.js';

const STATUS_CHIP = { completed: 'cs', processing: 'cw', failed: 'ce', queued: 'cg' };
const STATUS_LABELS = { completed: 'Concluído', processing: 'Processando', failed: 'Falhou', queued: 'Na fila' };

export default function BuildDetailsPage({ params, go }) {
  const build = params?.build;

  if (!build) {
    return (
      <div className="empty">
        <div className="empty-ico">⚡</div>
        <div>Build não encontrado</div>
        <button className="btn bt bsm" style={{ marginTop: 8 }} onClick={() => go('compiler')}>← Compilador</button>
      </div>
    );
  }

  async function download() {
    try {
      const { signed_url } = await callEdgeFunction('download-compiled-file', { build_id: build.id });
      window.open(signed_url, '_blank');
    } catch {
      if (build.compiled_file_url) window.open(build.compiled_file_url, '_blank');
    }
  }

  const sizeKB  = build.file_size ? (build.file_size / 1024).toFixed(0) : null;
  const sizeMB  = build.file_size && build.file_size > 1024 * 1024 ? (build.file_size / 1024 / 1024).toFixed(1) : null;

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: '0 auto' }}>
      <button className="btn bt bsm" style={{ marginBottom: 16 }} onClick={() => go('compiler')}>← Compilador</button>

      {/* Build header card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cb" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: build.status === 'completed' ? C.sucC : build.status === 'failed' ? C.errC : C.warnC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
            {build.status === 'completed' ? '✅' : build.status === 'failed' ? '❌' : '⏳'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.on }}>{build.project_name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`chip ${STATUS_CHIP[build.status] ?? 'cg'}`}>
                {STATUS_LABELS[build.status] ?? build.status}
              </span>
              {build.ai_tool && <span className="chip cp">{build.ai_tool}</span>}
              <span style={{ fontSize: 11, color: C.onV }}>
                {new Date(build.created_at).toLocaleString('pt-BR')}
              </span>
              {build.build_duration && (
                <span style={{ fontSize: 11, color: C.onV }}>⏱ {build.build_duration}s</span>
              )}
            </div>
          </div>
          {build.status === 'completed' && (
            <button className="btn bf" onClick={download}>
              ⬇ Baixar HTML Compilado
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="ch"><span className="ct">⚡ Progresso do Build</span></div>
        <div className="cb">
          <BuildProgressDetailed status={build.status} buildSteps={build.build_steps} elapsed={build.build_duration} logs={build.logs} />
        </div>
      </div>

      {/* Error */}
      {build.error_message && (
        <div className="card" style={{ marginBottom: 16, borderColor: C.err }}>
          <div className="ch"><span className="ct" style={{ color: C.err }}>❌ Erro de Compilação</span></div>
          <div className="cb">
            <div style={{ background: C.errC, color: C.err, borderRadius: 8, padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.6 }}>
              {build.error_message}
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {build.logs && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="ch"><span className="ct">📄 Logs do Build</span></div>
          <div className="cb">
            <div className="logs-box">{build.logs}</div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card">
        <div className="ch"><span className="ct">ℹ️ Informações do Build</span></div>
        <div className="cb">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            {[
              ['ID do Build', build.id?.slice(0, 18) + '…'],
              ['Ferramenta de IA', build.ai_tool ?? '—'],
              ['APP ID', build.app_id ?? '—'],
              ['Tamanho do arquivo', sizeMB ? `${sizeMB} MB` : sizeKB ? `${sizeKB} KB` : '—'],
              ['Duração da compilação', build.build_duration ? `${build.build_duration}s` : '—'],
              ['GitHub Run ID', build.github_run_id ?? '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--ovV)', fontSize: 13 }}>
                <span style={{ color: C.onV }}>{k}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', maxWidth: 200, wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
