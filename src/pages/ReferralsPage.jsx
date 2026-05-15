import { useState } from 'react';
import { C } from '../lib/tokens.js';
import { useReferrals, useAuth } from '../hooks/useDB.js';

const TIERS = [
  { name: 'Bronze',   min: 0,  max: 4,  ico: '🥉', color: '#CD7F32', bg: '#FEF3E2' },
  { name: 'Prata',    min: 5,  max: 14, ico: '🥈', color: '#9CA3AF', bg: '#F3F4F6' },
  { name: 'Ouro',     min: 15, max: 29, ico: '🥇', color: '#F59E0B', bg: '#FEF3C7' },
  { name: 'Platina',  min: 30, max: 49, ico: '💎', color: '#6366F1', bg: '#EEF2FF' },
  { name: 'Diamante', min: 50, max: Infinity, ico: '💠', color: '#7C3AED', bg: '#EDE9FE' },
];

function getCurrentTier(count) {
  return TIERS.find(t => count >= t.min && count <= t.max) ?? TIERS[0];
}

function getNextTier(count) {
  const idx = TIERS.findIndex(t => count >= t.min && count <= t.max);
  return TIERS[idx + 1] ?? null;
}

const SHARE_BUTTONS = [
  { name: 'WhatsApp',  color: '#25D366', ico: '💬', url: (link) => `https://wa.me/?text=${encodeURIComponent(`Compile seus projetos React em HTML com o React to HTML Compiler! ${link}`)}` },
  { name: 'Twitter',   color: '#1DA1F2', ico: '🐦', url: (link) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Compile seus projetos React em HTML! ${link}`)}` },
  { name: 'LinkedIn',  color: '#0A66C2', ico: '💼', url: (link) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}` },
  { name: 'Facebook',  color: '#1877F2', ico: '📘', url: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
  { name: 'Telegram',  color: '#26A5E4', ico: '✈️', url: (link) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Compile seus projetos React em HTML gratuitamente!')}` },
  { name: 'E-mail',    color: '#6B7280', ico: '📧', url: (link) => `mailto:?subject=${encodeURIComponent('React to HTML Compiler')}&body=${encodeURIComponent(`Confira o React to HTML Compiler: ${link}`)}` },
];

