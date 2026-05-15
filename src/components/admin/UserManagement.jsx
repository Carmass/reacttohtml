import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    Search, UserPlus, Shield, User, Mail, Calendar, 
    Trash2, Edit, CheckCircle, XCircle, Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('user');
    const queryClient = useQueryClient();

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => base44.entities.User.list(),
    });

    const { data: currentUser } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me(),
    });

    const inviteMutation = useMutation({
        mutationFn: async ({ email, role }) => {
            // Usar função customizada que envia email com link de indicação
            const res = await base44.functions.invoke('sendInviteWithReferral', {
                email,
                role,
                inviter_user_id: currentUser?.id
            });
            if (!res.data.success) throw new Error(res.data.error || 'Erro ao enviar convite');
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            setInviteEmail('');
            alert('Convite enviado com sucesso! O email foi enviado com link de acesso e indicação.');
        },
        onError: (error) => {
            alert('Erro ao enviar convite: ' + error.message);
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, data }) => {
            await base44.entities.User.update(userId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            alert('Usuário atualizado com sucesso!');
        },
        onError: (error) => {
            alert('Erro ao atualizar usuário: ' + error.message);
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId) => {
            await base44.entities.User.delete(userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-users']);
            alert('Usuário removido com sucesso!');
        },
        onError: (error) => {
            alert('Erro ao remover usuário: ' + error.message);
        },
    });

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleInvite = () => {
        if (!inviteEmail) {
            alert('Digite um email válido');
            return;
        }
        inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
    };

    const toggleUserRole = (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        updateUserMutation.mutate({ userId, data: { role: newRole } });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Invite User */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Convidar Novo Usuário
                    </CardTitle>
                    <CardDescription>Envie um convite por email para adicionar um novo usuário</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-3">
                        <Input
                            placeholder="email@exemplo.com"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1"
                        />
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">Usuário</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={handleInvite}
                            disabled={inviteMutation.isPending}
                            className="bg-violet-600 hover:bg-violet-700"
                        >
                            {inviteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Enviar Convite
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Usuários Cadastrados</CardTitle>
                            <CardDescription>Gerenciar todos os usuários do sistema</CardDescription>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar usuários..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="user">Usuário</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Função</TableHead>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Cadastro</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            Nenhum usuário encontrado
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-violet-600" />
                                                    </div>
                                                    <span className="font-medium">{user.full_name || 'Sem nome'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                    {user.is_owner ? (
                                                        <>
                                                            <Shield className="w-3 h-3 mr-1" />
                                                            Proprietário
                                                        </>
                                                    ) : user.role === 'admin' ? (
                                                        <>
                                                            <Shield className="w-3 h-3 mr-1" />
                                                            Admin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <User className="w-3 h-3 mr-1" />
                                                            Usuário
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {user.current_plan || 'Gratuito'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {format(new Date(user.created_date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    {!user.is_owner && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => toggleUserRole(user.id, user.role)}
                                                                disabled={updateUserMutation.isPending}
                                                            >
                                                                {user.role === 'admin' ? (
                                                                    <XCircle className="w-4 h-4" />
                                                                ) : (
                                                                    <CheckCircle className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button size="sm" variant="destructive">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Tem certeza que deseja remover {user.email}? Esta ação não pode ser desfeita.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteUserMutation.mutate(user.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Remover
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </>
                                                    )}
                                                    {user.is_owner && (
                                                        <span className="text-xs text-gray-500 italic">Protegido</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        Total: {filteredUsers.length} usuário(s)
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}