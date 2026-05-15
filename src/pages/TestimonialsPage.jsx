import { useState } from 'react';
import { C } from '../lib/tokens.js';
import { useAuth } from '../hooks/useDB.js';
import { supabase } from '../lib/supabase.js';

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange && onChange(n)}
          style={{ background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', fontSize: 24, color: n <= value ? '#FBBF24' : '#D1D5DB', padding: '0 2px', transition: 'color .13s' }}
        >★</button>
      ))}
    </div>
  );
}

export default function TestimonialsPage({ showToast, go }) {
  const { user, profile } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, message: '', role: '', company: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useState(() => {
    loadTestimonials();
  });

  async function loadTestimonials() {
    setLoading(true);
    const { data } = await supabase
      .from('testimonials')
      .select('*, profiles(name, email)')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    setTestimonials(data ?? []);
    setLoading(false);
  }

  async function submit() {
    if (!form.message) { showToast('⚠️ Escreva seu depoimento'); return; }
    setSaving(true);
    try {
      await supabase.from('testimonials').insert({
        user_id: user?.id,
        rating: form.rating,
        message: form.message,
        role: form.role || null,
        company: form.company || null,
        approved: false,
      });
      showToast('✅ Depoimento enviado! Aguardando aprovação.');
      setShowForm(false);
      setForm({ rating: 5, message: '', role: '', company: '' });
    } catch (e) {
      showToast('❌ Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter === 'all' ? testimonials : testimonials.filter(t => t.rating === Number(filter));
  const avgRating = testimonials.length ? (testimonials.reduce((a, t) => a + t.rating, 0) / testimonials.length).toFixed(1) : 0;

  return (
    <div className="fade-in">
      {/* Header card */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', border: 'none' }}>
        <div className="cb" style={{ padding: '32px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginBottom: 4 }}>Depoimentos dos usuários</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>O que nossos usuários dizem</div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 14 }}>
              Mais de {testimonials.length} depoimentos verificados
            </div>
          </div>
          {user && (
            <button
              className="btn"
              style={{ background: '#fff', color: '#7C3AED', fontWeight: 700, borderRadius: 10, padding: '0 24px', height: 44 }}
              onClick={() => setShowForm(s => !s)}
            >
              {showForm ? '✕ Cancelar' : '⭐ Deixar depoimento'}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mg" style={{ marginBottom: 20 }}>
        {[
          { l: 'Avaliação média', v: avgRating + '★', col: C.warnC },
          { l: 'Total de depoimentos', v: testimonials.length, col: C.pC },
          { l: '5 estrelas', v: testimonials.filter(t => t.rating === 5).length, col: C.sucC },
          { l: '4+ estrelas', v: testimonials.filter(t => t.rating >= 4).length, col: C.secC },
        ].map((s, i) => (
          <div key={i} className="card" style={{ background: s.col, border: 'none' }}>
            <div className="cb" style={{ padding: '16px 20px' }}>
              <div className="ml">{s.l}</div>
              <div className="mv" style={{ color: C.on }}>{s.v}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="ch"><span className="ct">⭐ Seu Depoimento</span></div>
          <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="fld">
              <label>Avaliação</label>
              <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
            </div>
            <div className="fld">
              <label>Depoimento *</label>
              <textarea
                className="fi"
                rows={4}
                placeholder="Conte sua experiência com o React to HTML Compiler..."
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              />
            </div>
            <div className="two">
              <div className="fld">
                <label>Cargo (opcional)</label>
                <input className="fi" placeholder="Ex: Desenvolvedor Full Stack" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Empresa (opcional)</label>
                <input className="fi" placeholder="Ex: Minha Empresa LTDA" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn bf" onClick={submit} disabled={saving}>
                {saving ? 'Enviando…' : '✅ Enviar depoimento'}
              </button>
              <button className="btn bt" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all', 'Todos'], ['5', '5 ★'], ['4', '4 ★'], ['3', '3 ★']].map(([k, l]) => (
          <button key={k} className={`btn bsm ${filter === k ? 'bf' : 'bt'}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: C.onV, display: 'flex', alignItems: 'center' }}>
          {filtered.length} depoimento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Testimonials grid */}
      {loading ? (
        <div className="empty"><div className="spinner" style={{ width: 28, height: 28, borderColor: 'var(--ovV)', borderTopColor: 'var(--p)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ padding: 80 }}>
          <div className="empty-ico">⭐</div>
          <div>Nenhum depoimento encontrado</div>
          {user && <button className="btn bf bsm" style={{ marginTop: 8 }} onClick={() => setShowForm(true)}>Seja o primeiro!</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {filtered.map(t => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialCard({ testimonial: t }) {
  const name    = t.profiles?.name || t.profiles?.email?.split('@')[0] || 'Usuário';
  const initial = name[0].toUpperCase();

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StarRating value={t.rating} />
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>
          {new Date(t.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', flex: 1, fontStyle: 'italic' }}>
        "{t.message}"
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: '1px solid var(--ovV)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          {initial}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
          {(t.role || t.company) && (
            <div style={{ fontSize: 11, color: '#6B7280' }}>
              {[t.role, t.company].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
