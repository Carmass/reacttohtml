import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Upload, User, Loader2 } from 'lucide-react';

export default function ProfileAvatar({ user, onUpdate }) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida');
            return;
        }

        // Validar tamanho (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB');
            return;
        }

        setIsUploading(true);
        try {
            // Upload da imagem
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            // Atualizar perfil com a URL da imagem
            await base44.auth.updateMe({ profile_image: file_url });
            
            // Recarregar dados do usuário
            await onUpdate();
        } catch (error) {
            console.error('Erro ao fazer upload da imagem:', error);
            alert('Erro ao fazer upload da imagem. Tente novamente.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {user?.profile_image ? (
                        <img 
                            src={user.profile_image} 
                            alt={user.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-16 h-16 text-white" />
                    )}
                </div>
                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}
            </div>

            <div className="text-center">
                <h3 className="font-semibold text-gray-900">{user?.full_name}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {user?.role === 'admin' && (
                    <span className="inline-block mt-2 px-3 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                        Admin
                    </span>
                )}
            </div>

            <div className="w-full">
                <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                />
                <label htmlFor="avatar-upload">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        disabled={isUploading}
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                        <Upload className="w-4 h-4" />
                        Alterar Foto
                    </Button>
                </label>
                <p className="text-xs text-gray-500 text-center mt-2">
                    JPG, PNG ou GIF (máx. 5MB)
                </p>
            </div>
        </div>
    );
}