export default function ReferralsPage({ showToast }) {
  const { profile } = useAuth();
  const { data: referrals } = useReferrals();

  const refLink = profile?.referral_code
    ? `${window.location.origin}/?ref=${profile.referral_code}`
    : '';

  const rewarded = referrals.filter(r => r.status === 'rewarded').length;
  const pending  = referrals.filter(r => r.status === 'pending').length;

  const tier     = getCurrentTier(rewarded);
  const nextTier = getNextTier(rewarded);
  const progress = nextTier ? ((rewarded - tier.min) / (nextTier.min - tier.min)) * 100 : 100;

  function copy() {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    showToast('📋 Link copiado!');
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* How it works */}
      <div className="card">
        <div className="ch"><span className="ct">🔑 Como funciona</span></div>
        <div className="cb">
          <div className="three">
            {[
              { n: '1', ico: '🔗', t: 'Compartilhe seu link', d: 'Envie seu link de indicação para amigos, use as redes sociais' },
              { n: '2', ico: '👤', t: 'Eles se cadastram', d: 'Quando alguém usa seu link para se cadastrar, você ganha créditos' },
              { n: '3', ico: '🎁', t: 'Ganhe recompensas', d: '3 créditos por indicação válida. No Ouro +1% ao seu plano pago' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: C.s1, borderRadius: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.p, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                  {s.n}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: C.onV, lineHeight: 1.4 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mg">
        {[
          { l: 'Créditos Disponíveis', v: profile?.credits ?? 0, ico: '💰', col: C.sucC },
          { l: 'Total Indicações', v: referrals.length, ico: '👥', col: C.pC },
          { l: 'Aguardando Validação', v: pending, ico: '⏳', col: C.warnC },
          { l: 'Validados', v: rewarded, ico: '✅', col: C.sucC },
        ].map((m, i) => (
          <div key={i} className="card" style={{ background: m.col, border: 'none' }}>
            <div className="cb" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="ml">{m.l}</div>
                  <div className="mv" style={{ fontSize: 26 }}>{m.v}</div>
                </div>
                <span style={{ fontSize: 24 }}>{m.ico}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Level + Link row */}
      <div className="two" style={{ gap: 16 }}>
        {/* Tier system */}
        <div className="card">
          <div className="ch"><span className="ct">🏆 Seu Nível de Indicador</span></div>
          <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 4 }}>{tier.ico}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: tier.color }}>{tier.name}</div>
              {nextTier && (
                <div style={{ fontSize: 12, color: C.onV, marginTop: 2 }}>
                  {nextTier.min - rewarded} indicações para {nextTier.name}
                </div>
              )}
              <div style={{ marginTop: 10, maxWidth: 200, margin: '10px auto 0' }}>
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${Math.min(progress, 100)}%`, background: tier.color }} />
                </div>
                <div style={{ fontSize: 11, color: C.onV, marginTop: 4, textAlign: 'center' }}>
                  {rewarded} / {nextTier ? nextTier.min : tier.min} indicações
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: C.onV, fontWeight: 600, marginBottom: 4 }}>Todos os Níveis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TIERS.map(t => {
                const active = t.name === tier.name;
                return (
                  <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: active ? t.bg : 'transparent', border: active ? `1.5px solid ${t.color}30` : '1.5px solid transparent' }}>
                    <span style={{ fontSize: 18 }}>{t.ico}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? t.color : C.onV }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: C.onV }}>
                        {t.max === Infinity ? `${t.min}+ indicações` : `${t.min}–${t.max} indicações`}
                      </div>
                    </div>
                    {active && <span style={{ fontSize: 10, fontWeight: 700, color: t.color }}>ATUAL</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Link + Share */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="ch"><span className="ct">🔗 Seu Link de Indicação</span></div>
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: C.onV }}>
                Compartilhe este link para ganhar créditos para cada pessoa que se cadastrar!
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="fi"
                  value={refLink || 'Crie sua conta para obter um link'}
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <button className="btn bf bsm" onClick={copy} disabled={!refLink} style={{ flexShrink: 0 }}>
                  📋 Copiar
                </button>
              </div>
              <button
                className="btn bo"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  if (navigator.share && refLink) {
                    navigator.share({ title: 'React to HTML Compiler', url: refLink });
                  } else copy();
                }}
              >
                📤 Compartilhar nas Redes Sociais
              </button>
              <div style={{ fontSize: 11, color: C.onV }}>
                💡 Compartilhe no WhatsApp, Twitter, LinkedIn e muito mais para maximizar suas indicações.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="ch"><span className="ct">📣 Compartilhar nas Redes Sociais</span></div>
            <div className="cb">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {SHARE_BUTTONS.map(btn => (
                  <a
                    key={btn.name}
                    href={refLink ? btn.url(refLink) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => { if (!refLink) { e.preventDefault(); showToast('Faça login para obter seu link'); } }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, background: btn.color + '18', color: btn.color, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: `1px solid ${btn.color}30` }}
                  >
                    <span style={{ fontSize: 16 }}>{btn.ico}</span>
                    {btn.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals history */}
      <div className="card">
        <div className="ch"><span className="ct">📋 Histórico de Indicações</span></div>
        <div className="cb">
          {referrals.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">📭</div>
              Nenhuma indicação ainda.
              <div style={{ fontSize: 12, color: C.onV, marginTop: 4 }}>Comece compartilhando seu link de indicação!</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Indicado</th>
                  <th>Status</th>
                  <th>Score Fraude</th>
                  <th>Data</th>
                  <th>Créditos</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id}>
                    <td>{r.referred?.name ?? r.referred?.email ?? 'Usuário'}</td>
                    <td>
                      <span className={`st-badge ${r.status === 'rewarded' ? 'st-completed' : r.status === 'invalid' ? 'st-failed' : 'st-queued'}`}>
                        {r.status === 'rewarded' ? 'Válido' : r.status === 'invalid' ? 'Inválido' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: r.fraud_score > 70 ? C.err : r.fraud_score > 40 ? C.warn : C.suc, fontWeight: 700 }}>
                        {r.fraud_score ?? '—'}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 11, color: C.onV }}>
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      {r.status === 'rewarded' && <span className="chip cs">+3 créditos</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
