import { useState } from 'react';
import { C } from '../lib/tokens.js';
import { usePosts, useCategories } from '../hooks/useDB.js';
import { supabase } from '../lib/supabase.js';

function PostCard({ post, go, featured = false }) {
  const dateStr = new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  if (featured) {
    return (
      <div
        className="card"
        style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 300, overflow: 'hidden' }}
        onClick={() => go('blog-post', { post })}
      >
        <div style={{ position: 'relative', minHeight: 240 }}>
          {post.cover_image
            ? <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${C.p},${C.sec})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>📝</div>
          }
          <div style={{ position: 'absolute', top: 14, left: 14 }}>
            <span style={{ background: C.p, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>DESTAQUE</span>
          </div>
        </div>
        <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {post.categories?.name && <span className="chip cp">{post.categories.name}</span>}
            {post.reading_time && <span className="chip cg">{post.reading_time} min leitura</span>}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 10, color: C.on }}>{post.title}</h2>
          {post.excerpt && <p style={{ fontSize: 14, color: C.onV, lineHeight: 1.65, marginBottom: 16 }}>{post.excerpt}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${C.p},${C.sec})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(post.author?.name ?? 'A')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{post.author?.name ?? 'Autor'}</div>
              <div style={{ fontSize: 11, color: C.onV }}>{dateStr}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: C.p, fontWeight: 600 }}>Ler artigo →</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform .14s, box-shadow .14s' }}
      onClick={() => go('blog-post', { post })}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = C.e3; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = C.e1; }}
    >
      <div style={{ height: 160, flexShrink: 0, position: 'relative' }}>
        {post.cover_image
          ? <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${C.p},${C.sec})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📝</div>
        }
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {post.categories?.name && <span className="chip cp">{post.categories.name}</span>}
          {post.reading_time && <span className="chip cg" style={{ fontSize: 10 }}>{post.reading_time} min</span>}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, marginBottom: 6, color: C.on }}>{post.title}</h3>
        {post.excerpt && <p style={{ fontSize: 12, color: C.onV, lineHeight: 1.5, marginBottom: 10, flex: 1 }}>{post.excerpt.slice(0, 100)}{post.excerpt.length > 100 ? '…' : ''}</p>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--ovV)' }}>
          <span style={{ fontSize: 11, color: C.onV }}>{post.author?.name ?? 'Autor'}</span>
          <span className="mono" style={{ fontSize: 11, color: C.onV }}>{dateStr}</span>
        </div>
      </div>
    </div>
  );
}

export default function BlogHomePage({ go }) {
  const { data: posts, loading } = usePosts(true);
  const { data: categories } = useCategories();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const featured = posts[0] ?? null;
  const rest = posts.slice(1);

  const filtered = rest.filter(p => {
    const matchCat = activeCategory === 'all' || p.categories?.name === activeCategory;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function subscribe(e) {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await supabase.from('newsletter_subscribers').insert({ email });
      setSubscribed(true);
    } catch {
      setSubscribed(true);
    } finally {
      setSubscribing(false);
    }
  }

  if (loading) {
    return (
      <div className="empty">
        <div className="spinner" style={{ width: 28, height: 28, color: C.p }} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: C.on, marginBottom: 4 }}>Blog</h1>
            <p style={{ color: C.onV, fontSize: 14 }}>Dicas, tutoriais e novidades sobre compilação React e desenvolvimento web</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="chip cg">{posts.length} artigo{posts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="empty">
          <div className="empty-ico">📝</div>
          <div style={{ fontWeight: 600 }}>Nenhum post publicado ainda</div>
          <div style={{ fontSize: 13, color: C.onV, marginTop: 4 }}>Volte em breve para novos conteúdos!</div>
        </div>
      ) : (
        <>
          {/* Featured post */}
          {featured && (
            <div style={{ marginBottom: 24 }}>
              <PostCard post={featured} go={go} featured />
            </div>
          )}

          {/* Search + Category filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
              <span className="search-ico">🔍</span>
              <input
                className="fi search-input"
                placeholder="Buscar artigos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="tabs" style={{ margin: 0 }}>
              <button className={`tab ${activeCategory === 'all' ? 'a' : ''}`} onClick={() => setActiveCategory('all')}>
                Todos
              </button>
              {categories.map(cat => (
                <button key={cat.id} className={`tab ${activeCategory === cat.name ? 'a' : ''}`} onClick={() => setActiveCategory(cat.name)}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Post grid */}
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">🔍</div>
              Nenhum post encontrado{search ? ` para "${search}"` : ''}.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
              {filtered.map(p => (
                <PostCard key={p.id} post={p} go={go} />
              ))}
            </div>
          )}

          {/* Newsletter CTA */}
          <div style={{ background: `linear-gradient(135deg,${C.p},#4F46E5)`, borderRadius: 18, padding: '32px 36px', textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📬</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Receba novidades no seu e-mail</h3>
            <p style={{ fontSize: 14, opacity: .85, marginBottom: 20 }}>Tutoriais, dicas e atualizações direto na sua caixa de entrada.</p>
            {subscribed ? (
              <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600 }}>
                ✅ Obrigado! Você está na lista.
              </div>
            ) : (
              <form onSubmit={subscribe} style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto' }}>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 10, border: 'none', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  style={{ height: 44, padding: '0 20px', borderRadius: 10, border: '2px solid rgba(255,255,255,.5)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                >
                  {subscribing ? '...' : 'Assinar'}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
