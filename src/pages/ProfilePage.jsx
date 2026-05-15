import { useState } from 'react';
import { C } from '../lib/tokens.js';
import { useAuth, updateProfile, useBuildHistory } from '../hooks/useDB.js';
import { supabase } from '../lib/supabase.js';

export default function ProfilePage({ showToast, go }) {
  const { user, profile } = useAuth();
  const { data: builds } = useBuildHistory(50);
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    company: profile?.company ?? '',
    location: profile?.location ?? '',
    bio: profile?.bio ?? '',
  });
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [showDanger, setShowDanger] = useState(false);

  const weekBuilds = builds.filter(b => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(b.created_at) >= weekAgo;
  }).length;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '—';

  const planColors = { Free: C.s2, Starter: C.pC, Pro: C.sucC, Business: C.warnC };

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        name: form.name,
        phone: form.phone,
        company: form.company,
        location: form.location,
        bio: form.bio,
      });
      showToast('✅ Perfil atualizado!');
    } catch (e) {
      showToast('❌ Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (pwForm.next !== pwForm.confirm) { showToast('⚠️ Senhas não coincidem'); return; }
    if (pwForm.next.length < 8) { showToast('⚠️ Senha deve ter pelo menos 8 caracteres'); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setChangingPw(false);
    if (error) showToast('❌ Erro: ' + error.message);
    else { showToast('✅ Senha alterada!'); setPwForm({ next: '', confirm: '' }); }
  }

  async function deleteAccount() {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita. Todos os seus dados serão apagados.')) return;
    if (!confirm('ÚLTIMA CONFIRMAÇÃO: Excluir sua conta permanentemente?')) return;
    showToast('⚠️ Entre em contato com o suporte para excluir sua conta.');
  }

  const userInitial = (profile?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="fade-in">
      {/* Stats row */}
      <div className="mg" style={{ marginBottom: 20 }}>
        {[
          { l: 'Total de Builds', v: builds.length, ico: '⚡', col: C.pC },
          { l: 'Builds da Semana', v: weekBuilds, ico: '📅', col: C.secC },
          { l: 'Plano Atual', v: profile?.subscription_plan ?? 'Free', ico: '💳', col: planColors[profile?.subscription_plan] ?? C.s2 },
          { l: 'Membro desde', v: memberSince, ico: '🗓', col: C.sucC },
        ].map((m, i) => (
          <div key={i} className="card" style={{ background: m.col, border: 'none' }}>
            <div className="cb" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="ml">{m.l}</div>
                  <div style={{ fontSize: i === 2 ? 16 : 22, fontWeight: 800, lineHeight: 1.2 }}>{m.v}</div>
                </div>
                <span style={{ fontSize: 22, opacity: .7 }}>{m.ico}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content: two columns */}
      <div className="two" style={{ gap: 20, alignItems: 'start', marginBottom: 16 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Avatar card */}
          <div className="card">
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${C.p}, #4F46E5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {userInitial}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{profile?.name || 'Usuário'}</div>
                <div style={{ fontSize: 12, color: C.onV }}>{user?.email}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <span className="chip cp">{profile?.subscription_plan ?? 'Free'}</span>
                  {profile?.role === 'admin' && <span className="chip ce">Admin</span>}
                </div>
              </div>
              <button className="btn bt bsm" style={{ width: '100%', justifyContent: 'center' }}>
                📷 Alterar Foto
              </button>
              <div style={{ fontSize: 11, color: C.onV }}>
                Foto de perfil · Envie uma imagem de até 2MB
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="card">
            <div className="ch" style={{ paddingBottom: 0 }}>
              <span className="ct">💳 Assinatura Atual</span>
              <span className="chip cs">{profile?.subscription_status ?? 'active'}</span>
            </div>
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.p }}>{profile?.subscription_plan ?? 'Free'}</div>
              {[
                'Build ilimitado',
                'Projetos salvos',
                'Download do arquivo compilado',
                'Suporte prioritário',
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <span style={{ color: C.suc }}>✓</span> {f}
                </div>
              ))}
              <button className="btn bf" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => go('plans')}>
                ⭐ Ver Planos Premium
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Personal info form */}
          <div className="card">
            <div className="ch"><span className="ct">👤 Informações Pessoais</span></div>
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="fld">
                <label>Nome Completo</label>
                <input className="fi" placeholder="Seu nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="fld">
                <label>E-mail</label>
                <input className="fi" value={user?.email ?? ''} disabled style={{ opacity: .6 }} />
              </div>
              <div className="fld">
                <label>Telefone</label>
                <input className="fi" placeholder="+55 (11) 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Empresa</label>
                <input className="fi" placeholder="Nome da empresa (opcional)" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Localização</label>
                <input className="fi" placeholder="Cidade, Estado" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Bio</label>
                <textarea className="fi" rows={3} placeholder="Conte um pouco sobre você..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
              <button className="btn bf" style={{ width: '100%', justifyContent: 'center' }} onClick={saveProfile} disabled={saving}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Salvando...</> : '💾 Salvar Alterações'}
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="card">
            <div className="ch"><span className="ct">🔒 Alterar Senha</span></div>
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="fld">
                <label>Nova senha</label>
                <input className="fi" type="password" placeholder="Mínimo 8 caracteres" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Confirmar nova senha</label>
                <input className="fi" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
              </div>
              <button className="btn bo" onClick={changePassword} disabled={changingPw || !pwForm.next}>
                {changingPw ? 'Alterando...' : '🔒 Alterar Senha'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      {builds.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="ch"><span className="ct">⚡ Atividade Recente</span></div>
          <div className="cb">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {builds.slice(0, 5).map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--ovV)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: b.status === 'completed' ? C.sucC : C.errC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {b.status === 'completed' ? '✅' : b.status === 'failed' ? '❌' : '⚡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.project_name}</div>
                    <div style={{ fontSize: 11, color: C.onV }}>{new Date(b.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                  <span className={`st-badge st-${b.status}`} style={{ fontSize: 10 }}>
                    {b.status === 'completed' ? 'Concluído' : b.status === 'failed' ? 'Falhou' : b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="card" style={{ border: `1px solid ${C.err}30` }}>
        <div className="ch">
          <span style={{ fontSize: 14, fontWeight: 700, color: C.err }}>⚠️ Zona de Perigo</span>
        </div>
        <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: C.onV }}>
            Ações irreversíveis que afetam permanentemente sua conta. Tenha cuidado!
          </div>
          {!showDanger ? (
            <button
              className="btn"
              style={{ background: C.errC, color: C.err, alignSelf: 'flex-start' }}
              onClick={() => setShowDanger(true)}
            >
              🗑 Remover Conta
            </button>
          ) : (
            <div style={{ padding: 14, background: C.errC, borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.err, marginBottom: 8 }}>
                Você tem certeza que quer excluir sua conta?
              </div>
              <div style={{ fontSize: 12, color: '#991B1B', marginBottom: 12, lineHeight: 1.5 }}>
                Todos os seus projetos, builds e dados serão excluídos permanentemente. Esta ação não pode ser desfeita.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn berr bsm" onClick={deleteAccount}>Sim, excluir minha conta</button>
                <button className="btn bt bsm" onClick={() => setShowDanger(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
