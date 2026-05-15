import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Wand2, Loader2, X, Image, Eye, Sparkles, User, Globe, Scissors, Calendar, ExternalLink, Monitor, Clock } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import MediaPickerModal from "@/components/blog/MediaPickerModal.jsx";
import AuthorProfileEdit from "@/components/blog/AuthorProfileEdit.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BlogNotificationProvider, useNotify } from "@/components/blog/BlogNotifications.jsx";
import TextRefinementPopup from "@/components/blog/TextRefinementPopup.jsx";
import PostLivePreview from "@/components/blog/PostLivePreview.jsx";
import AiToolsPanel from "@/components/blog/AiToolsPanel.jsx";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image', 'video'],
    ['code-block'],
    [{ align: [] }],
    ['clean']
  ]
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'link', 'image', 'video', 'code-block', 'align', 'indent'
];

const DRAFT_LANGS = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
];

function AdminPostEditorInner() {
  const notify = useNotify();
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  const [form, setForm] = useState({
    title: '', slug: '', content: '', excerpt: '', cover_image_url: '',
    cover_image_alt: '', status: 'draft', category_id: '', tag_ids: [],
    meta_title: '', meta_description: '', keywords: [], scheduled_date: ''
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiProvider, setAiProvider] = useState('base44');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [showAuthorEdit, setShowAuthorEdit] = useState(false);
  const [availableProviders, setAvailableProviders] = useState({ base44: true, openai: false, gemini: false });
  const [draftLang, setDraftLang] = useState('pt');
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [showRefinePopup, setShowRefinePopup] = useState(false);
  const [aiContentSuggestions, setAiContentSuggestions] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [autoSaveMinutes, setAutoSaveMinutes] = useState(5);
  const quillRef = useRef(null);
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  useEffect(() => { loadInitialData(); }, [postId]);

  // Auto-save setup
  useEffect(() => {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    const interval = setInterval(async () => {
      const f = formRef.current;
      if (!f.title) return;
      const user = await base44.auth.me();
      const data = {
        ...f,
        author_id: user.id,
        author_name: user.full_name,
        author_email: user.email,
        slug: f.slug || f.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      };
      const urlP = new URLSearchParams(window.location.search);
      const pId = urlP.get('id');
      if (pId) {
        await base44.entities.Post.update(pId, data);
      } else {
        const created = await base44.entities.Post.create({ ...data, status: 'draft' });
        window.history.replaceState({}, '', `?id=${created.id}`);
      }
      setLastAutoSave(new Date());
    }, autoSaveMinutes * 60 * 1000);
    setAutoSaveInterval(interval);
    return () => clearInterval(interval);
  }, [autoSaveMinutes]);

  const loadInitialData = async () => {
    setLoading(true);
    const [cats, tgs] = await Promise.all([
      base44.entities.Category.list(),
      base44.entities.Tag.list()
    ]);
    setCategories(cats);
    setTags(tgs);
    if (postId) {
      const posts = await base44.entities.Post.filter({ id: postId });
      if (posts[0]) setForm(f => ({ ...f, ...posts[0] }));
    }
    try {
      const provRes = await base44.functions.invoke('blogAiTools', { action: 'get_providers' });
      if (provRes.data) setAvailableProviders(provRes.data);
    } catch {
      // fallback: apenas base44 disponível
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    const prevStatus = postId ? form.status : null;
    const data = {
      ...form,
      author_id: user.id,
      author_name: user.full_name,
      author_email: user.email,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      published_date: form.status === 'published' && !form.published_date ? new Date().toISOString() : form.published_date
    };
    const urlP = new URLSearchParams(window.location.search);
    const currentId = urlP.get('id');
    if (currentId) {
      await base44.entities.Post.update(currentId, data);
      if (form.status === 'published') notify('Post publicado com sucesso!', 'success');
      else if (form.status === 'draft') notify('Rascunho salvo.', 'info');
      else notify('Post atualizado com sucesso!', 'success');
    } else {
      const created = await base44.entities.Post.create(data);
      window.history.replaceState({}, '', `?id=${created.id}`);
      notify(form.status === 'published' ? 'Post criado e publicado!' : 'Post criado como rascunho!', 'success');
    }
    setLastAutoSave(new Date());
    setSaving(false);
  };

  const handleAiDraft = async () => {
    if (!aiTopic) return;
    setAiLoading('draft');
    const res = await base44.functions.invoke('blogAiTools', { action: 'generate_draft', topic: aiTopic, ai_provider: aiProvider, language: draftLang });
    const data = res.data;
    setForm(f => ({ ...f, title: data.title || f.title, content: data.content || f.content, excerpt: data.excerpt || f.excerpt }));
    notify('Rascunho gerado com IA com sucesso!', 'success');
    setAiLoading(null);
  };

  const handleAiImage = async () => {
    setAiImageLoading(true);
    const res = await base44.functions.invoke('blogAiTools', {
      action: 'generate_image',
      topic: aiTopic || form.title,
      title: form.title,
      image_prompt: imagePrompt || undefined
    });
    if (res.data?.image_url) {
      setForm(f => ({ ...f, cover_image_url: res.data.image_url }));
      notify('Imagem de capa gerada com IA!', 'success');
    }
    setAiImageLoading(false);
    setShowImagePrompt(false);
    setImagePrompt('');
  };

  const handleAiSeo = async () => {
    setAiLoading('seo');
    const res = await base44.functions.invoke('blogAiTools', { action: 'suggest_seo', content: form.content, title: form.title, ai_provider: aiProvider });
    setAiSuggestions(res.data);
    notify('Sugestões SEO geradas com sucesso!', 'success');
    setAiLoading(null);
  };

  const handleAiTagsCategories = async () => {
    if (!form.content && !form.title) {
      notify('Escreva o conteúdo do post antes de gerar sugestões.', 'info');
      return;
    }
    setAiLoading('tags_categories');
    const res = await base44.functions.invoke('blogAiTools', {
      action: 'suggest_tags_categories',
      content: form.content,
      title: form.title,
      ai_provider: aiProvider
    });
    setAiContentSuggestions(res.data);
    notify('Sugestões de tags, categorias e keywords geradas!', 'success');
    setAiLoading(null);
  };

  const applyKeywords = (keywords) => {
    setForm(f => ({ ...f, keywords }));
    notify('Keywords aplicadas!', 'success');
  };

  const applyMetaDescription = (desc) => {
    setForm(f => ({ ...f, meta_description: desc }));
    notify('Meta description aplicada!', 'success');
  };

  const applyTag = async (tagName) => {
    const existing = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (existing) {
      toggleTag(existing.id, existing.name);
    } else {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const created = await base44.entities.Tag.create({ name: tagName, slug });
      setTags(prev => [...prev, created]);
      toggleTag(created.id, created.name);
      notify(`Tag "${tagName}" criada e aplicada!`, 'success');
    }
  };

  const applyCategory = async (catName) => {
    const existing = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (existing) {
      setForm(f => ({ ...f, category_id: existing.id, category_name: existing.name }));
    } else {
      const slug = catName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const created = await base44.entities.Category.create({ name: catName, slug });
      setCategories(prev => [...prev, created]);
      setForm(f => ({ ...f, category_id: created.id, category_name: created.name }));
      notify(`Categoria "${catName}" criada e aplicada!`, 'success');
    }
  };

  const handleAiExcerpt = async () => {
    setAiLoading('excerpt');
    const res = await base44.functions.invoke('blogAiTools', { action: 'generate_excerpt', content: form.content, title: form.title, ai_provider: aiProvider });
    setForm(f => ({ ...f, excerpt: res.data?.excerpt || f.excerpt }));
    notify('Resumo gerado com IA!', 'success');
    setAiLoading(null);
  };

  const handleGetSelectedText = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0) {
      setSelectedText(text);
      setShowRefinePopup(true);
    } else {
      notify('Selecione um trecho de texto no editor para refinar.', 'info');
    }
  };

  const handleReplaceText = (newText) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
      // Update form content from DOM if needed
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        setForm(f => ({ ...f, content: editor.root.innerHTML }));
      }
    }
    setShowRefinePopup(false);
    notify('Texto substituído com sucesso!', 'success');
  };

  const toggleTag = (tagId, tagName) => {
    setForm(f => ({
      ...f,
      tag_ids: f.tag_ids?.includes(tagId) ? f.tag_ids.filter(t => t !== tagId) : [...(f.tag_ids || []), tagId],
      tag_names: f.tag_ids?.includes(tagId) ? (f.tag_names || []).filter(n => n !== tagName) : [...(f.tag_names || []), tagName]
    }));
  };

  const openMediaPicker = () => setShowMediaPicker(true);

  const handleMediaSelect = (media) => {
    setForm(f => ({ ...f, cover_image_url: media.file_url }));
    setShowMediaPicker(false);
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('AdminBlog')}><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="font-semibold text-gray-900">{postId ? 'Editar Post' : 'Novo Post'}</h1>
          {postId && form.slug && form.status === 'published' && (
            <Link to={createPageUrl(`BlogPost?slug=${form.slug}`)} target="_blank">
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Ver post
              </Button>
            </Link>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={aiProvider} onValueChange={setAiProvider}>
            <SelectTrigger className="w-36 border-purple-200 text-purple-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="base44">IA Base44</SelectItem>
              {availableProviders.openai && <SelectItem value="openai">GPT (OpenAI)</SelectItem>}
              {availableProviders.gemini && <SelectItem value="gemini">Gemini</SelectItem>}
            </SelectContent>
          </Select>
          <Dialog open={showAuthorEdit} onOpenChange={setShowAuthorEdit}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Editar perfil de autor"><User className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar Perfil de Autor</DialogTitle></DialogHeader>
              <AuthorProfileEdit user={null} onSave={() => setShowAuthorEdit(false)} />
            </DialogContent>
          </Dialog>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
          {form.status === 'scheduled' && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              <input
                type="datetime-local"
                value={form.scheduled_date ? form.scheduled_date.slice(0, 16) : ''}
                onChange={e => setForm(f => ({ ...f, scheduled_date: new Date(e.target.value).toISOString() }))}
                className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <select value={autoSaveMinutes} onChange={e => setAutoSaveMinutes(Number(e.target.value))}
              className="border-0 bg-transparent text-xs text-gray-400 cursor-pointer focus:outline-none">
              <option value={2}>2min</option>
              <option value={5}>5min</option>
              <option value={10}>10min</option>
            </select>
            {lastAutoSave && <span>· salvo {lastAutoSave.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
          <Button variant="outline" onClick={() => setShowPreview(true)} className="border-gray-300">
            <Monitor className="w-4 h-4 mr-1" /> Pré-visualizar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* AI Draft Generator - Gemini-style */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-purple-800 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" /> Gerar rascunho com IA
              </p>
              <Select value={draftLang} onValueChange={setDraftLang}>
                <SelectTrigger className="w-32 h-7 text-xs border-purple-200 bg-white text-purple-700">
                  <Globe className="w-3 h-3 mr-1" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRAFT_LANGS.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Textarea
                placeholder="Descreva o tema do post em detalhes... Ex: Escreva um artigo completo sobre como a inteligência artificial está transformando o marketing digital em 2025, incluindo tendências, ferramentas e estratégias práticas."
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                className="bg-white min-h-[120px] resize-none text-sm rounded-xl border-purple-200 focus:border-purple-400 pr-3"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAiDraft(); }}
              />
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-purple-500">Ctrl+Enter para gerar</p>
              <Button onClick={handleAiDraft} disabled={aiLoading === 'draft' || !aiTopic}
                className="bg-purple-600 hover:bg-purple-700 text-white">
                {aiLoading === 'draft' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Gerar Rascunho
              </Button>
            </div>
          </div>

          <Input placeholder="Título do post" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
            className="text-xl font-semibold bg-white" />

          <div className="bg-white rounded-xl border overflow-hidden">
            <style>{`
              .ql-editor pre.ql-syntax {
                background-color: #282c34 !important;
                color: #abb2bf !important;
                border-radius: 6px;
                padding: 16px;
                font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
                font-size: 13px;
                line-height: 1.6;
                overflow-x: auto;
              }
              .ql-editor code {
                background-color: #f0f0f0;
                border-radius: 3px;
                padding: 2px 5px;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 0.9em;
                color: #e83e8c;
              }
              .hljs-keyword { color: #c678dd; }
              .hljs-string { color: #98c379; }
              .hljs-number { color: #d19a66; }
              .hljs-comment { color: #5c6370; font-style: italic; }
              .hljs-function { color: #61afef; }
              .hljs-tag { color: #e06c75; }
              .hljs-attr { color: #d19a66; }
            `}</style>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={form.content}
              onChange={v => setForm(f => ({ ...f, content: v }))}
              modules={quillModules}
              formats={quillFormats}
              style={{ minHeight: '400px' }}
            />
          </div>

          {/* Text refinement button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleGetSelectedText}
              className="text-purple-600 border-purple-200 hover:bg-purple-50">
              <Scissors className="w-3.5 h-3.5 mr-1.5" />
              Refinar Texto Selecionado com IA
            </Button>
          </div>

          <Tabs defaultValue="excerpt">
            <TabsList>
              <TabsTrigger value="excerpt">Resumo</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="excerpt" className="bg-white rounded-xl border p-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Resumo (Excerpt)</label>
                <Button variant="outline" size="sm" onClick={handleAiExcerpt} disabled={aiLoading === 'excerpt'}>
                  {aiLoading === 'excerpt' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                  Gerar com IA
                </Button>
              </div>
              <Textarea placeholder="Breve descrição do post..." value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={3} />
            </TabsContent>
            <TabsContent value="seo" className="bg-white rounded-xl border p-4 space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleAiSeo} disabled={aiLoading === 'seo'}>
                  {aiLoading === 'seo' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                  Sugerir com IA
                </Button>
              </div>
              {aiSuggestions && (
                <div className="bg-purple-50 rounded-lg p-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-1">Sugestões de título:</p>
                    {aiSuggestions.titles?.map((t, i) => (
                      <button key={i} className="block text-sm text-left w-full p-2 hover:bg-purple-100 rounded cursor-pointer" onClick={() => setForm(f => ({ ...f, meta_title: t }))}>{t}</button>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-1">Sugestões de meta description:</p>
                    {aiSuggestions.meta_descriptions?.map((d, i) => (
                      <button key={i} className="block text-sm text-left w-full p-2 hover:bg-purple-100 rounded cursor-pointer" onClick={() => setForm(f => ({ ...f, meta_description: d }))}>{d}</button>
                    ))}
                  </div>
                </div>
              )}
              <div><label className="text-sm font-medium text-gray-700">Meta Título</label><Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="Título para SEO (máx 60 chars)" /></div>
              <div><label className="text-sm font-medium text-gray-700">Meta Description</label><Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Descrição para SEO (máx 160 chars)" rows={2} /></div>
              <div><label className="text-sm font-medium text-gray-700">Slug</label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          {/* Cover Image */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <label className="text-sm font-medium text-gray-700">Imagem de Capa</label>
            {form.cover_image_url ? (
              <div className="relative">
                <img src={form.cover_image_url} alt="" className="w-full h-40 object-cover rounded-lg" />
                <button className="absolute top-2 right-2 bg-white rounded-full p-1 shadow" onClick={() => setForm(f => ({ ...f, cover_image_url: '' }))}><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button onClick={openMediaPicker} className="w-full h-28 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400">
                <div className="text-center"><Image className="w-6 h-6 mx-auto mb-1" /><span className="text-sm">Selecionar da galeria</span></div>
              </button>
            )}

            {/* AI Image Generation */}
            <div className="space-y-2">
              <button onClick={() => setShowImagePrompt(!showImagePrompt)}
                className="w-full py-2 border-2 border-dashed border-purple-200 rounded-lg flex items-center justify-center gap-2 text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors text-sm">
                <Sparkles className="w-4 h-4" />
                {form.cover_image_url ? 'Regenerar com IA' : 'Gerar com IA'}
              </button>
              {showImagePrompt && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Descreva a imagem desejada (opcional)... Ex: A futuristic cityscape with AI robots, blue neon lights, photorealistic style"
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <Button onClick={handleAiImage} disabled={aiImageLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                    {aiImageLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {aiImageLoading ? 'Gerando...' : 'Gerar Imagem'}
                  </Button>
                </div>
              )}
            </div>
            <Input placeholder="Texto alternativo" value={form.cover_image_alt} onChange={e => setForm(f => ({ ...f, cover_image_alt: e.target.value }))} />
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border p-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">Categoria</label>
            <Select value={form.category_id} onValueChange={v => {
              const cat = categories.find(c => c.id === v);
              setForm(f => ({ ...f, category_id: v, category_name: cat?.name || '' }));
            }}>
              <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border p-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button key={tag.id} onClick={() => toggleTag(tag.id, tag.name)}
                  className={`px-2 py-1 rounded-full text-xs border transition-colors ${form.tag_ids?.includes(tag.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* AI Tools Panel */}
          <AiToolsPanel
            form={form}
            aiProvider={aiProvider}
            notify={notify}
            onApplyTitle={(title) => setForm(f => ({ ...f, title, slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
          />

          {/* AI Tags/Categories/Keywords suggestions */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Sugestões com IA
              </p>
              <Button size="sm" variant="outline"
                onClick={handleAiTagsCategories}
                disabled={aiLoading === 'tags_categories'}
                className="border-green-300 text-green-700 hover:bg-green-100 h-7 text-xs">
                {aiLoading === 'tags_categories' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                Analisar
              </Button>
            </div>

            {aiContentSuggestions ? (
              <div className="space-y-3">
                {aiContentSuggestions.suggested_categories?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Categorias sugeridas:</p>
                    <div className="flex flex-wrap gap-1">
                      {aiContentSuggestions.suggested_categories.map((cat, i) => (
                        <button key={i} onClick={() => applyCategory(cat)}
                          className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 transition-colors">
                          + {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {aiContentSuggestions.suggested_tags?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Tags sugeridas:</p>
                    <div className="flex flex-wrap gap-1">
                      {aiContentSuggestions.suggested_tags.map((tag, i) => (
                        <button key={i} onClick={() => applyTag(tag)}
                          className="px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-800 border border-teal-300 hover:bg-teal-200 transition-colors">
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {aiContentSuggestions.keywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Keywords SEO:</p>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {aiContentSuggestions.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">{kw}</span>
                      ))}
                    </div>
                    <button onClick={() => applyKeywords(aiContentSuggestions.keywords)}
                      className="text-xs text-blue-600 hover:underline">
                      Aplicar todas as keywords
                    </button>
                  </div>
                )}
                {aiContentSuggestions.meta_description && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Meta description sugerida:</p>
                    <p className="text-xs text-gray-600 bg-white rounded p-2 border">{aiContentSuggestions.meta_description}</p>
                    <button onClick={() => applyMetaDescription(aiContentSuggestions.meta_description)}
                      className="text-xs text-blue-600 hover:underline mt-1">
                      Aplicar meta description
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-green-600">Clique em "Analisar" para gerar sugestões automáticas de tags, categorias, keywords e meta description com base no conteúdo do post.</p>
            )}
          </div>
        </div>
      </div>

      {showMediaPicker && (
        <MediaPickerModal onSelect={handleMediaSelect} onClose={() => setShowMediaPicker(false)} />
      )}

      {showPreview && (
        <PostLivePreview post={form} onClose={() => setShowPreview(false)} />
      )}

      {showRefinePopup && (
        <TextRefinementPopup
          selectedText={selectedText}
          onReplace={handleReplaceText}
          onClose={() => setShowRefinePopup(false)}
          aiProvider={aiProvider}
        />
      )}
    </div>
  );
}

export default function AdminPostEditor() {
  return (
    <BlogNotificationProvider>
      <AdminPostEditorInner />
    </BlogNotificationProvider>
  );
}