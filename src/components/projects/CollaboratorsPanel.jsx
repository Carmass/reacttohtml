import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Trash2, Mail, Eye, Download, Shield, Loader2, Users, Clock } from 'lucide-react';

const PERMISSION_LABELS = {
    view: { label: 'Visualizar', icon: Eye, color: 'bg-blue-100 text-blue-700' },
    download: { label: 'Baixar', icon: Download, color: 'bg-green-100 text-green-700' },
    full: { label: 'Acesso Total', icon: Shield, color: 'bg-purple-100 text-purple-700' },
};

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    revoked: 'bg-red-100 text-red-700',
};

export default function CollaboratorsPanel({ project, currentUser }) {
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePermission, setInvitePermission] = useState('view');
    const queryClient = useQueryClient();

    const { data: collaborators = [], isLoading } = useQuery({
        queryKey: ['collaborators', project.id],
        queryFn: () => base44.entities.ProjectCollaborator.filter({ project_id: project.id }, '-created_date'),
        enabled: !!project.id,
    });

    const inviteMutation = useMutation({
        mutationFn: async ({ email, permission }) => {
            // Check if already invited
            const existing = collaborators.find(c => c.collaborator_email === email && c.status !== 'revoked');
            if (existing) throw new Error('Este usuário já é colaborador deste projeto');
            if (email === project.created_by) throw new Error('O proprietário já tem acesso total');

            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

            // Create collaborator record first
            const collaborator = await base44.entities.ProjectCollaborator.create({
                project_id: project.id,
                project_name: project.name,
                owner_email: currentUser.email,
                collaborator_email: email,
                permission,
                status: 'pending',
                invite_token: token,
            });

            // Send invite via backend (handles email + in-app notification)
            const response = await base44.functions.invoke('inviteProjectCollaborator', {
                collaborator_email: email,
                project_id: project.id,
                project_name: project.name,
                permission,
            });

            // If user already exists in the platform, activate immediately so project shows up
            if (response.data?.user_exists) {
                await base44.entities.ProjectCollaborator.update(collaborator.id, { status: 'active' });
            }

            return collaborator;
        },
        onSuccess: (_, { email }) => {
            queryClient.invalidateQueries(['collaborators', project.id]);
            setInviteEmail('');
            alert(`✅ Convite enviado para ${email}!\n\nEle receberá um e-mail com instruções para acessar o projeto.`);
        },
        onError: (err) => alert('Erro: ' + err.message),
    });

    const removeMutation = useMutation({
        mutationFn: (id) => base44.entities.ProjectCollaborator.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['collaborators', project.id]),
    });

    const updatePermissionMutation = useMutation({
        mutationFn: ({ id, permission }) => base44.entities.ProjectCollaborator.update(id, { permission }),
        onSuccess: () => queryClient.invalidateQueries(['collaborators', project.id]),
    });

    const handleInvite = () => {
        if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
            alert('Digite um email válido');
            return;
        }
        inviteMutation.mutate({ email: inviteEmail.trim(), permission: invitePermission });
    };

    const activeCollaborators = collaborators.filter(c => c.status !== 'revoked');

    return (
        <div className="space-y-4">
            {/* Invite Form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-violet-500" />
                        Convidar Colaborador
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Compartilhe este projeto com outros membros da equipe
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder="email@exemplo.com"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1 text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        />
                        <Select value={invitePermission} onValueChange={setInvitePermission}>
                            <SelectTrigger className="w-full sm:w-40 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="view">👁 Visualizar</SelectItem>
                                <SelectItem value="download">⬇ Baixar</SelectItem>
                                <SelectItem value="full">🛡 Acesso Total</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleInvite}
                            disabled={inviteMutation.isPending}
                            className="bg-violet-600 hover:bg-violet-700 text-sm"
                        >
                            {inviteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Mail className="w-3 h-3 mr-1" />
                                    Convidar
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Collaborators List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-500" />
                        Colaboradores ({activeCollaborators.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                        </div>
                    ) : activeCollaborators.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Nenhum colaborador ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activeCollaborators.map((collab) => {
                                const permConfig = PERMISSION_LABELS[collab.permission] || PERMISSION_LABELS.view;
                                return (
                                    <div key={collab.id} className="flex items-center justify-between p-2 rounded-lg border bg-gray-50 gap-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-violet-600">
                                                    {(collab.collaborator_name || collab.collaborator_email || '?')[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{collab.collaborator_email}</p>
                                                {collab.collaborator_name && (
                                                    <p className="text-xs text-gray-500 truncate">{collab.collaborator_name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Select
                                                value={collab.permission}
                                                onValueChange={(val) => updatePermissionMutation.mutate({ id: collab.id, permission: val })}
                                            >
                                                <SelectTrigger className="h-7 text-xs w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="view">👁 Visualizar</SelectItem>
                                                    <SelectItem value="download">⬇ Baixar</SelectItem>
                                                    <SelectItem value="full">🛡 Acesso Total</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm(`Remover ${collab.collaborator_email} deste projeto?`)) {
                                                        removeMutation.mutate(collab.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}