import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, EyeOff, MessageSquare, Tag, FolderOpen, Image, BarChart2, Wand2, Loader2, ExternalLink, Mail, Clock } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BlogNotificationProvider, useNotify } from "@/components/blog/BlogNotifications.jsx";
import AdminBlogStats from "@/components/blog/AdminBlogStats.jsx";
import AdminNewsletter from "@/components/blog/AdminNewsletter.jsx";

function AdminBlogInner() {
  const notify = useNotify();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [comments, setComments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [u, p, c, t, cm] = await Promise.all([
      base44.auth.me(),
      base44.entities.Post.list('-created_date', 100),
      base44.entities.Category.list(),
      base44.entities.Tag.list(),
      base44.entities.Comment.list('-created_date', 200)
    ]);
    setUser(u);
    setPosts(p);
    setCategories(c);
    setTags(t);
    setComments(cm);
    setLoading(false);
  };

  const deletePost = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    await base44.entities.Post.delete(id);
    setPosts(posts.filter(p => p.id !== id));
    notify('Post excluído com sucesso.', 'info');
  };

  const toggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const updated = await base44.entities.Post.update(post.id, {
      status: newStatus,
      published_date: newStatus === 'published' ? new Date().toISOString() : post.published_date
    });
    setPosts(posts.map(p => p.id === post.id ? { ...p, ...updated } : p));
    notify(newStatus === 'published' ? 'Post publicado!' : 'Post movido para rascunho.', 'success');
  };

  const handleBatchAction = async (action, label) => {
    if (!confirm(`Deseja ${label} para todos os posts? Isso pode levar alguns minutos.`)) return;
    setBatchLoading(action);
    const res = await base44.functions.invoke('batchUpdatePosts', { action });
    setBatchLoading(null);
    if (res.data?.results) {
      const ok = res.data.results.filter(r => r.status === 'ok').length;
      notify(`${label}: ${ok}/${res.data.total} posts atualizados com sucesso!`, 'success');
      await loadData();
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <div className="p-8 text-center text-gray-500">Acesso restrito a administradores.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Blog</h1>
          <div className="flex gap-2">
            <Link to={createPageUrl('BlogHome')} target="_blank">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" /> Ver Blog
              </Button>
            </Link>
            <Link to={createPageUrl('AdminPostEditor')}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Novo Post
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-4 flex-wrap gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Visão Geral</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="newsletter" className="flex items-center gap-1"><Mail className="w-3 h-3" /> Newsletter</TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Agendados</TabsTrigger>
            <TabsTrigger value="comments">
              <Link to={createPageUrl('AdminComments')} className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Comentários
              </Link>
            </TabsTrigger>
            <TabsTrigger value="media">
              <Link to={createPageUrl('AdminMedia')} className="flex items-center gap-1">
                <Image className="w-3 h-3" /> Mídia
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex gap-3 mb-4 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction('generate_images', 'gerar imagens com IA')}
                disabled={!!batchLoading}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {batchLoading === 'generate_images' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                Gerar imagens com IA (posts sem imagem)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction('fill_seo', 'preencher SEO com IA')}
                disabled={!!batchLoading}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {batchLoading === 'fill_seo' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                Preencher meta SEO com IA (posts sem SEO)
              </Button>
            </div>
            <AdminBlogStats posts={posts} comments={comments} />
          </TabsContent>

          <TabsContent value="posts">
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex gap-3">
              <Input
                placeholder="Buscar posts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-2">
                {['all', 'published', 'draft'].map(s => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === 'all' ? 'Todos' : s === 'published' ? 'Publicados' : 'Rascunhos'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Carregando...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-8 text-center text-gray-400">Nenhum post encontrado.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-600 w-16">Capa</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Título</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Autor</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Categoria</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">Data</th>
                      <th className="text-right p-4 text-sm font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map(post => (
                      <tr key={post.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="p-4">
                          {post.cover_image_url ? (
                            <img src={post.cover_image_url} alt={post.title} className="w-12 h-9 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-9 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">📄</div>
                          )}
                        </td>
                        <td className="p-4 font-medium text-gray-900 max-w-xs truncate">{post.title}</td>
                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{post.author_name || '-'}</td>
                        <td className="p-4">
                          <Badge className={post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-500">{post.category_name || '-'}</td>
                        <td className="p-4 text-sm text-gray-500">
                          {post.published_date ? format(new Date(post.published_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => toggleStatus(post)} title={post.status === 'published' ? 'Despublicar' : 'Publicar'}>
                              {post.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            {post.status === 'published' && post.slug && (
                              <Link to={createPageUrl(`BlogPost?slug=${post.slug}`)} target="_blank">
                                <Button variant="ghost" size="icon" title="Ver post publicado"><ExternalLink className="w-4 h-4 text-blue-500" /></Button>
                              </Link>
                            )}
                            <Link to={createPageUrl(`AdminPostEditor?id=${post.id}`)}>
                              <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deletePost(post.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager categories={categories} setCategories={setCategories} />
          </TabsContent>

          <TabsContent value="tags">
            <TagManager tags={tags} setTags={setTags} />
          </TabsContent>

          <TabsContent value="newsletter">
            <AdminNewsletter />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduledPostsManager posts={posts} loadData={loadData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminBlog() {
  return (
    <BlogNotificationProvider>
      <AdminBlogInner />
    </BlogNotificationProvider>
  );
}

function CategoryManager({ categories, setCategories }) {
  const notify = useNotify();
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [editing, setEditing] = useState(null);

  const save = async () => {
    if (!form.name || !form.slug) return;
    if (editing) {
      const updated = await base44.entities.Category.update(editing, form);
      setCategories(categories.map(c => c.id === editing ? { ...c, ...updated } : c));
      setEditing(null);
      notify('Categoria atualizada com sucesso!', 'success');
    } else {
      const created = await base44.entities.Category.create(form);
      setCategories([...categories, created]);
      notify('Categoria criada com sucesso!', 'success');
    }
    setForm({ name: '', slug: '', description: '' });
  };

  const remove = async (id) => {
    if (!confirm("Excluir categoria?")) return;
    await base44.entities.Category.delete(id);
    setCategories(categories.filter(c => c.id !== id));
    notify('Categoria excluída.', 'info');
  };

  const startEdit = (cat) => { setEditing(cat.id); setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' }); };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Categorias</h2>
      <div className="flex gap-3 mb-6">
        <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="max-w-xs" />
        <Input placeholder="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="max-w-xs" />
        <Button onClick={save}>{editing ? 'Salvar' : 'Adicionar'}</Button>
        {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm({ name: '', slug: '', description: '' }); }}>Cancelar</Button>}
      </div>
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div><span className="font-medium">{cat.name}</span> <span className="text-gray-400 text-sm ml-2">/{cat.slug}</span></div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => startEdit(cat)}><Edit className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => remove(cat.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduledPostsManager({ posts, loadData }) {
  const notify = useNotify();
  const scheduled = posts.filter(p => p.status === 'scheduled');

  const publishNow = async (post) => {
    await base44.entities.Post.update(post.id, { status: 'published', published_date: new Date().toISOString() });
    notify('Post publicado imediatamente!', 'success');
    await loadData();
  };

  const cancelSchedule = async (post) => {
    await base44.entities.Post.update(post.id, { status: 'draft', scheduled_date: null });
    notify('Agendamento cancelado. Post movido para rascunho.', 'info');
    await loadData();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4" /> Posts Agendados</h2>
        <p className="text-sm text-gray-500 mt-1">Posts que serão publicados automaticamente na data/hora agendada.</p>
      </div>
      {scheduled.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Nenhum post agendado.</div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Título</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Publicação Agendada</th>
              <th className="text-right p-4 text-sm font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {scheduled.map(post => (
              <tr key={post.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{post.title}</td>
                <td className="p-4 text-sm text-blue-600">
                  {post.scheduled_date ? format(new Date(post.scheduled_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => publishNow(post)}>Publicar agora</Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => cancelSchedule(post)}>Cancelar</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TagManager({ tags, setTags }) {
  const notify = useNotify();
  const [form, setForm] = useState({ name: '', slug: '' });
  const [editing, setEditing] = useState(null);

  const save = async () => {
    if (!form.name || !form.slug) return;
    if (editing) {
      const updated = await base44.entities.Tag.update(editing, form);
      setTags(tags.map(t => t.id === editing ? { ...t, ...updated } : t));
      setEditing(null);
      notify('Tag atualizada com sucesso!', 'success');
    } else {
      const created = await base44.entities.Tag.create(form);
      setTags([...tags, created]);
      notify('Tag criada com sucesso!', 'success');
    }
    setForm({ name: '', slug: '' });
  };

  const remove = async (id) => {
    if (!confirm("Excluir tag?")) return;
    await base44.entities.Tag.delete(id);
    setTags(tags.filter(t => t.id !== id));
    notify('Tag excluída.', 'info');
  };

  const startEdit = (tag) => { setEditing(tag.id); setForm({ name: tag.name, slug: tag.slug }); };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Tag className="w-4 h-4" /> Tags</h2>
      <div className="flex gap-3 mb-6">
        <Input placeholder="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="max-w-xs" />
        <Input placeholder="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="max-w-xs" />
        <Button onClick={save}>{editing ? 'Salvar' : 'Adicionar'}</Button>
        {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm({ name: '', slug: '' }); }}>Cancelar</Button>}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
            <span className="text-sm">{tag.name}</span>
            <button onClick={() => startEdit(tag)} className="text-gray-400 hover:text-blue-500 ml-1"><Edit className="w-3 h-3" /></button>
            <button onClick={() => remove(tag.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}