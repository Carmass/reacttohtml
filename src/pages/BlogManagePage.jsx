import { useState } from 'react';
import { C } from '../lib/tokens.js';
import {
  usePosts, useCategories, useTags, useComments, useNewsletterSubscribers, useMedia,
  createPost, updatePost, deletePost, approveComment, deleteComment, deleteMedia,
} from '../hooks/useDB.js';
import { useAuth } from '../hooks/useDB.js';
import { supabase } from '../lib/supabase.js';

const TABS = [
  { id: 'overview',   ico: '📊', label: 'Visão Geral' },
  { id: 'posts',      ico: '📝', label: 'Posts' },
  { id: 'editor',     ico: '✏️',  label: 'Editor de Post' },
  { id: 'categories', ico: '🗂️', label: 'Categorias' },
  { id: 'tags',       ico: '🏷️', label: 'Tags' },
  { id: 'newsletter', ico: '📧', label: 'Newsletter' },
  { id: 'scheduled',  ico: '⏰', label: 'Agendados' },
  { id: 'comments',   ico: '💬', label: 'Comentários' },
  { id: 'media',      ico: '🖼️', label: 'Mídias' },
];

export default function BlogManagePage({ showToast, go }) {
  const { profile } = useAuth();
  const [tab, setTab]         = useState('overview');
  const [editPost, setEditPost] = useState(null);

  if (profile?.role !== 'admin') {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        <div className="empty-ico">🚫</div>
        <div>Acesso restrito a administradores.</div>
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
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => { setTab(t.id); setEditPost(null); }}
          >
            {t.ico} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'   && <OverviewTab go={go} setTab={setTab} />}
      {tab === 'posts'      && <PostsTab showToast={showToast} setTab={setTab} setEditPost={setEditPost} />}
      {tab === 'editor'     && <PostEditorTab showToast={showToast} editPost={editPost} setEditPost={setEditPost} setTab={setTab} />}
      {tab === 'categories' && <CategoriesTab showToast={showToast} />}
      {tab === 'tags'       && <TagsTab showToast={showToast} />}
      {tab === 'newsletter' && <NewsletterTab />}
      {tab === 'scheduled'  && <ScheduledTab showToast={showToast} setTab={setTab} setEditPost={setEditPost} />}
      {tab === 'comments'   && <CommentsTab showToast={showToast} />}
      {tab === 'media'      && <MediaTab showToast={showToast} />}
    </div>
  );
}

/* ── Overview ── */
function OverviewTab({ go, setTab }) {
  const { data: posts }       = usePosts();
  const { data: categories }  = useCategories();
  const { data: tags }        = useTags();
  const { data: subscribers } = useNewsletterSubscribers();

  const published  = posts.filter(p => p.status === 'published').length;
  const draft      = posts.filter(p => p.status === 'draft').length;
  const scheduled  = posts.filter(p => p.status === 'scheduled').length;

  const stats = [
    { l: 'Posts Publicados', v: published, ico: '✅', col: C.sucC },
    { l: 'Rascunhos',        v: draft,     ico: '📝', col: C.pC  },
    { l: 'Agendados',        v: scheduled, ico: '⏰', col: C.warnC },
    { l: 'Inscritos',        v: subscribers.length, ico: '📧', col: C.secC },
    { l: 'Categorias',       v: categories.length,  ico: '🗂️', col: C.s2  },
    { l: 'Tags',             v: tags.length,         ico: '🏷️', col: C.s2  },
  ];

  return (
    <div>
      <div className="mg" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ background: s.col, border: 'none' }}>
            <div className="cb" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div className="ml">{s.l}</div>
                  <div className="mv">{s.v}</div>
                </div>
                <span style={{ fontSize: 26, opacity: .7 }}>{s.ico}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="ch">
          <span className="ct">📝 Posts Recentes</span>
          <button className="btn bsm bf" onClick={() => setTab('editor')}>+ Novo Post</button>
        </div>
        <div className="cb">
          <RecentPostsList />
        </div>
      </div>
    </div>
  );
}

