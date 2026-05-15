import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Upload, Trash2, Copy, Image as ImageIcon, Loader2,
  Download, Eye, CheckSquare, Square, X, Check
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [postImages, setPostImages] = useState([]); // images from posts not in Media entity
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(null); // { url, filename }
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [mediaData, posts] = await Promise.all([
      base44.entities.Media.list('-created_date', 500),
      base44.entities.Post.list('-created_date', 500),
    ]);

    // Collect all image URLs from posts (cover + inline images from content)
    const existingUrls = new Set(mediaData.map(m => m.file_url));
    const extra = [];

    for (const post of posts) {
      // Cover image
      if (post.cover_image_url && !existingUrls.has(post.cover_image_url)) {
        existingUrls.add(post.cover_image_url);
        extra.push({
          id: `post-cover-${post.id}`,
          file_url: post.cover_image_url,
          filename: post.cover_image_alt || `capa-${post.slug || post.id}`,
          file_type: 'image',
          mime_type: 'image/jpeg',
          created_date: post.created_date,
          source: 'post_cover',
          post_title: post.title,
          readOnly: true,
        });
      }

      // Inline images from HTML content
      if (post.content) {
        const matches = [...post.content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
        for (const match of matches) {
          const src = match[1];
          if (src && !existingUrls.has(src) && src.startsWith('http')) {
            existingUrls.add(src);
            extra.push({
              id: `post-img-${post.id}-${extra.length}`,
              file_url: src,
              filename: src.split('/').pop().split('?')[0] || 'imagem',
              file_type: 'image',
              mime_type: 'image/jpeg',
              created_date: post.created_date,
              source: 'post_content',
              post_title: post.title,
              readOnly: true,
            });
          }
        }
      }
    }

    setMedia(mediaData);
    setPostImages(extra);
    setLoading(false);
  };

  const allItems = [...media, ...postImages];

  const filtered = allItems.filter(m =>
    !search ||
    m.filename?.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase()) ||
    m.post_title?.toLowerCase().includes(search.toLowerCase())
  );

  // --- Upload ---
  const doUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const user = await base44.auth.me();
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Media.create({
        file_url,
        filename: file.name,
        file_type: file.type.startsWith('image/') ? 'image' : 'document',
        mime_type: file.type,
        uploaded_by: user.email,
      });
    }
    await loadAll();
    setUploading(false);
  };

  const handleFileInput = async (e) => {
    await doUpload(Array.from(e.target.files));
    e.target.value = '';
  };

  // --- Drag and Drop ---
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.includes('pdf'));
    if (files.length) await doUpload(files);
  }, []);

  // --- Selection ---
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const ids = selectableMedia.map(m => m.id);
    if (selected.size === ids.length && ids.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ids));
    }
  };

  const clearSelection = () => setSelected(new Set());

  // --- Delete ---
  const deleteOne = async (id) => {
    if (!confirm("Excluir esta mídia?")) return;
    await base44.entities.Media.delete(id);
    setMedia(m => m.filter(x => x.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const deleteBulk = async () => {
    if (!confirm(`Excluir ${selected.size} item(ns) selecionado(s)?`)) return;
    setDeleting(true);
    for (const id of selected) {
      if (!id.startsWith('post-')) {
        await base44.entities.Media.delete(id);
      }
    }
    setMedia(m => m.filter(x => !selected.has(x.id)));
    setSelected(new Set());
    setDeleting(false);
  };

  // --- Copy URL ---
  const copyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // --- Download ---
  const downloadImage = async (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'imagem';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const selectableMedia = filtered.filter(m => !m.readOnly);
  const selectableCount = selectableMedia.length;
  const selectedCount = selected.size;

  return (
    <div
      ref={dropZoneRef}
      className="min-h-screen bg-gray-50 p-6 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 border-4 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl px-10 py-8 shadow-2xl text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-xl font-bold text-blue-700">Solte para fazer upload</p>
            <p className="text-gray-500 text-sm mt-1">Imagens serão adicionadas à biblioteca</p>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={preview.url}
              alt={preview.filename}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between bg-black/50 rounded-lg px-4 py-2">
              <span className="text-white text-sm truncate max-w-xs">{preview.filename}</span>
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="secondary" onClick={() => copyUrl(preview.url, 'preview')}>
                  {copied === 'preview' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  Copiar URL
                </Button>
                <Button size="sm" variant="secondary" onClick={() => downloadImage(preview.url, preview.filename)}>
                  <Download className="w-3 h-3 mr-1" /> Baixar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AdminBlog')}>
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-6 h-6" /> Gerenciador de Mídia
            </h1>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-48"
            />
            <input ref={fileRef} type="file" accept="image/*,video/*,.pdf" multiple className="hidden" onChange={handleFileInput} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Fazer Upload
            </Button>
          </div>
        </div>

        {/* Bulk action bar */}
         {(selectedCount > 0 || selectableCount > 0) && !loading && (
          <div className="flex items-center gap-3 mb-4 bg-white border rounded-xl px-4 py-2 shadow-sm">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              {selectedCount === selectableCount && selectableCount > 0
                ? <CheckSquare className="w-4 h-4 text-blue-600" />
                : <Square className="w-4 h-4" />}
              {selectedCount === selectableCount && selectableCount > 0 ? "Desmarcar todos" : "Selecionar todos"}
            </button>
            {selectedCount > 0 && (
              <>
                <span className="text-sm text-gray-500">{selectedCount} selecionado(s)</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={deleteBulk}
                  disabled={deleting}
                  className="ml-auto"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                  Excluir selecionados
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="w-3 h-3 mr-1" /> Limpar
                </Button>
              </>
            )}
          </div>
        )}

        {/* Drag and Drop zone */}
        {!loading && selectableCount > 0 && (
          <div
            className={`border-2 border-dashed rounded-xl p-6 mb-4 text-center transition-all ${
              dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Arraste imagens aqui para fazer upload</p>
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <p className="text-xs text-gray-400 mb-4">
            {filtered.length} item(ns) — {media.length} na biblioteca, {postImages.length} das matérias
          </p>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma mídia encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(item => {
              const isSelected = selected.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden group relative transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {/* Selection checkbox (only for non-readOnly) */}
                  {!item.readOnly && (
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="absolute top-2 left-2 z-10 bg-white/90 rounded-md p-0.5 shadow"
                    >
                      {isSelected
                        ? <CheckSquare className="w-4 h-4 text-blue-600" />
                        : <Square className="w-4 h-4 text-gray-400" />}
                    </button>
                  )}

                  {/* Source badge */}
                  {item.readOnly && (
                    <div className="absolute top-2 left-2 z-10 bg-gray-900/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {item.source === 'post_cover' ? 'Capa' : 'Matéria'}
                    </div>
                  )}

                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={item.file_url}
                      alt={item.description || item.filename}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Visualizar"
                        onClick={() => setPreview({ url: item.file_url, filename: item.filename })}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Copiar URL"
                        onClick={() => copyUrl(item.file_url, item.id)}
                      >
                        {copied === item.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Baixar"
                        onClick={() => downloadImage(item.file_url, item.filename)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      {!item.readOnly && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          title="Excluir"
                          onClick={() => deleteOne(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-2">
                    <p className="text-xs text-gray-600 truncate" title={item.filename}>{item.filename}</p>
                    {item.post_title && (
                      <p className="text-[10px] text-blue-500 truncate" title={item.post_title}>{item.post_title}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {item.created_date ? format(new Date(item.created_date), 'dd/MM/yy', { locale: ptBR }) : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}