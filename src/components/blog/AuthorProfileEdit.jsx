import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Upload, X } from "lucide-react";

export default function AuthorProfileEdit({ user, onSave }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    twitter: user?.twitter || '',
    linkedin: user?.linkedin || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, avatar_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    setSaving(false);
    onSave?.(form);
  };

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {form.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          {form.avatar_url && (
            <button onClick={() => setForm(f => ({ ...f, avatar_url: '' }))} className="absolute -top-1 -right-1 bg-white border rounded-full p-0.5 shadow">
              <X className="w-3 h-3 text-gray-600" />
            </button>
          )}
        </div>
        <div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            <Button variant="outline" size="sm" asChild disabled={uploading}>
              <span>{uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}Alterar foto</span>
            </Button>
          </label>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP. Max 5MB.</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Nome</label>
        <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome" />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
        <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Uma breve descrição sobre você..." rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Twitter/X</label>
          <Input value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))} placeholder="@usuario" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">LinkedIn</label>
          <Input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="url do perfil" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Salvar perfil
      </Button>
    </div>
  );
}