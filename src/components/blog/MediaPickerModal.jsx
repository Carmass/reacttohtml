import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Loader2, Check } from "lucide-react";

export default function MediaPickerModal({ onSelect, onClose }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { loadMedia(); }, []);

  const loadMedia = async () => {
    setLoading(true);
    const data = await base44.entities.Media.list('-created_date', 100);
    setMedia(data);
    setLoading(false);
  };

  const optimizeImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      img.onload = () => {
        // Resize if too large (max 1920px wide)
        const maxW = 1920;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(resolve, 'image/webp', 0.85);
      };
      img.src = url;
    });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const user = await base44.auth.me();
    for (const file of files) {
      let uploadFile = file;
      let filename = file.name;
      // Optimize image: convert to WebP
      if (file.type.startsWith('image/') && file.type !== 'image/gif') {
        const webpBlob = await optimizeImage(file);
        if (webpBlob) {
          uploadFile = new File([webpBlob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
          filename = uploadFile.name;
        }
      }
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      await base44.entities.Media.create({
        file_url, filename,
        file_type: 'image', mime_type: 'image/webp',
        uploaded_by: user.email
      });
    }
    await loadMedia();
    setUploading(false);
    e.target.value = '';
  };

  const filtered = media.filter(m => !search || m.filename?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Selecionar Mídia</h2>
          <div className="flex gap-2">
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
              Upload
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhuma mídia disponível.</div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filtered.map(item => (
                <button key={item.id} onClick={() => setSelected(item)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selected?.id === item.id ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}>
                  <img src={item.file_url} alt={item.filename} loading="lazy" className="w-full h-full object-cover" />
                  {selected?.id === item.id && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="bg-blue-600 rounded-full p-1"><Check className="w-4 h-4 text-white" /></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!selected} onClick={() => onSelect(selected)} className="bg-blue-600 hover:bg-blue-700">
            Inserir Imagem
          </Button>
        </div>
      </div>
    </div>
  );
}