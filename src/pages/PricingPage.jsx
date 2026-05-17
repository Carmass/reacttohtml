import { useState, useEffect, useRef } from 'react';
import { LANGS, I18N } from '../lib/i18n.js';

const TABLE_VALUES = {
  starter:  ['3',  '✓', '—', '—', '—', '—', '10MB',  0,   '—', '—', '—',     '—', '—'],
  creator:  ['10', '✓', '✓', '—', '✓', '—', '50MB',  1,   '✓', '—', '—',     '—', '—'],
  pro:      ['50', '✓', '✓', '✓', '✓', '✓', '200MB', 2,   '✓', '✓', '99.5%', '—', '—'],
  business: ['100','✓', '✓', '✓', '✓', '✓', '200MB', 3,   '✓', '✓', '99.9%', '✓', '✓'],
};

function Logo({ size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 20 20" fill="none">
        <path d="M6 7L3 10L6 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 7L17 10L14 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 5L9 15" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

export default function PricingPage({ go }) {
  const [lang, setLang]         = useState('pt');
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const P = '#7C3AED';
  const t = I18N[lang] || I18N.pt;

  useEffect(() => {
    fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
      const map = { BR: 'pt', US: 'en', GB: 'en', CA: 'en', AU: 'en', ES: 'es', MX: 'es', AR: 'es', CO: 'es', FR: 'fr', DE: 'de', AT: 'de', CH: 'de', CN: 'zh', TW: 'zh', HK: 'zh', JP: 'ja' };
      const detected = map[d.country_code];
      if (detected) setLang(detected);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function h(e) { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

  function goToSection(sectionId) {
    sessionStorage.setItem('scrollToSection', sectionId);
    go('landing');
  }

  const navActions = [
    () => goToSection('recursos'),
    () => goToSection('como-funciona'),
    null,
    () => goToSection('faq'),
  ];

  const PLANS = [
    { name: 'Starter',  price: '$0',     period: '',            builds: '3',   highlight: false, badge: null,         key: 'starter' },
    { name: 'Creator',  price: '$3.99',  period: t.plansPeriod, builds: '10',  highlight: true,  badge: t.plansBadge, key: 'creator' },
    { name: 'Pro',      price: '$9.99',  period: t.plansPeriod, builds: '50',  highlight: false, badge: null,         key: 'pro' },
    { name: 'Business', price: '$14.99', period: t.plansPeriod, builds: '100', highlight: false, badge: null,         key: 'business' },
  ];

  const tableRows = (t.pricingTableRows || []).map((row, i) => ({
    label: row.label,
    starter:  TABLE_VALUES.starter[i],
    creator:  TABLE_VALUES.creator[i],
    pro:      TABLE_VALUES.pro[i],
    business: TABLE_VALUES.business[i],
  }));

  function cellDisplay(val) {
    if (typeof val === 'number') return (t.pricingHistory || [])[val] ?? val;
    return val;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Inter',system-ui,sans-serif", color: '#1E1B4B', fontSize: 15 }}>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <button onClick={() => go('landing')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Logo size={36} />
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1E1B4B' }}>React to HTML</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {t.nav.map((l, i) => (
            <button key={l}
              onClick={() => navActions[i] ? navActions[i]() : undefined}
              style={{ background: 'none', border: 'none', cursor: navActions[i] ? 'pointer' : 'default', fontSize: 15, fontWeight: i === 2 ? 700 : 500, color: i === 2 ? P : '#6B7280', fontFamily: 'inherit', borderBottom: i === 2 ? `2px solid ${P}` : 'none', paddingBottom: i === 2 ? 2 : 0 }}
              onMouseEnter={e => { if (navActions[i]) e.currentTarget.style.color = '#1E1B4B'; }}
              onMouseLeave={e => { if (navActions[i]) e.currentTarget.style.color = '#6B7280'; }}
            >{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div ref={langRef} style={{ position: 'relative' }}>
            <button onClick={() => setLangOpen(o => !o)}
              style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#1E1B4B', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={currentLang.flagUrl} alt={currentLang.label} style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2 }} />
              {currentLang.label} ▾
            </button>
            {langOpen && (
              <div style={{ position: 'absolute', top: 42, right: 0, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 6px 24px rgba(0,0,0,.12)', overflow: 'hidden', minWidth: 120, zIndex: 200 }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); localStorage.setItem('rtoh_lang', l.code); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', background: lang === l.code ? '#F0EFFE' : 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: lang === l.code ? P : '#1E1B4B', fontWeight: lang === l.code ? 700 : 400, textAlign: 'left' }}>
                    <img src={l.flagUrl} alt={l.label} style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => go('login')} style={{ height: 38, padding: '0 20px', borderRadius: 9, border: `1.5px solid ${P}`, background: 'transparent', color: P, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.enter}
          </button>
          <button onClick={() => go('login')} style={{ height: 38, padding: '0 20px', borderRadius: 9, border: 'none', background: P, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.start}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: '#F0EFFE', padding: '72px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EDE9FE', color: P, borderRadius: 9999, padding: '5px 18px', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
            {t.pricingHeroChip}
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 16, color: '#1E1B4B' }}>
            {(t.pricingHeroTitle || '').split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </h1>
          <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.7 }}>{t.pricingHeroSub}</p>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section style={{ padding: '72px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 32 }}>
            {PLANS.map(p => (
              <div key={p.name} style={{ position: 'relative', background: p.highlight ? P : '#fff', borderRadius: 18, padding: '30px 22px', border: p.highlight ? 'none' : '1.5px solid #E5E7EB', boxShadow: p.highlight ? '0 8px 32px rgba(124,58,237,.28)' : '0 1px 4px rgba(0,0,0,.06)', transform: p.highlight ? 'scale(1.04)' : 'none', display: 'flex', flexDirection: 'column' }}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#F59E0B', color: '#fff', borderRadius: 9999, padding: '4px 16px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ fontSize: 17, fontWeight: 700, color: p.highlight ? '#fff' : '#1E1B4B', marginBottom: 5 }}>{p.name}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: p.highlight ? '#fff' : P, marginBottom: 3 }}>
                  {p.price}<span style={{ fontSize: 15, fontWeight: 400, opacity: .7 }}>{p.period}</span>
                </div>
                <div style={{ fontSize: 14, color: p.highlight ? 'rgba(255,255,255,.8)' : '#6B7280', marginBottom: 20 }}>
                  {p.builds} {t.plansBuildsLabel}
                </div>
                <div style={{ flex: 1, marginBottom: 24 }}>
                  {((t.planFeatures || {})[p.name] || []).map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 9, fontSize: 13.5, color: p.highlight ? 'rgba(255,255,255,.9)' : '#374151', lineHeight: 1.45 }}>
                      <span style={{ color: p.highlight ? 'rgba(255,255,255,.9)' : '#10B981', marginTop: 1, flexShrink: 0 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { if (p.price !== '$0') sessionStorage.setItem('pendingPlan', p.name); go('login'); }}
                  style={{ width: '100%', height: 44, borderRadius: 9, border: p.highlight ? '2px solid rgba(255,255,255,.4)' : `2px solid ${P}`, background: p.highlight ? 'rgba(255,255,255,.18)' : 'transparent', color: p.highlight ? '#fff' : P, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {p.price === '$0' ? t.startFreeBtn : t.choosePlan}
                </button>
              </div>
            ))}
          </div>

          {/* All plans include */}
          <div style={{ background: '#F9FAFB', borderRadius: 16, padding: 28, border: '1px solid #E5E7EB', marginBottom: 32 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, textAlign: 'center', color: '#1E1B4B' }}>{t.plansAllInclude}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {(t.plansAllItems || []).map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: '#6B7280' }}>
                  <span style={{ color: '#10B981' }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => go('login')} style={{ height: 56, padding: '0 52px', borderRadius: 13, border: 'none', background: P, color: '#fff', fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(124,58,237,.35)' }}>
              {t.startToday}
            </button>
            <p style={{ marginTop: 12, fontSize: 14, color: '#9CA3AF' }}>{t.noCard}</p>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section style={{ padding: '40px 40px 88px', background: '#F9FAFB' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 36, color: '#1E1B4B' }}>{t.pricingTableTitle}</h2>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter',system-ui,sans-serif" }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#6B7280', width: '34%' }}>{t.pricingTableFeature}</th>
                  {PLANS.map(p => (
                    <th key={p.name} style={{ padding: '15px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: p.highlight ? P : '#1E1B4B' }}>
                      {p.name}
                      {p.highlight && <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700 }}>{t.pricingRecommended}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#374151', fontWeight: 500 }}>{row.label}</td>
                    {['starter','creator','pro','business'].map(k => {
                      const raw = row[k];
                      const val = cellDisplay(raw);
                      return (
                        <td key={k} style={{ padding: '14px 16px', textAlign: 'center', fontSize: 14, color: val === '✓' ? '#10B981' : val === '—' ? '#D1D5DB' : '#1E1B4B', fontWeight: val === '✓' ? 700 : 400 }}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', padding: '88px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 14 }}>{t.pricingCtaTitle}</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', marginBottom: 32 }}>{t.pricingCtaSub}</p>
          <button onClick={() => go('login')} style={{ height: 56, padding: '0 44px', borderRadius: 13, border: '2px solid rgba(255,255,255,.5)', background: 'transparent', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.pricingCtaBtn}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#111827', padding: '52px 40px 36px', color: 'rgba(255,255,255,.6)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 44, marginBottom: 44 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Logo size={34} />
                <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>React to HTML</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75 }}>{t.footerDesc}</p>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{t.footerProduct}</div>
              {[[t.footerCompiler, () => go('login')], [t.footerPricing, () => undefined]].map(([l, fn]) => (
                <button key={l} onClick={fn} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,.55)', fontFamily: 'inherit', padding: '5px 0', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
                >{l}</button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{t.footerResources}</div>
              {[[t.footerFAQ, () => goToSection('faq')], [t.footerSupport, () => go('login')]].map(([l, fn]) => (
                <button key={l} onClick={fn} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,.55)', fontFamily: 'inherit', padding: '5px 0', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
                >{l}</button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{t.footerCompany}</div>
              {[[t.footerAccount, () => go('login')], [t.footerReferrals, () => go('login')]].map(([l, fn]) => (
                <button key={l} onClick={fn} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,.55)', fontFamily: 'inherit', padding: '5px 0', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
                >{l}</button>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 13 }}>{t.footerCopy}</span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ width: 38, height: 38, borderRadius: '50%', background: P, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 17 }}>↑</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
