import { useState, useEffect, useRef } from 'react';
import { callEdgeFunction } from '../lib/supabase.js';
import { LANGS, I18N } from '../lib/i18n.js';

function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }

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

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #E5E7EB' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#1E1B4B', lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: '#7C3AED', fontSize: 18, flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(45deg)' : 'none', fontWeight: 700 }}>+</span>
      </button>
      {open && <div style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, paddingBottom: 18 }}>{a}</div>}
    </div>
  );
}

function CodeMockup({ t }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 12px 40px rgba(124,58,237,.15),0 2px 8px rgba(0,0,0,.08)', overflow: 'hidden', maxWidth: 440, width: '100%' }}>
      <div style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
        <div style={{ flex: 1 }} />
        <div style={{ background: '#10B981', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>VSB Claude</div>
      </div>
      <div style={{ background: '#1E1B4B', padding: '16px 20px', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 13, lineHeight: 1.7 }}>
        <div><span style={{ color: '#C792EA' }}>import</span> <span style={{ color: '#82AAFF' }}>React</span> <span style={{ color: '#C792EA' }}>from</span> <span style={{ color: '#C3E88D' }}>'react'</span></div>
        <div style={{ marginTop: 6 }}><span style={{ color: '#C792EA' }}>export default function</span> <span style={{ color: '#82AAFF' }}>App</span><span style={{ color: '#89DDFF' }}>()</span> <span style={{ color: '#89DDFF' }}>{'{'}</span></div>
        <div style={{ paddingLeft: 16 }}><span style={{ color: '#C792EA' }}>return</span> <span style={{ color: '#89DDFF' }}>(</span></div>
        <div style={{ paddingLeft: 32 }}><span style={{ color: '#89DDFF' }}>&lt;</span><span style={{ color: '#F07178' }}>div</span> <span style={{ color: '#FFCB6B' }}>className</span><span style={{ color: '#89DDFF' }}>=</span><span style={{ color: '#C3E88D' }}>"app"</span><span style={{ color: '#89DDFF' }}>&gt;</span></div>
        <div style={{ paddingLeft: 48 }}><span style={{ color: '#89DDFF' }}>&lt;</span><span style={{ color: '#F07178' }}>h1</span><span style={{ color: '#89DDFF' }}>&gt;</span><span style={{ color: '#fff' }}>Landing Page</span><span style={{ color: '#89DDFF' }}>&lt;/</span><span style={{ color: '#F07178' }}>h1</span><span style={{ color: '#89DDFF' }}>&gt;</span></div>
        <div style={{ paddingLeft: 32 }}><span style={{ color: '#89DDFF' }}>&lt;/</span><span style={{ color: '#F07178' }}>div</span><span style={{ color: '#89DDFF' }}>&gt;</span></div>
        <div style={{ paddingLeft: 16 }}><span style={{ color: '#89DDFF' }}>)</span></div>
        <div><span style={{ color: '#89DDFF' }}>{'}'}</span></div>
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(124,58,237,.3)', borderRadius: 6, borderLeft: '3px solid #7C3AED' }}>
          <div style={{ color: '#C3E88D', fontSize: 12 }}>{t.codeConverting}</div>
          <div style={{ color: '#82AAFF', fontSize: 12 }}>{t.codeBuild}</div>
        </div>
      </div>
      <div style={{ background: '#F0EFFE', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
        <span style={{ fontSize: 13, color: '#065F46', fontWeight: 600 }}>{t.codeReady}</span>
      </div>
    </div>
  );
}

function PlanModal({ plan, onClose, go, t }) {
  const d = (t.planDetails || {})[plan.name] || {};
  function choosePlan() {
    onClose();
    if (plan.price !== '$0') sessionStorage.setItem('pendingPlan', plan.name);
    go('login');
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 36, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', margin: 0 }}>{t.planPrefix} {plan.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#7C3AED', marginBottom: 8 }}>{plan.price}<span style={{ fontSize: 15, fontWeight: 400, color: '#9CA3AF' }}>{plan.period}</span></div>
        <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>{d.desc}</p>
        <div style={{ marginBottom: 20 }}>
          {(d.extras || []).map(e => (
            <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 15, color: '#1E1B4B' }}>
              <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span> {e}
            </div>
          ))}
        </div>
        <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#2563EB', marginBottom: 24 }}>
          <strong>{t.planIdeal}</strong> {d.ideal}
        </div>
        <button onClick={choosePlan} style={{ width: '100%', height: 50, borderRadius: 10, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {t.planStartBtn} {plan.name}
        </button>
      </div>
    </div>
  );
}

function SaraWidget({ t }) {
  const [open, setOpen]       = useState(false);
  const [chat, setChat]       = useState([]);
  const [msg, setMsg]         = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && chat.length === 0) setChat([{ role: 'assistant', text: t.saraWelcome }]);
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  async function send() {
    if (!msg.trim() || loading) return;
    const q = msg; setMsg('');
    setChat(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await callEdgeFunction('support-chat', { message: q, history: chat });
      setChat(prev => [...prev, { role: 'assistant', text: res.reply ?? '...' }]);
    } catch {
      setChat(prev => [...prev, { role: 'assistant', text: '...' }]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 500 }}>
      {open && (
        <div style={{ position: 'absolute', bottom: 72, right: 0, width: 360, background: '#fff', borderRadius: 18, boxShadow: '0 8px 40px rgba(0,0,0,.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{t.saraTitle}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,.75)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} /> {t.saraOnline}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.7)', fontSize: 22, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ flex: 1, maxHeight: 320, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chat.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#7C3AED' : '#F3F4F6', color: m.role === 'user' ? '#fff' : '#1E1B4B', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 14px', maxWidth: '82%', fontSize: 14, lineHeight: 1.5 }}>
                {m.text}
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', background: '#F3F4F6', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', fontSize: 14, color: '#9CA3AF' }}>{t.saraTyping}</div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '10px 12px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
            <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={t.saraPh}
              style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={send} disabled={!msg.trim() || loading}
              style={{ height: 40, padding: '0 14px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              {t.saraSend}
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(124,58,237,.4)', fontSize: 26, color: '#fff', transition: 'transform .2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >{open ? '×' : '💬'}</button>
    </div>
  );
}

const STEP_COLORS = [
  { bg: '#EFF6FF', color: '#2563EB', ico: '📤' },
  { bg: '#FFF7ED', color: '#EA580C', ico: '⚙️' },
  { bg: '#F0FDF4', color: '#16A34A', ico: '⬇️' },
];

const FEAT_ICONS = ['🤖', '🚫', '⚡', '🖥', '💰', '😌'];

export default function LandingPage({ go }) {
  const [lang, setLang]           = useState('pt');
  const [langOpen, setLangOpen]   = useState(false);
  const [exitPopup, setExitPopup] = useState(false);
  const [exitShown, setExitShown] = useState(false);
  const [modalPlan, setModalPlan] = useState(null);
  const langRef = useRef(null);

  const t = I18N[lang] || I18N.pt;
  const T = { p: '#7C3AED', on: '#1E1B4B', onV: '#6B7280', bg: '#F0EFFE', suc: '#10B981', err: '#EF4444' };

  useEffect(() => {
    const target = sessionStorage.getItem('scrollToSection');
    if (target) { sessionStorage.removeItem('scrollToSection'); setTimeout(() => scrollTo(target), 120); }
  }, []);

  useEffect(() => {
    fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
      const map = { BR: 'pt', US: 'en', GB: 'en', CA: 'en', AU: 'en', ES: 'es', MX: 'es', AR: 'es', CO: 'es', FR: 'fr', DE: 'de', AT: 'de', CH: 'de', CN: 'zh', TW: 'zh', HK: 'zh', JP: 'ja' };
      const detected = map[d.country_code];
      if (detected) setLang(detected);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function onLeave(e) { if (e.clientY < 5 && !exitShown) { setExitPopup(true); setExitShown(true); } }
    document.addEventListener('mouseleave', onLeave);
    return () => document.removeEventListener('mouseleave', onLeave);
  }, [exitShown]);

  useEffect(() => {
    function h(e) { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function choosePlan(plan) {
    if (plan.price !== '$0') sessionStorage.setItem('pendingPlan', plan.name);
    go('login');
  }

  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];
  const navIds = ['recursos', 'como-funciona', null, 'faq'];

  const PLANS = [
    { name: 'Starter',  price: '$0',     period: '',            builds: '3',   highlight: false, badge: null },
    { name: 'Creator',  price: '$3.99',  period: t.plansPeriod, builds: '10',  highlight: true,  badge: t.plansBadge },
    { name: 'Pro',      price: '$9.99',  period: t.plansPeriod, builds: '50',  highlight: false, badge: null },
    { name: 'Business', price: '$14.99', period: t.plansPeriod, builds: '100', highlight: false, badge: null },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Inter',system-ui,sans-serif", color: T.on, fontSize: 15 }}>

      {/* EXIT INTENT */}
      {exitPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '44px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎁</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: T.on, marginBottom: 12 }}>{t.exitTitle}</h2>
            <p style={{ fontSize: 16, color: T.onV, lineHeight: 1.7, marginBottom: 28 }}>{t.exitSub}</p>
            <button onClick={() => { setExitPopup(false); go('login'); }} style={{ width: '100%', height: 54, borderRadius: 12, border: 'none', background: T.p, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>
              {t.exitBtn}
            </button>
            <button onClick={() => setExitPopup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: T.onV, fontFamily: 'inherit', textDecoration: 'underline' }}>
              {t.exitSkip}
            </button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={36} />
          <span style={{ fontWeight: 800, fontSize: 16, color: T.on }}>React to HTML</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {t.nav.map((l, i) => (
            <button key={l} onClick={() => i === 2 ? go('pricing') : scrollTo(navIds[i])}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 500, color: T.onV, fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.color = T.on}
              onMouseLeave={e => e.currentTarget.style.color = T.onV}
            >{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div ref={langRef} style={{ position: 'relative' }}>
            <button onClick={() => setLangOpen(o => !o)}
              style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: T.on, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src={currentLang.flagUrl} alt={currentLang.label} style={{ width: 18, height: 13, objectFit: 'cover', borderRadius: 2 }} />
              {currentLang.label} ▾
            </button>
            {langOpen && (
              <div style={{ position: 'absolute', top: 42, right: 0, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 6px 24px rgba(0,0,0,.12)', overflow: 'hidden', minWidth: 120, zIndex: 200 }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); localStorage.setItem('rtoh_lang', l.code); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', background: lang === l.code ? '#F0EFFE' : 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: lang === l.code ? T.p : T.on, fontWeight: lang === l.code ? 700 : 400, textAlign: 'left' }}>
                    <img src={l.flagUrl} alt={l.label} style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }} />
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => go('login')} style={{ height: 38, padding: '0 20px', borderRadius: 9, border: '1.5px solid #7C3AED', background: 'transparent', color: T.p, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.enter}
          </button>
          <button onClick={() => go('login')} style={{ height: 38, padding: '0 20px', borderRadius: 9, border: 'none', background: T.p, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.start}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: T.bg, padding: '88px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(34px,4vw,54px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 22, color: T.on }}>
              {t.heroTitle1}{' '}<span style={{ color: T.p }}>{t.heroTitleHighlight}</span>{' '}{t.heroTitle2}
            </h1>
            <p style={{ fontSize: 16, color: T.onV, lineHeight: 1.75, marginBottom: 34, maxWidth: 520 }}>{t.heroSub}</p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
              <button onClick={() => go('login')} style={{ height: 52, padding: '0 32px', borderRadius: 11, border: 'none', background: T.p, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t.startFree}
              </button>
              <button onClick={() => scrollTo('como-funciona')} style={{ height: 52, padding: '0 26px', borderRadius: 11, border: '1.5px solid #D1D5DB', background: '#fff', color: T.on, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t.howWorks}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 22, fontSize: 14, color: T.onV }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: T.suc }}>✓</span> {t.heroCheck1}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: T.suc }}>✓</span> {t.heroCheck2}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}><CodeMockup t={t} /></div>
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ padding: '88px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 34, fontWeight: 900, textAlign: 'center', marginBottom: 52, color: T.on }}>
            {t.problemTitle}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
            <div style={{ background: '#EDE9FE', borderRadius: 16, padding: 32 }}>
              <p style={{ fontSize: 15, color: T.onV, marginBottom: 16, lineHeight: 1.65 }}>{t.problemCard1Sub}</p>
              {['VibeCode tools','AI coding platforms','ChatGPT generated apps','React templates'].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 15, fontWeight: 500 }}>
                  <span style={{ color: T.suc, fontSize: 17 }}>✓</span> {i}
                </div>
              ))}
            </div>
            <div style={{ background: '#FEF2F2', borderRadius: 16, padding: 32 }}>
              <p style={{ fontSize: 15, color: T.onV, marginBottom: 16, lineHeight: 1.65 }}>{t.problemCard2Sub}</p>
              {['Hostinger','VantageX','cPanel hosting','FTP server'].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 15, fontWeight: 500 }}>
                  <span style={{ color: T.err, fontSize: 17 }}>✗</span> {i}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontSize: 22 }}>🔴</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8, color: T.on }}>{t.problemWarnTitle}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.onV, marginBottom: 8 }}>{t.problemWarnWhy}</div>
                <p style={{ fontSize: 15, color: T.onV, marginBottom: 10, lineHeight: 1.65 }}>{t.problemWarnSub}</p>
                {['Node.js runtime','Routing handling configuration','Server side setup'].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, color: T.onV, marginBottom: 5 }}>
                    <span style={{ color: '#D97706' }}>•</span> {i}
                  </div>
                ))}
                <p style={{ fontSize: 15, fontWeight: 600, color: T.on, marginTop: 14 }}>{t.problemWarnNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section style={{ background: T.bg, padding: '88px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EDE9FE', color: T.p, borderRadius: 9999, padding: '5px 18px', fontSize: 14, fontWeight: 600, marginBottom: 22 }}>
            {t.solChip}
          </div>
          <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 18, color: T.on }}>{t.solTitle}</h2>
          <p style={{ fontSize: 17, color: T.onV, marginBottom: 38, lineHeight: 1.65 }}>{t.solSub}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 38 }}>
            {(t.solBadges || []).map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 9999, padding: '9px 20px', fontSize: 15, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,.08)', color: T.on }}>
                <span style={{ color: T.suc }}>✓</span> {b}
              </div>
            ))}
          </div>
          <button onClick={() => go('login')} style={{ height: 58, padding: '0 44px', borderRadius: 13, border: 'none', background: T.p, color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', width: '100%', maxWidth: 520 }}>
            {t.solBtn}
          </button>
          <p style={{ marginTop: 12, fontSize: 14, color: T.onV }}>{t.solNote}</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" style={{ padding: '88px 40px', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#2563EB', borderRadius: 9999, padding: '5px 18px', fontSize: 14, fontWeight: 600, marginBottom: 22 }}>
            {t.howChip}
          </div>
          <p style={{ fontSize: 15, color: T.onV, marginBottom: 52 }}>{t.howSub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 26 }}>
            {(t.howSteps || []).map((s, i) => {
              const c = STEP_COLORS[i];
              return (
                <div key={i} style={{ background: c.bg, borderRadius: 18, padding: 32, textAlign: 'left' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 18 }}>{c.ico}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{t.howStep} {String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: T.on }}>{s.t}</div>
                  <div style={{ fontSize: 14, color: T.onV, lineHeight: 1.65 }}>{s.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" style={{ background: '#1E1B4B', padding: '88px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.1)', color: '#fff', borderRadius: 9999, padding: '5px 18px', fontSize: 14, fontWeight: 600, marginBottom: 18 }}>
            {t.featChip}
          </div>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', marginBottom: 52 }}>{t.featSub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {(t.featItems || []).map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 18, padding: 28, textAlign: 'left', border: '1px solid rgba(255,255,255,.08)' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{FEAT_ICONS[i]}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{f.t}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.65 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: `linear-gradient(135deg,${T.p},#4F46E5)`, padding: '68px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', color: '#fff', borderRadius: 9999, padding: '5px 18px', fontSize: 14, fontWeight: 600, marginBottom: 36 }}>
            {t.statsChip}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 26 }}>
            {(t.statsItems || []).map(s => (
              <div key={s.l} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 16, padding: '28px 22px' }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 7 }}>{s.v}</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,.75)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '88px 40px', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: 10, color: T.on }}>{t.testTitle}</h2>
          <p style={{ color: T.onV, marginBottom: 52, fontSize: 15 }}>{t.testSub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {(t.testItems || []).map(t2 => (
              <div key={t2.name} style={{ background: T.bg, borderRadius: 18, padding: 26, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array(t2.stars).fill(0).map((_,i) => <span key={i} style={{ color: '#F59E0B', fontSize: 17 }}>★</span>)}
                    {Array(5 - t2.stars).fill(0).map((_,i) => <span key={i} style={{ color: '#E5E7EB', fontSize: 17 }}>★</span>)}
                  </div>
                  <span style={{ fontSize: 28, color: '#E5E7EB', fontFamily: 'Georgia,serif', lineHeight: 1 }}>"</span>
                </div>
                <p style={{ fontSize: 14, color: T.onV, lineHeight: 1.75, marginBottom: 18, fontStyle: 'italic' }}>"{t2.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={`https://i.pravatar.cc/80?u=${t2.seed}`} alt={t2.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E5E7EB', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.on }}>{t2.name}</div>
                    <div style={{ fontSize: 12, color: T.onV }}>{t2.role} · {t2.co}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="preços" style={{ padding: '88px 40px', background: T.bg, textAlign: 'center' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EDE9FE', color: T.p, borderRadius: 9999, padding: '5px 18px', fontSize: 14, fontWeight: 600, marginBottom: 18 }}>
            {t.plansChip}
          </div>
          <p style={{ fontSize: 15, color: T.onV, marginBottom: 44 }}>{t.plansSub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
            {PLANS.map(p => (
              <div key={p.name} style={{ position: 'relative', background: p.highlight ? T.p : '#fff', borderRadius: 18, padding: '30px 22px', border: p.highlight ? 'none' : '1px solid #E5E7EB', boxShadow: p.highlight ? '0 8px 32px rgba(124,58,237,.3)' : '0 1px 4px rgba(0,0,0,.06)', transform: p.highlight ? 'scale(1.04)' : 'none', display: 'flex', flexDirection: 'column' }}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#F59E0B', color: '#fff', borderRadius: 9999, padding: '4px 16px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ fontSize: 17, fontWeight: 700, color: p.highlight ? '#fff' : T.on, marginBottom: 5 }}>{p.name}</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: p.highlight ? '#fff' : T.p, marginBottom: 3 }}>
                  {p.price}<span style={{ fontSize: 15, fontWeight: 400, opacity: .7 }}>{p.period}</span>
                </div>
                <div style={{ fontSize: 14, color: p.highlight ? 'rgba(255,255,255,.8)' : T.onV, marginBottom: 22 }}>
                  {p.builds} {t.plansBuildsLabel}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 'auto' }}>
                  <button onClick={() => choosePlan(p)} style={{ width: '100%', height: 42, borderRadius: 9, border: p.highlight ? '2px solid rgba(255,255,255,.4)' : `2px solid ${T.p}`, background: p.highlight ? 'rgba(255,255,255,.18)' : 'transparent', color: p.highlight ? '#fff' : T.p, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.price === '$0' ? t.startFreeBtn : t.choosePlan}
                  </button>
                  <button onClick={() => setModalPlan(p)} style={{ width: '100%', height: 36, borderRadius: 9, border: 'none', background: p.highlight ? 'rgba(255,255,255,.1)' : '#F0EFFE', color: p.highlight ? 'rgba(255,255,255,.85)' : T.p, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.learnMore}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 18, padding: 30, textAlign: 'left', border: '1px solid #E5E7EB', marginBottom: 32 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, textAlign: 'center', color: T.on }}>{t.plansAllInclude}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {(t.plansAllItems || []).map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, color: T.onV }}>
                  <span style={{ color: T.suc }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => go('login')} style={{ height: 58, padding: '0 52px', borderRadius: 13, border: 'none', background: T.p, color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(124,58,237,.35)' }}>
            {t.startToday}
          </button>
          <p style={{ marginTop: 12, fontSize: 14, color: T.onV }}>{t.noCard}</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '88px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.bg, color: T.p, borderRadius: 9999, padding: '5px 18px', fontSize: 14, fontWeight: 600, marginBottom: 18 }}>
              {t.faqChip}
            </div>
            <p style={{ fontSize: 15, color: T.onV }}>{t.faqSub}</p>
          </div>
          {(t.faqItems || []).map((item, i) => <FAQItem key={i} {...item} />)}
        </div>
      </section>

      {/* SEO BLOCK */}
      <section style={{ padding: '48px 40px', background: '#F9FAFB' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff', borderRadius: 18, padding: 34, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 18, color: T.on }}>{t.seoTitle}</h3>
          <p style={{ fontSize: 14, color: T.onV, marginBottom: 14 }}>{t.seoPre}</p>
          {(t.seoItems || []).map(tx => (
            <div key={tx} style={{ fontSize: 14, color: T.p, marginBottom: 7, fontWeight: 500 }}>• {tx}</div>
          ))}
          <p style={{ fontSize: 14, color: T.onV, marginTop: 14 }}>
            {t.seoNote}<br />
            <strong style={{ color: T.on }}>React to HTML</strong> {t.seoNote2}
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: `linear-gradient(135deg,${T.p},#4F46E5)`, padding: '88px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 14 }}>{t.ctaTitle}</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.8)', marginBottom: 36 }}>{t.ctaSub}</p>
          <button onClick={() => go('login')} style={{ height: 56, padding: '0 44px', borderRadius: 13, border: '2px solid rgba(255,255,255,.5)', background: 'transparent', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t.ctaBtn}
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
              {[[t.footerCompiler, () => go('login')], [t.footerPricing, () => go('pricing')]].map(([l, fn]) => (
                <button key={l} onClick={fn} style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,.55)', fontFamily: 'inherit', padding: '5px 0', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}
                >{l}</button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{t.footerResources}</div>
              {[[t.footerFAQ, () => scrollTo('faq')], [t.footerSupport, () => go('login')]].map(([l, fn]) => (
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
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ width: 38, height: 38, borderRadius: '50%', background: T.p, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 17 }}>↑</button>
          </div>
        </div>
      </footer>

      {modalPlan && <PlanModal plan={modalPlan} onClose={() => setModalPlan(null)} go={go} t={t} />}
      <SaraWidget t={t} />
    </div>
  );
}
