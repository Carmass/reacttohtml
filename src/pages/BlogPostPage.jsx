import { useState, useEffect } from 'react';
import { C } from '../lib/tokens.js';
import { supabase } from '../lib/supabase.js';

const SHARE_URLS = {
  WhatsApp: (url, title) => `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  Twitter:  (url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  LinkedIn: (url)        => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
};
const SHARE_COLORS = { WhatsApp: '#25D366', Twitter: '#1DA1F2', LinkedIn: '#0A66C2' };

export default function BlogPostPage({ params, go }) {
  const post = params?.post;
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ author_name: '', author_email: '', content: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!post?.id) return;
    supabase.from('comments').select('*').eq('post_id', post.id).eq('approved', true).order('created_at')
      .then(({ data }) => setComments(data ?? []));
  }, [post?.id]);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min((scrolled / total) * 100, 100) : 0);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!post) {
    return (
      <div className="empty">
        <div className="empty-ico">❌</div>
        Post não encontrado.
        <button className="btn bf bsm" style={{ marginTop: 8 }} onClick={() => go('blog')}>← Voltar ao Blog</button>
      </div>
    );
  }

  async function submitComment() {
    if (!form.author_name || !form.content) return;
    setSending(true);
    await supabase.from('comments').insert({ post_id: post.id, ...form, approved: false });
    setSending(false);
    setSent(true);
    setForm({ author_name: '', author_email: '', content: '' });
  }

  const dateStr = new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const pageUrl = window.location.href;

  return (
    <div className="fade-in">
      {/* Reading progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'var(--ovV)', zIndex: 200 }}>
        <div style={{ height: '100%', background: C.p, width: `${progress}%`, transition: 'width .1s' }} />
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <button className="btn bt bsm" style={{ marginBottom: 20 }} onClick={() => go('blog')}>← Blog</button>

        {/* Cover */}
        {post.cover_image
          ? <img src={post.cover_image} alt="" style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 16, marginBottom: 28 }} />
          : <div style={{ height: 220, background: `linear-gradient(135deg,${C.p},${C.sec})`, borderRadius: 16, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📝</div>
        }

        {/* Meta */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {post.categories?.name && <span className="chip cp">{post.categories.name}</span>}
          {post.reading_time && <span className="chip cg">{post.reading_time} min de leitura</span>}
          <span className="mono" style={{ fontSize: 11, color: C.onV, marginLeft: 4 }}>{dateStr}</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.2, marginBottom: 14, color: C.on }}>{post.title}</h1>
        {post.excerpt && (
          <p style={{ fontSize: 17, color: C.onV, lineHeight: 1.7, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--ovV)' }}>
            {post.excerpt}
          </p>
        )}

        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--ovV)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${C.p},${C.sec})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {(post.author?.name ?? 'A')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{post.author?.name ?? 'Equipe React to HTML'}</div>
            <div style={{ fontSize: 12, color: C.onV }}>Publicado em {dateStr}</div>
          </div>
          {/* Share buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(SHARE_URLS).map(([name, fn]) => (
              <a
                key={name}
                href={fn(pageUrl, post.title)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Compartilhar no ${name}`}
                style={{ width: 34, height: 34, borderRadius: 8, background: SHARE_COLORS[name] + '18', color: SHARE_COLORS[name], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, textDecoration: 'none', border: `1px solid ${SHARE_COLORS[name]}30`, flexShrink: 0 }}
              >
                {name === 'WhatsApp' ? '💬' : name === 'Twitter' ? '🐦' : '💼'}
              </a>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          style={{ fontSize: 15, lineHeight: 1.85, color: C.on }}
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ marginTop: 32, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {post.tags.map(tag => (
              <span key={tag} className="chip cg">#{tag}</span>
            ))}
          </div>
        )}

        {/* Share footer */}
        <div style={{ marginTop: 36, padding: '20px 24px', background: C.pC, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Gostou do artigo?</div>
            <div style={{ fontSize: 13, color: C.onV }}>Compartilhe com quem pode se beneficiar!</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(SHARE_URLS).map(([name, fn]) => (
              <a
                key={name}
                href={fn(pageUrl, post.title)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: SHARE_COLORS[name] + '18', color: SHARE_COLORS[name], fontSize: 13, fontWeight: 600, textDecoration: 'none', border: `1px solid ${SHARE_COLORS[name]}30` }}
              >
                {name === 'WhatsApp' ? '💬' : name === 'Twitter' ? '🐦' : '💼'} {name}
              </a>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>💬 Comentários ({comments.length})</h3>

          {comments.length === 0 && (
            <div className="empty" style={{ padding: 32 }}>
              <div className="empty-ico">💬</div>
              Seja o primeiro a comentar!
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {comments.map(c => (
              <div key={c.id} style={{ padding: '14px 16px', background: C.s1, borderRadius: 12, border: '1px solid var(--ovV)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.p, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {c.author_name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{c.author_name}</span>
                  <span className="mono" style={{ fontSize: 11, color: C.onV, marginLeft: 'auto' }}>
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: C.on, margin: 0 }}>{c.content}</p>
              </div>
            ))}
          </div>

          {/* Comment form */}
          <div className="card">
            <div className="ch"><span className="ct">Deixe um comentário</span></div>
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sent ? (
                <div style={{ padding: 14, background: C.sucC, borderRadius: 10, color: C.suc, fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
                  ✅ Comentário enviado para moderação. Obrigado!
                </div>
              ) : (
                <>
                  <div className="two">
                    <div className="fld">
                      <label>Nome *</label>
                      <input className="fi" placeholder="Seu nome" value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
                    </div>
                    <div className="fld">
                      <label>E-mail (não publicado)</label>
                      <input className="fi" type="email" placeholder="seu@email.com" value={form.author_email} onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="fld">
                    <label>Comentário *</label>
                    <textarea className="fi" placeholder="Escreva seu comentário..." rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
                  </div>
                  <button className="btn bf" style={{ alignSelf: 'flex-start' }} onClick={submitComment} disabled={sending || !form.author_name || !form.content}>
                    {sending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Enviando...</> : '💬 Enviar Comentário'}
                  </button>
                  <p style={{ fontSize: 12, color: C.onV, margin: 0 }}>Comentários ficam aguardando moderação antes de aparecer.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
