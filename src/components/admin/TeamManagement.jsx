import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Trash2, Eye, Download, Shield, FolderOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const PERMISSION_LABELS = {
    view: { label: 'Visualizar', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    download: { label: 'Baixar', color: 'bg-green-100 text-green-700 border-green-200' },
    full: { label: 'Acesso Total', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export default function TeamManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPermission, setFilterPermission] = useState('all');
    const queryClient = useQueryClient();

    const { data: collaborators = [], isLoading } = useQuery({
        queryKey: ['admin-collaborators'],
        queryFn: () => base44.entities.ProjectCollaborator.list('-created_date', 200),
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['admin-all-projects'],
        queryFn: () => base44.entities.Project.list('-created_date', 200),
    });

    const removeMutation = useMutation({
        mutationFn: (id) => base44.entities.ProjectCollaborator.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-collaborators']);
            alert('Colaborador removido com sucesso!');
        },
        onError: (err) => alert('Erro: ' + err.message),
    });

    const filtered = collaborators.filter(c => {
        const matchesSearch =
            c.collaborator_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.owner_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPerm = filterPermission === 'all' || c.permission === filterPermission;
        return matchesSearch && matchesPerm;
    });

    // Stats
    const activeCollabs = collaborators.filter(c => c.status !== 'revoked');
    const uniqueProjects = new Set(collaborators.map(c => c.project_id)).size;
    const uniqueUsers = new Set(collaborators.map(c => c.collaborator_email)).size;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeCollabs.length}</p>
                                <p className="text-sm text-gray-500">Colaborações Ativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FolderOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{uniqueProjects}</p>
                                <p className="text-sm text-gray-500">Projetos Compartilhados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{uniqueUsers}</p>
                                <p className="text-sm text-gray-500">Colaboradores Únicos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Equipes e Colaboradores</CardTitle>
                            <CardDescription>Visão geral de todas as colaborações no sistema</CardDescription>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={filterPermission} onValueChange={setFilterPermission}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Permissão" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="view">Visualizar</SelectItem>
                                    <SelectItem value="download">Baixar</SelectItem>
                                    <SelectItem value="full">Acesso Total</SelectItem>
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
                                    <TableHead>Projeto</TableHead>
                                    <TableHead>Proprietário</TableHead>
                                    <TableHead>Colaborador</TableHead>
                                    <TableHead>Permissão</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            Nenhuma colaboração encontrada
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.map((collab) => {
                                    const permConfig = PERMISSION_LABELS[collab.permission] || PERMISSION_LABELS.view;
                                    return (
                                        <TableRow key={collab.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FolderOpen className="w-4 h-4 text-violet-400" />
                                                    <span className="font-medium text-sm">{collab.project_name || collab.project_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{collab.owner_email}</TableCell>
                                            <TableCell className="text-sm">{collab.collaborator_email}</TableCell>
                                            <TableCell>
                                                <Badge className={permConfig.color + ' border text-xs'}>
                                                    {permConfig.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={collab.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                                    {collab.status === 'active' ? 'Ativo' : collab.status === 'pending' ? 'Pendente' : 'Revogado'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {format(new Date(collab.created_date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm(`Remover colaborador ${collab.collaborator_email}?`)) {
                                                            removeMutation.mutate(collab.id);
                                                        }
                                                    }}
                                                    disabled={removeMutation.isPending}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                        Total: {filtered.length} colaboração(ões)
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}