function RecentPostsList() {
  const { data: posts } = usePosts();
  const recent = posts.slice(0, 5);
  if (!recent.length) return <div className="empty" style={{ padding: 24 }}>Nenhum post criado ainda.</div>;
  return (
    <table className="tbl">
      <thead><tr><th>Título</th><th>Status</th><th>Categoria</th><th>Data</th></tr></thead>
      <tbody>
        {recent.map(p => (
          <tr key={p.id}>
            <td style={{ fontWeight: 600 }}>{p.title}</td>
            <td><StatusBadge status={p.status} /></td>
            <td style={{ color: C.onV }}>{p.categories?.name || '—'}</td>
            <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusBadge({ status }) {
  const map = { published: 'cs', draft: 'cg', scheduled: 'cw', archived: 'ce' };
  const labels = { published: 'Publicado', draft: 'Rascunho', scheduled: 'Agendado', archived: 'Arquivado' };
  return <span className={`chip ${map[status] || 'cg'}`}>{labels[status] || status}</span>;
}

/* ── Posts List ── */
function PostsTab({ showToast, setTab, setEditPost }) {
  const { data: posts, refetch } = usePosts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = posts.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  async function handleDelete(id) {
    if (!confirm('Excluir este post?')) return;
    await deletePost(id);
    refetch();
    showToast('✅ Post excluído!');
  }

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">📝 Posts ({filtered.length})</span>
        <button className="btn bsm bf" onClick={() => { setEditPost(null); setTab('editor'); }}>+ Novo Post</button>
      </div>
      <div className="cb">
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-ico">🔍</span>
            <input className="fi search-input" placeholder="Buscar posts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="fi" style={{ height: 38, width: 140 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
            <option value="scheduled">Agendados</option>
            <option value="archived">Arquivados</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>
            <div className="empty-ico">📭</div>
            Nenhum post encontrado
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Título</th><th>Status</th><th>Categoria</th><th>Data</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    {p.excerpt && <div style={{ fontSize: 11, color: C.onV, marginTop: 2 }}>{p.excerpt.slice(0, 80)}…</div>}
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td style={{ color: C.onV }}>{p.categories?.name || '—'}</td>
                  <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn bsm bt" onClick={() => { setEditPost(p); setTab('editor'); }}>✏️ Editar</button>
                      <button className="btn bsm berr" onClick={() => handleDelete(p.id)}>🗑</button>
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

/* ── Post Editor ── */
function PostEditorTab({ showToast, editPost, setEditPost, setTab }) {
  const { data: categories } = useCategories();
  const { data: tags }       = useTags();
  const { profile }          = useAuth();
  const [form, setForm] = useState({
    title:          editPost?.title        ?? '',
    slug:           editPost?.slug         ?? '',
    excerpt:        editPost?.excerpt      ?? '',
    content:        editPost?.content      ?? '',
    cover_image:    editPost?.cover_image  ?? '',
    category_id:    editPost?.category_id  ?? '',
    status:         editPost?.status       ?? 'draft',
    scheduled_date: editPost?.scheduled_date ?? '',
    meta_title:     editPost?.meta_title   ?? '',
    meta_description: editPost?.meta_description ?? '',
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function autoSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function save() {
    if (!form.title) { showToast('⚠️ Título obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || autoSlug(form.title),
        author_id: profile?.id,
        category_id: form.category_id || null,
      };
      if (editPost?.id) {
        await updatePost(editPost.id, payload);
        showToast('✅ Post atualizado!');
      } else {
        await createPost(payload);
        showToast('✅ Post criado!');
      }
      setTab('posts');
    } catch (e) {
      showToast('❌ Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">{editPost ? '✏️ Editar Post' : '✏️ Novo Post'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn bsm bt" onClick={() => setTab('posts')}>Cancelar</button>
          <button className="btn bsm bf" onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : '💾 Salvar'}
          </button>
        </div>
      </div>
      <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="two">
          <div className="fld">
            <label>Título *</label>
            <input className="fi" value={form.title} onChange={e => { set('title', e.target.value); if (!editPost) set('slug', autoSlug(e.target.value)); }} placeholder="Título do post" />
          </div>
          <div className="fld">
            <label>Slug (URL)</label>
            <input className="fi" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="meu-post-url" />
          </div>
        </div>

        <div className="fld">
          <label>Resumo (excerpt)</label>
          <textarea className="fi" rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="Breve descrição do post..." />
        </div>

        <div className="fld">
          <label>Conteúdo</label>
          <textarea className="fi" rows={12} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Conteúdo completo do post em HTML ou Markdown..." style={{ minHeight: 240 }} />
        </div>

        <div className="three">
          <div className="fld">
            <label>Categoria</label>
            <select className="fi" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">Sem categoria</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="fld">
            <label>Status</label>
            <select className="fi" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="scheduled">Agendado</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
          <div className="fld">
            <label>Imagem de capa (URL)</label>
            <input className="fi" value={form.cover_image} onChange={e => set('cover_image', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {form.status === 'scheduled' && (
          <div className="fld">
            <label>Data/hora de publicação</label>
            <input className="fi" type="datetime-local" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} />
          </div>
        )}

        <div style={{ padding: '14px 0 0', borderTop: '1px solid var(--ovV)' }}>
          <div className="ct" style={{ marginBottom: 10 }}>SEO</div>
          <div className="two">
            <div className="fld">
              <label>Meta Title</label>
              <input className="fi" value={form.meta_title} onChange={e => set('meta_title', e.target.value)} placeholder="Título para buscadores" />
            </div>
            <div className="fld">
              <label>Meta Description</label>
              <input className="fi" value={form.meta_description} onChange={e => set('meta_description', e.target.value)} placeholder="Descrição para buscadores" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Categories ── */
function CategoriesTab({ showToast }) {
  const { data: categories, refetch } = useCategories();
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name) { showToast('⚠️ Nome obrigatório'); return; }
    setSaving(true);
    try {
      await supabase.from('categories').insert({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
      });
      showToast('✅ Categoria criada!');
      setForm({ name: '', slug: '', description: '' });
      refetch();
    } catch (e) {
      showToast('❌ ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function del(id) {
    if (!confirm('Excluir categoria?')) return;
    await supabase.from('categories').delete().eq('id', id);
    refetch();
    showToast('✅ Excluída!');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
      <div className="card">
        <div className="ch"><span className="ct">🗂️ Categorias ({categories.length})</span></div>
        <div className="cb">
          {categories.length === 0 ? (
            <div className="empty" style={{ padding: 30 }}>Nenhuma categoria criada</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Nome</th><th>Slug</th><th>Descrição</th><th>Ações</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{c.slug}</td>
                    <td style={{ color: C.onV }}>{c.description || '—'}</td>
                    <td><button className="btn bsm berr" onClick={() => del(c.id)}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="ch"><span className="ct">+ Nova Categoria</span></div>
        <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="fld"><label>Nome *</label><input className="fi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Tutoriais" /></div>
          <div className="fld"><label>Slug</label><input className="fi" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="tutoriais" /></div>
          <div className="fld"><label>Descrição</label><textarea className="fi" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <button className="btn bf" onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Criar Categoria'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Tags ── */
function TagsTab({ showToast }) {
  const { data: tags, refetch } = useTags();
  const [name, setName] = useState('');

  async function save() {
    if (!name) return;
    await supabase.from('tags').insert({ name, slug: name.toLowerCase().replace(/\s+/g, '-') });
    setName('');
    refetch();
    showToast('✅ Tag criada!');
  }

  async function del(id) {
    await supabase.from('tags').delete().eq('id', id);
    refetch();
  }

  return (
    <div className="card">
      <div className="ch"><span className="ct">🏷️ Tags ({tags.length})</span></div>
      <div className="cb">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="fi" value={name} onChange={e => setName(e.target.value)} placeholder="Nome da tag" onKeyDown={e => e.key === 'Enter' && save()} />
          <button className="btn bf" onClick={save}>Adicionar</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map(t => (
            <div key={t.id} className="chip cp" style={{ gap: 8 }}>
              {t.name}
              <button onClick={() => del(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 12 }}>×</button>
            </div>
          ))}
          {tags.length === 0 && <div className="empty" style={{ padding: 20, width: '100%' }}>Nenhuma tag criada</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Newsletter ── */
function NewsletterTab() {
  const { data: subscribers } = useNewsletterSubscribers();
  const active = subscribers.filter(s => s.active !== false).length;

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">📧 Newsletter ({subscribers.length} inscritos)</span>
        <span className="chip cs">{active} ativos</span>
      </div>
      <div className="cb">
        <table className="tbl">
          <thead><tr><th>Email</th><th>Nome</th><th>Data de inscrição</th><th>Status</th></tr></thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: C.onV, padding: 32 }}>Nenhum inscrito ainda</td></tr>
            ) : (
              subscribers.map(s => (
                <tr key={s.id}>
                  <td className="mono" style={{ fontSize: 12 }}>{s.email}</td>
                  <td>{s.name || '—'}</td>
                  <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(s.created_at).toLocaleDateString('pt-BR')}</td>
                  <td><span className={`chip ${s.active !== false ? 'cs' : 'ce'}`}>{s.active !== false ? 'Ativo' : 'Cancelado'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Scheduled ── */
function ScheduledTab({ showToast, setTab, setEditPost }) {
  const { data: posts, refetch } = usePosts();
  const scheduled = posts.filter(p => p.status === 'scheduled');

  async function publishNow(p) {
    await updatePost(p.id, { status: 'published', scheduled_date: null });
    refetch();
    showToast('✅ Post publicado!');
  }

  return (
    <div className="card">
      <div className="ch"><span className="ct">⏰ Posts Agendados ({scheduled.length})</span></div>
      <div className="cb">
        {scheduled.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>
            <div className="empty-ico">⏰</div>
            Nenhum post agendado
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Título</th><th>Publicação agendada</th><th>Ações</th></tr></thead>
            <tbody>
              {scheduled.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.title}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{p.scheduled_date ? new Date(p.scheduled_date).toLocaleString('pt-BR') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn bsm bf" onClick={() => publishNow(p)}>Publicar agora</button>
                      <button className="btn bsm bt" onClick={() => { setEditPost(p); setTab('editor'); }}>✏️ Editar</button>
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

/* ── Comments ── */
function CommentsTab({ showToast }) {
  const { data: posts } = usePosts();
  const [selPost, setSelPost] = useState('');
  const { data: comments, refetch } = useComments(selPost || null);

  async function handleApprove(id) {
    await approveComment(id);
    refetch();
    showToast('✅ Comentário aprovado!');
  }

  async function handleDelete(id) {
    if (!confirm('Excluir comentário?')) return;
    await deleteComment(id);
    refetch();
  }

  const pending  = comments.filter(c => !c.approved).length;
  const approved = comments.filter(c => c.approved).length;

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">💬 Moderação de Comentários</span>
        {pending > 0 && <span className="chip cw">{pending} pendentes</span>}
      </div>
      <div className="cb">
        <div className="fld" style={{ marginBottom: 14 }}>
          <label>Filtrar por post</label>
          <select className="fi" value={selPost} onChange={e => setSelPost(e.target.value)}>
            <option value="">Todos os posts</option>
            {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        {comments.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>
            <div className="empty-ico">💬</div>
            Nenhum comentário encontrado
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Autor</th><th>Comentário</th><th>Status</th><th>Data</th><th>Ações</th></tr></thead>
            <tbody>
              {comments.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.author_name || 'Anônimo'}</td>
                  <td style={{ maxWidth: 300, fontSize: 12 }}>{c.content}</td>
                  <td><span className={`chip ${c.approved ? 'cs' : 'cw'}`}>{c.approved ? 'Aprovado' : 'Pendente'}</span></td>
                  <td className="mono" style={{ fontSize: 11, color: C.onV }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!c.approved && <button className="btn bsm bf" onClick={() => handleApprove(c.id)}>✅ Aprovar</button>}
                      <button className="btn bsm berr" onClick={() => handleDelete(c.id)}>🗑</button>
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

/* ── Media ── */
function MediaTab({ showToast }) {
  const { data: media, refetch } = useMedia();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `media/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('media').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
      await supabase.from('media').insert({
        filename: file.name,
        url: publicUrl,
        mime_type: file.type,
        size: file.size,
      });
      refetch();
      showToast('✅ Mídia enviada!');
    } catch (err) {
      showToast('❌ ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir mídia?')) return;
    await deleteMedia(id);
    refetch();
  }

  return (
    <div className="card">
      <div className="ch">
        <span className="ct">🖼️ Biblioteca de Mídias ({media.length})</span>
        <label className="btn bsm bf" style={{ cursor: 'pointer' }}>
          {uploading ? 'Enviando…' : '⬆️ Enviar mídia'}
          <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleUpload} />
        </label>
      </div>
      <div className="cb">
        {media.length === 0 ? (
          <div className="empty" style={{ padding: 60 }}>
            <div className="empty-ico">🖼️</div>
            Nenhuma mídia enviada ainda
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
            {media.map(m => (
              <div key={m.id} style={{ background: 'var(--s1)', borderRadius: 10, overflow: 'hidden', position: 'relative', border: '1px solid var(--ovV)' }}>
                {m.mime_type?.startsWith('image') ? (
                  <img src={m.url} alt={m.filename} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
                )}
                <div style={{ padding: '6px 8px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.filename}</div>
                  <div style={{ fontSize: 10, color: C.onV }}>{m.size ? `${Math.round(m.size / 1024)}KB` : ''}</div>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(239,68,68,.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
