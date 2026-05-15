import { useState, useEffect } from 'react';
import { C } from '../lib/tokens.js';
import {
  useAuth, useProfiles, updateProfile, useBuildHistory,
  useReferrals, usePlans, useInvoices, useNewsletterSubscribers,
  useNotifications,
} from '../hooks/useDB.js';
import { supabase, callEdgeFunction } from '../lib/supabase.js';

const TABS = [
  { id: 'dashboard',     ico: '📊', label: 'Dashboard' },
  { id: 'users',         ico: '👥', label: 'Usuários' },
  { id: 'plans',         ico: '💳', label: 'Planos' },
  { id: 'referrals',     ico: '🎁', label: 'Indicações' },
  { id: 'payments',      ico: '💰', label: 'Pagamentos' },
  { id: 'testimonials',  ico: '⭐', label: 'Testemunhos' },
  { id: 'notifications', ico: '🔔', label: 'Notificações' },
  { id: 'storage',       ico: '🗄️', label: 'Armazenamento' },
  { id: 'github',        ico: '⬡', label: 'Logs GitHub' },
  { id: 'system',        ico: '⚙️', label: 'Sistema' },
  { id: 'stripe',        ico: '💳', label: 'Stripe Config' },
];

export default function AdminPage({ showToast, go }) {
  const { profile: me } = useAuth();
  const [tab, setTab] = useState('dashboard');

  if (me?.role !== 'admin') {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        <div className="empty-ico">🚫</div>
        <div style={{ fontWeight: 700 }}>Acesso restrito a administradores</div>
        <div style={{ fontSize: 13, color: C.onV, marginTop: 4 }}>Entre em contato com o suporte se precisar de acesso.</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--s1)', padding: 4, borderRadius: 12, overflowX: 'auto', flexWrap: 'nowrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? ' a' : ''}`}
            style={{ whiteSpace: 'nowrap', fontSize: 12 }}
            onClick={() => setTab(t.id)}
          >
            {t.ico} {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard'     && <AdminDashboard />}
      {tab === 'users'         && <UsersTab showToast={showToast} />}
      {tab === 'plans'         && <PlansTab showToast={showToast} />}
      {tab === 'referrals'     && <ReferralsTab showToast={showToast} />}
      {tab === 'payments'      && <PaymentsTab />}
      {tab === 'testimonials'  && <TestimonialsTab showToast={showToast} />}
      {tab === 'notifications' && <NotificationsTab showToast={showToast} />}
      {tab === 'storage'       && <StorageTab />}
      {tab === 'github'        && <GitHubLogsTab />}
      {tab === 'system'        && <SystemTab showToast={showToast} />}
      {tab === 'stripe'        && <StripeTab showToast={showToast} />}
    </div>
  );
}

/* ── Admin Dashboard ── */
function AdminDashboard() {
  const { data: profiles } = useProfiles();
  const { data: builds }   = useBuildHistory(1000);
  const { data: invoices } = useInvoices();

  const today = new Date().toISOString().split('T')[0];
  const todayBuilds = builds.filter(b => b.created_at?.startsWith(today)).length;
  const revenue     = invoices.reduce((s, i) => s + (i.amount ?? 0), 0);
  const paid        = profiles.filter(p => p.subscription_plan && p.subscription_plan !== 'Free').length;

  return (
    <div>
      <div className="mg" style={{ marginBottom: 20 }}>
        {[
          { l: 'Total de Usuários', v: profiles.length, ico: '👥', col: C.pC },
          { l: 'Builds Hoje', v: todayBuilds, ico: '⚡', col: C.secC },
          { l: 'Assinantes Pagos', v: paid, ico: '💳', col: C.sucC },
          { l: 'Receita Total', v: `$${revenue.toFixed(2)}`, ico: '💰', col: C.warnC },
        ].map((m, i) => (
          <div key={i} className="card" style={{ background: m.col, border: 'none' }}>
            <div className="cb" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="ml">{m.l}</div>
                  <div className="mv">{m.v}</div>
                </div>
                <span style={{ fontSize: 28, opacity: .7 }}>{m.ico}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="two">
        {/* Recent users */}
        <div className="card">
          <div className="ch"><span className="ct">👥 Usuários Recentes</span></div>
          <div className="cb">
            <table className="tbl">
              <thead><tr><th>Nome</th><th>Plano</th><th>Data</th></tr></thead>
              <tbody>
                {profiles.slice(0, 6).map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name || p.email || '—'}</td>
                    <td><span className="chip cp" style={{ fontSize: 10 }}>{p.subscription_plan ?? 'Free'}</span></td>
                    <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Build stats */}
        <div className="card">
          <div className="ch"><span className="ct">⚡ Estatísticas de Builds</span></div>
          <div className="cb">
            {[
              { l: 'Total de builds', v: builds.length },
              { l: 'Concluídos', v: builds.filter(b => b.status === 'completed').length },
              { l: 'Falhas', v: builds.filter(b => b.status === 'failed').length },
              { l: 'Em processamento', v: builds.filter(b => b.status === 'processing').length },
              { l: 'Taxa de sucesso', v: builds.length ? `${Math.round(builds.filter(b => b.status === 'completed').length / builds.length * 100)}%` : '—' },
            ].map(([l, v]) => [l, v, ''], (s, i) => (
              <div key={i} />
            ))}
            {[
              ['Total de builds', builds.length],
              ['Concluídos', builds.filter(b => b.status === 'completed').length],
              ['Falhas', builds.filter(b => b.status === 'failed').length],
              ['Em processamento', builds.filter(b => b.status === 'processing').length],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--ovV)', fontSize: 13 }}>
                <span style={{ color: C.onV }}>{l}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Users Tab ── */
function UsersTab({ showToast }) {
  const { data: profiles, refetch } = useProfiles();
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');

  async function changeRole(id, role) {
    await updateProfile(id, { role });
    refetch();
    showToast(`✅ Role atualizado para ${role}`);
  }

  async function changePlan(id, plan) {
    await updateProfile(id, { subscription_plan: plan });
    refetch();
    showToast(`✅ Plano atualizado para ${plan}`);
  }

  async function grantCredits(id, current) {
    const n = prompt(`Créditos atuais: ${current ?? 0}. Novo valor:`);
    if (!n || isNaN(+n)) return;
    await updateProfile(id, { credits: +n });
    refetch();
    showToast('✅ Créditos atualizados');
  }

  const filtered = profiles.filter(p => {
    const matchSearch = !search || (p.name + ' ' + p.email).toLowerCase().includes(search.toLowerCase());
    const matchPlan   = filterPlan === 'all' || p.subscription_plan === filterPlan;
    return matchSearch && matchPlan;
  });

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">👥 Usuários ({filtered.length})</span>
      </div>
      <div className="cb">
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <span className="search-ico">🔍</span>
            <input className="fi search-input" placeholder="Buscar por nome ou email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="fi" style={{ height: 38, width: 130 }} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
            <option value="all">Todos os planos</option>
            {['Free', 'Starter', 'Creator', 'Pro', 'Business'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Nome / Email</th>
              <th>Plano</th>
              <th>Role</th>
              <th>Uso Hoje</th>
              <th>Créditos</th>
              <th>Membro desde</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name || '—'}</div>
                  <div style={{ fontSize: 11, color: C.onV }}>{p.email}</div>
                </td>
                <td>
                  <select
                    className="fi"
                    style={{ height: 28, fontSize: 11, padding: '0 6px', width: 100 }}
                    value={p.subscription_plan ?? 'Free'}
                    onChange={e => changePlan(p.id, e.target.value)}
                  >
                    {['Free', 'Starter', 'Creator', 'Pro', 'Business'].map(plan => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="fi"
                    style={{ height: 28, fontSize: 11, padding: '0 6px', width: 80 }}
                    value={p.role ?? 'user'}
                    onChange={e => changeRole(p.id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="mono" style={{ fontSize: 12 }}>{p.daily_usage ?? 0}</td>
                <td>
                  <button
                    className="btn bsm bt"
                    onClick={() => grantCredits(p.id, p.credits)}
                    style={{ fontSize: 11 }}
                  >
                    {p.credits ?? 0} ✏️
                  </button>
                </td>
                <td className="mono" style={{ fontSize: 11, color: C.onV }}>
                  {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td>
                  <button
                    className="btn bsm bt"
                    title="Reset uso diário"
                    onClick={async () => { await updateProfile(p.id, { daily_usage: 0 }); refetch(); showToast('✅ Uso resetado!'); }}
                    style={{ fontSize: 11 }}
                  >
                    ↺ Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Plans Tab ── */
function PlansTab({ showToast }) {
  const { data: plans, refetch } = usePlans();
  const [dlg, setDlg]   = useState(false);
  const [form, setForm] = useState({ name: '', price: 0, daily_limit: 10, stripe_price_id: '', features: '', is_active: true });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    const payload = {
      ...form,
      features: form.features ? form.features.split('\n').filter(Boolean) : [],
    };
    await supabase.from('plans').insert(payload);
    refetch();
    setDlg(false);
    showToast('✅ Plano criado!');
  }

  async function del(id) {
    if (!confirm('Excluir este plano?')) return;
    await supabase.from('plans').delete().eq('id', id);
    refetch();
  }

  async function toggleActive(id, current) {
    await supabase.from('plans').update({ is_active: !current }).eq('id', id);
    refetch();
  }

  return (
    <div>
      <div className="card">
        <div className="ch">
          <span className="ct">💳 Planos ({plans.length})</span>
          <button className="btn bsm bf" onClick={() => setDlg(true)}>+ Novo Plano</button>
        </div>
        <div className="cb">
          <table className="tbl">
            <thead><tr><th>Nome</th><th>Preço</th><th>Limite Diário</th><th>Stripe Price ID</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {plans.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: C.onV, padding: 24 }}>Nenhum plano cadastrado</td></tr>
              )}
              {plans.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td className="mono">{p.price === 0 ? 'Grátis' : `$${p.price}/mês`}</td>
                  <td className="mono">{p.daily_limit === -1 ? '∞' : p.daily_limit}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{p.stripe_price_id || '—'}</td>
                  <td>
                    <button
                      className={`chip ${p.is_active ? 'cs' : 'ce'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => toggleActive(p.id, p.is_active)}
                    >
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td>
                    <button className="btn bsm berr" onClick={() => del(p.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dlg && (
        <div className="dlg-bg" onClick={() => setDlg(false)}>
          <div className="dlg" onClick={e => e.stopPropagation()}>
            <div className="dlg-h"><span className="dlg-t">Novo Plano</span><button className="ib" onClick={() => setDlg(false)}>✕</button></div>
            <div className="dlg-b">
              <div className="fld"><label>Nome</label><input className="fi" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Pro" /></div>
              <div className="two">
                <div className="fld"><label>Preço (USD/mês)</label><input className="fi" type="number" value={form.price} onChange={e => set('price', +e.target.value)} /></div>
                <div className="fld"><label>Limite diário (-1 = ilimitado)</label><input className="fi" type="number" value={form.daily_limit} onChange={e => set('daily_limit', +e.target.value)} /></div>
              </div>
              <div className="fld"><label>Stripe Price ID</label><input className="fi" value={form.stripe_price_id} onChange={e => set('stripe_price_id', e.target.value)} placeholder="price_..." /></div>
              <div className="fld"><label>Funcionalidades (uma por linha)</label><textarea className="fi" rows={4} value={form.features} onChange={e => set('features', e.target.value)} placeholder="10 compilações/dia&#10;Suporte por email" /></div>
            </div>
            <div className="dlg-f">
              <button className="btn bo" onClick={() => setDlg(false)}>Cancelar</button>
              <button className="btn bf" onClick={save}>💾 Criar Plano</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Referrals Tab ── */
function ReferralsTab({ showToast }) {
  const { data: referrals, refetch } = useReferrals();
  const [filter, setFilter] = useState('all');

  async function changeStatus(id, status) {
    await supabase.from('referrals').update({ status }).eq('id', id);
    refetch();
    showToast('✅ Status atualizado!');
  }

  const filtered = filter === 'all' ? referrals : referrals.filter(r => r.status === filter);
  const pending  = referrals.filter(r => r.status === 'pending').length;
  const valid    = referrals.filter(r => r.status === 'valid' || r.status === 'rewarded').length;
  const invalid  = referrals.filter(r => r.status === 'invalid').length;

  return (
    <div>
      <div className="mg" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
        {[
          { l: 'Pendentes', v: pending, col: C.warnC },
          { l: 'Válidas',   v: valid,   col: C.sucC },
          { l: 'Inválidas', v: invalid, col: C.errC },
        ].map((m, i) => (
          <div key={i} className="card" style={{ background: m.col, border: 'none' }}>
            <div className="cb" style={{ padding: '14px 18px' }}>
              <div className="ml">{m.l}</div>
              <div className="mv">{m.v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">🎁 Indicações ({filtered.length})</span>
          <select className="fi" style={{ height: 30, width: 130, fontSize: 12 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="valid">Válidas</option>
            <option value="rewarded">Recompensadas</option>
            <option value="invalid">Inválidas</option>
          </select>
        </div>
        <div className="cb">
          <table className="tbl">
            <thead>
              <tr><th>Indicador</th><th>Indicado</th><th>Status</th><th>Fraud Score</th><th>Data</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: C.onV, padding: 24 }}>Nenhuma indicação</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.referrer?.name || '—'}</td>
                  <td>{r.referred?.name || '—'}</td>
                  <td>
                    <span className={`chip ${r.status === 'valid' || r.status === 'rewarded' ? 'cs' : r.status === 'invalid' ? 'ce' : 'cw'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: r.fraud_score > 70 ? C.err : r.fraud_score > 40 ? C.warn : C.suc }}>
                      {r.fraud_score ?? 0}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn bsm bt" style={{ fontSize: 10 }} onClick={() => changeStatus(r.id, 'valid')}>✅ Válida</button>
                      <button className="btn bsm berr" style={{ fontSize: 10 }} onClick={() => changeStatus(r.id, 'invalid')}>❌</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Payments Tab ── */
function PaymentsTab() {
  const { data: invoices } = useInvoices();
  const total = invoices.reduce((s, i) => s + (i.amount ?? 0), 0);

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">💰 Pagamentos ({invoices.length})</span>
        <span className="chip cs">Total: ${total.toFixed(2)}</span>
      </div>
      <div className="cb">
        {invoices.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}><div className="empty-ico">💰</div>Nenhum pagamento registrado</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>ID da Fatura</th><th>Valor</th><th>Moeda</th><th>Status</th><th>Data</th><th>Link</th></tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="mono" style={{ fontSize: 11 }}>{inv.stripe_invoice_id?.slice(0, 20)}…</td>
                  <td className="mono" style={{ fontWeight: 700 }}>${inv.amount?.toFixed(2)}</td>
                  <td>{inv.currency?.toUpperCase()}</td>
                  <td><span className={`chip ${inv.status === 'paid' ? 'cs' : 'ce'}`}>{inv.status}</span></td>
                  <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(inv.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    {inv.invoice_url && (
                      <a href={inv.invoice_url} target="_blank" rel="noreferrer" className="btn bsm bt" style={{ textDecoration: 'none', fontSize: 11 }}>
                        🔗 Ver
                      </a>
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

/* ── Testimonials Tab ── */
function TestimonialsTab({ showToast }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('testimonials')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false });
    setTestimonials(data ?? []);
    setLoading(false);
  }

  async function approve(id) {
    await supabase.from('testimonials').update({ approved: true }).eq('id', id);
    load();
    showToast('✅ Depoimento aprovado!');
  }

  async function del(id) {
    if (!confirm('Excluir depoimento?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    load();
  }

  const pending  = testimonials.filter(t => !t.approved).length;
  const approved = testimonials.filter(t => t.approved).length;

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">⭐ Depoimentos</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {pending > 0 && <span className="chip cw">{pending} pendentes</span>}
          <span className="chip cs">{approved} aprovados</span>
        </div>
      </div>
      <div className="cb">
        {loading ? (
          <div className="empty"><div className="spinner" style={{ width: 24, height: 24, borderColor: 'var(--ovV)', borderTopColor: 'var(--p)' }} /></div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Autor</th><th>Avaliação</th><th>Depoimento</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead>
            <tbody>
              {testimonials.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: C.onV, padding: 24 }}>Nenhum depoimento</td></tr>
              )}
              {testimonials.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.profiles?.name || '—'}</td>
                  <td>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</td>
                  <td style={{ maxWidth: 250, fontSize: 12 }}>{t.message?.slice(0, 80)}…</td>
                  <td><span className={`chip ${t.approved ? 'cs' : 'cw'}`}>{t.approved ? 'Aprovado' : 'Pendente'}</span></td>
                  <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!t.approved && <button className="btn bsm bf" onClick={() => approve(t.id)}>✅ Aprovar</button>}
                      <button className="btn bsm berr" onClick={() => del(t.id)}>🗑</button>
                    </div>
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

/* ── Admin Notifications Tab ── */
function NotificationsTab({ showToast }) {
  const [form, setForm] = useState({ title: '', message: '', icon: '🔔', target: 'all' });
  const [profiles]      = useState([]);
  const [sending, setSending] = useState(false);

  async function sendNotification() {
    if (!form.title || !form.message) { showToast('⚠️ Preencha título e mensagem'); return; }
    setSending(true);
    try {
      if (form.target === 'all') {
        const { data: users } = await supabase.from('profiles').select('id');
        const notifs = (users ?? []).map(u => ({
          user_id: u.id,
          title: form.title,
          message: form.message,
          icon: form.icon,
        }));
        await supabase.from('notifications').insert(notifs);
        showToast(`✅ Notificação enviada para ${notifs.length} usuários!`);
      }
      setForm({ title: '', message: '', icon: '🔔', target: 'all' });
    } catch (e) {
      showToast('❌ Erro: ' + e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card">
      <div className="ch"><span className="ct">🔔 Enviar Notificação em Massa</span></div>
      <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
        <div className="fld">
          <label>Destinatários</label>
          <select className="fi" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
            <option value="all">Todos os usuários</option>
          </select>
        </div>
        <div className="two">
          <div className="fld">
            <label>Título</label>
            <input className="fi" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título da notificação" />
          </div>
          <div className="fld">
            <label>Ícone</label>
            <input className="fi" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🔔" style={{ fontSize: 20 }} />
          </div>
        </div>
        <div className="fld">
          <label>Mensagem</label>
          <textarea className="fi" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Conteúdo da notificação..." />
        </div>
        <div style={{ padding: '10px 14px', background: C.pC, borderRadius: 8, fontSize: 13 }}>
          <strong>Preview:</strong> {form.icon} {form.title} — {form.message}
        </div>
        <button className="btn bf" onClick={sendNotification} disabled={sending} style={{ alignSelf: 'flex-start' }}>
          {sending ? 'Enviando…' : '📢 Enviar Notificação'}
        </button>
      </div>
    </div>
  );
}

/* ── Storage Tab ── */
function StorageTab() {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.storage.listBuckets().then(({ data }) => {
      setBuckets(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="card">
      <div className="ch"><span className="ct">🗄️ Buckets de Armazenamento</span></div>
      <div className="cb">
        {loading ? (
          <div className="empty"><div className="spinner" style={{ width: 24, height: 24, borderColor: 'var(--ovV)', borderTopColor: 'var(--p)' }} /></div>
        ) : buckets.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>Nenhum bucket encontrado</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Nome do Bucket</th><th>Acesso</th><th>Criado em</th></tr></thead>
            <tbody>
              {buckets.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>🗄️ {b.name}</td>
                  <td><span className={`chip ${b.public ? 'cs' : 'ce'}`}>{b.public ? 'Público' : 'Privado'}</span></td>
                  <td className="mono" style={{ fontSize: 11, color: C.onV }}>
                    {b.created_at ? new Date(b.created_at).toLocaleDateString('pt-BR') : '—'}
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

/* ── GitHub Logs Tab ── */
function GitHubLogsTab() {
  const { data: builds } = useBuildHistory(50);
  const withRepo = builds.filter(b => b.github_run_id);

  return (
    <div className="card">
      <div className="ch"><span className="ct">⬡ Repositórios Temporários do GitHub</span></div>
      <div className="cb">
        {withRepo.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>Nenhum log do GitHub disponível</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Projeto</th><th>Repositório</th><th>Status</th><th>Data</th></tr></thead>
            <tbody>
              {withRepo.map(b => {
                const [ghUser, repo] = (b.github_run_id ?? '').split('/');
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.project_name}</td>
                    <td>
                      {repo ? (
                        <a
                          href={`https://github.com/${ghUser}/${repo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mono"
                          style={{ fontSize: 11, color: C.p }}
                        >
                          {b.github_run_id}
                        </a>
                      ) : (
                        <span className="mono" style={{ fontSize: 11 }}>{b.github_run_id}</span>
                      )}
                    </td>
                    <td>
                      <span className={`chip ${b.status === 'completed' ? 'cs' : b.status === 'failed' ? 'ce' : 'cw'}`}>{b.status}</span>
                    </td>
                    <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(b.created_at).toLocaleString('pt-BR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── System Settings Tab ── */
function SystemTab({ showToast }) {
  const [settings, setSettings] = useState({
    form_webhook_url: '',
    maintenance_mode: false,
    allow_new_registrations: true,
    max_file_size_mb: 50,
    default_daily_limit: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    supabase.from('admin_settings').select('*').single().then(({ data }) => {
      if (data) setSettings(s => ({ ...s, ...data }));
      setLoading(false);
    });
  }, []);

  function set(k, v) { setSettings(s => ({ ...s, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await supabase.from('admin_settings').upsert({ id: 1, ...settings });
      showToast('✅ Configurações salvas!');
    } catch (e) {
      showToast('❌ ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty"><div className="spinner" style={{ width: 24, height: 24, borderColor: 'var(--ovV)', borderTopColor: 'var(--p)' }} /></div>;

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">⚙️ Configurações do Sistema</span>
        <button className="btn bsm bf" onClick={save} disabled={saving}>{saving ? 'Salvando…' : '💾 Salvar'}</button>
      </div>
      <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
        <div className="fld">
          <label>URL do Webhook de Formulários</label>
          <input className="fi" value={settings.form_webhook_url} onChange={e => set('form_webhook_url', e.target.value)} placeholder="https://seu-webhook.com" />
          <span style={{ fontSize: 11, color: C.onV }}>Recebe dados de formulários dos sites compilados</span>
        </div>

        <div className="two">
          <div className="fld">
            <label>Tamanho máximo de arquivo (MB)</label>
            <input className="fi" type="number" value={settings.max_file_size_mb} onChange={e => set('max_file_size_mb', +e.target.value)} />
          </div>
          <div className="fld">
            <label>Limite diário padrão (Free)</label>
            <input className="fi" type="number" value={settings.default_daily_limit} onChange={e => set('default_daily_limit', +e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { k: 'maintenance_mode', l: 'Modo de Manutenção', d: 'Impede novos builds e exibe aviso para usuários' },
            { k: 'allow_new_registrations', l: 'Permitir novos cadastros', d: 'Permite que novos usuários se registrem' },
          ].map(({ k, l, d }) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.s1, borderRadius: 10 }}>
              <input
                type="checkbox"
                id={k}
                checked={settings[k] ?? false}
                onChange={e => set(k, e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <div>
                <label htmlFor={k} style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{l}</label>
                <div style={{ fontSize: 11, color: C.onV }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stripe Config Tab ── */
function StripeTab({ showToast }) {
  const PRICE_IDS = {
    'Creator': 'price_1T1TxxEtmRP7yowIn1Aiturg',
    'Pro':     'price_1T1TyjEtmRP7yowIajN9pvrI',
    'Business':'price_1T1TzQEtmRP7yowIY91nCR66',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="ch"><span className="ct">💳 Configuração do Stripe</span></div>
        <div className="cb">
          <div style={{ padding: '12px 14px', background: C.sucC, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
            ✅ Stripe configurado e operacional via variáveis de ambiente nas Edge Functions.
          </div>

          <div style={{ fontSize: 13, color: C.onV, marginBottom: 12 }}>
            As chaves do Stripe estão configuradas como secrets nas Supabase Edge Functions. Para alterar, use o CLI:
            <div className="logs-box" style={{ marginTop: 8 }}>
              supabase secrets set STRIPE_SECRET_KEY=sk_live_...
            </div>
          </div>

          <div>
            <div className="ct" style={{ marginBottom: 10 }}>Price IDs configurados:</div>
            <table className="tbl">
              <thead><tr><th>Plano</th><th>Price ID</th></tr></thead>
              <tbody>
                <tr>
                  <td>Starter</td>
                  <td className="mono" style={{ fontSize: 11 }}>Plano gratuito — sem Price ID</td>
                </tr>
                {Object.entries(PRICE_IDS).map(([plan, id]) => (
                  <tr key={plan}>
                    <td style={{ fontWeight: 600 }}>{plan}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="ch"><span className="ct">🔗 Webhook do Stripe</span></div>
        <div className="cb">
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            Configure o webhook no Stripe Dashboard apontando para:
          </div>
          <div className="logs-box" style={{ marginBottom: 12 }}>
            https://bkaspowxvvfxikuvyzfa.supabase.co/functions/v1/stripe-webhook
          </div>
          <div style={{ fontSize: 13, color: C.onV }}>
            Eventos necessários: <code>checkout.session.completed</code>, <code>customer.subscription.*</code>, <code>invoice.payment_*</code>
          </div>
        </div>
      </div>
    </div>
  );
}
