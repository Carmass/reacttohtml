import { useState } from 'react';
import { C } from '../lib/tokens.js';
import { usePlans, useAuth } from '../hooks/useDB.js';
import { callEdgeFunction } from '../lib/supabase.js';

const PLAN_ICONS = { Starter: '🆓', Creator: '🚀', Pro: '⚡', Business: '💎' };
const PLAN_COLORS = { Free: C.s2, Starter: C.pC, Pro: C.secC, Business: C.terC };

export default function PlansPage({ showToast }) {
  const { data: plans } = usePlans();
  const { profile } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState('');

  async function handleSubscribe(plan) {
    if (plan.price === 0) { showToast('Você já está no plano gratuito'); return; }
    if (!plan.stripe_price_id) { showToast('⚠️ Plano sem Stripe Price ID. Configure no painel admin.'); return; }
    setLoadingPlan(plan.name);
    try {
      showToast('🔗 Redirecionando para o Stripe...');
      const { url } = await callEdgeFunction('stripe-create-checkout', {
        price_id: plan.stripe_price_id,
        plan_name: plan.name,
      });
      if (url) window.location.href = url;
    } catch (e) {
      showToast('❌ Erro ao criar sessão de pagamento: ' + e.message);
    } finally {
      setLoadingPlan('');
    }
  }

  const currentPlan = profile?.subscription_plan ?? 'Free';

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Escolha seu Plano</h2>
        <p style={{ color: C.onV }}>Compile mais projetos e desbloqueie funcionalidades avançadas</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {plans.length === 0
          ? [
            { name: 'Starter',  price: 0,     daily_limit: 3,   stripe_price_id: 'price_1T1Tw4EtmRP7yowIz8B9nLGk', features: ['3 compilações/dia', 'Download ZIP', 'Suporte comunidade'] },
            { name: 'Creator',  price: 3.99,  daily_limit: 10,  stripe_price_id: 'price_1T1TxxEtmRP7yowIn1Aiturg', features: ['10 compilações/dia', 'Projetos salvos', 'Deploy FTP/SFTP'] },
            { name: 'Pro',      price: 9.99,  daily_limit: 50,  stripe_price_id: 'price_1T1TyjEtmRP7yowIajN9pvrI', features: ['50 compilações/dia', 'Deploy automático', 'GitHub Pages', 'FTP/SFTP'] },
            { name: 'Business', price: 14.99, daily_limit: 100, stripe_price_id: 'price_1T1TzQEtmRP7yowIY91nCR66', features: ['100 compilações/dia', 'Suporte 24/7', 'SLA garantido', 'API access'] },
          ].map(p => <PlanCard key={p.name} plan={p} current={currentPlan} onSubscribe={handleSubscribe} loading={loadingPlan === p.name} />)
          : plans.map(p => <PlanCard key={p.name} plan={p} current={currentPlan} onSubscribe={handleSubscribe} loading={loadingPlan === p.name} />)
        }
      </div>

      {/* Current status */}
      <div className="card" style={{ marginTop: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>{PLAN_ICONS[currentPlan] ?? '🆓'}</span>
          <div>
            <div style={{ fontWeight: 700 }}>Plano atual: {currentPlan}</div>
            <div style={{ fontSize: 12, color: C.onV }}>
              Status: <span style={{ color: profile?.subscription_status === 'active' ? C.suc : C.err }}>{profile?.subscription_status ?? 'active'}</span>
              {profile?.credits > 0 && ` · ${profile.credits} créditos extras`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, current, onSubscribe, loading }) {
  const isCurrent = current === plan.name;
  return (
    <div className="card" style={{ border: isCurrent ? `2px solid ${C.p}` : undefined, position: 'relative' }}>
      {isCurrent && (
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: C.p, color: C.onP, borderRadius: 9999, padding: '2px 12px', fontSize: 11, fontWeight: 700 }}>
          Plano Atual
        </div>
      )}
      <div className="cb">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>
            {PLAN_ICONS[plan.name] ?? '📦'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{plan.name}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.p, margin: '6px 0 2px' }}>
            {plan.price === 0 ? 'Grátis' : `$${plan.price}`}
            {plan.price > 0 && <span style={{ fontSize: 13, fontWeight: 400, color: C.onV }}>/mês</span>}
          </div>
          <div className="chip cp" style={{ margin: '0 auto', width: 'fit-content', marginTop: 4 }}>
            {plan.daily_limit === -1 ? 'Ilimitado' : `${plan.daily_limit} builds/dia`}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          {(plan.features ?? []).map((f, i) => (
            <div key={i} style={{ fontSize: 13, padding: '4px 0', display: 'flex', gap: 6 }}>
              <span style={{ color: C.suc }}>✓</span> {f}
            </div>
          ))}
        </div>
        <button
          className={`btn ${isCurrent ? 'bt' : 'bf'}`}
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={isCurrent || loading}
          onClick={() => onSubscribe(plan)}
        >
          {loading
            ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Aguarde...</>
            : isCurrent ? 'Plano atual' : plan.price === 0 ? 'Downgrade' : '💳 Assinar'}
        </button>
      </div>
    </div>
  );
}
