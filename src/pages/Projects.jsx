import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, Settings, Trash2, ExternalLink, ArrowLeft, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import ProjectDetailsCard from '../components/projects/ProjectDetailsCard';
import ProjectSearchFilter from '../components/projects/ProjectSearchFilter';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import UserMenu from '../components/common/UserMenu';
import CollaboratorsPanel from '../components/projects/CollaboratorsPanel';

export default function Projects() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAssociateBuildsOpen, setIsAssociateBuildsOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [selectedProjectForBuilds, setSelectedProjectForBuilds] = useState(null);
    const [selectedBuildsToAssociate, setSelectedBuildsToAssociate] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [newProject, setNewProject] = useState({ name: '', description: '', selected_builds: [] });
    const [collaboratingProject, setCollaboratingProject] = useState(null);
    const [activeTab, setActiveTab] = useState('mine');
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            if (!user?.email) return [];
            return await base44.entities.Project.filter({ created_by: user.email }, '-created_date');
        },
        enabled: !!user?.email
    });

    // Shared projects (where this user is a collaborator)
    const { data: myCollaborations = [] } = useQuery({
        queryKey: ['my-collaborations', user?.email],
        queryFn: async () => {
            if (!user?.email) return [];
            return await base44.entities.ProjectCollaborator.filter(
                { collaborator_email: user.email, status: 'active' },
                '-created_date'
            );
        },
        enabled: !!user?.email
    });

    const sharedProjectIds = myCollaborations.map(c => c.project_id);

    const { data: sharedProjects = [] } = useQuery({
        queryKey: ['shared-projects', sharedProjectIds.join(',')],
        queryFn: async () => {
            if (sharedProjectIds.length === 0) return [];
            const results = await Promise.all(
                sharedProjectIds.map(id => base44.entities.Project.get(id).catch(() => null))
            );
            return results.filter(Boolean);
        },
        enabled: sharedProjectIds.length > 0
    });

    // Handle accept invite from URL
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const acceptInviteId = urlParams.get('accept_invite');
        if (acceptInviteId && user?.id) {
            base44.functions.invoke('acceptProjectInvite', { project_id: acceptInviteId })
                .then(() => {
                    queryClient.invalidateQueries(['my-collaborations']);
                    queryClient.invalidateQueries(['shared-projects']);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    alert('✅ Convite aceito! O projeto agora aparece na aba "Compartilhados comigo".');
                })
                .catch((err) => {
                    console.error('Erro ao aceitar convite:', err);
                });
        }
    }, [user?.id]);

    const { data: allBuilds = [] } = useQuery({
        queryKey: ['all-builds'],
        queryFn: async () => {
            if (!user?.email) return [];
            return await base44.entities.BuildHistory.filter({ created_by: user.email }, '-created_date', 100);
        },
        enabled: !!user?.email
    });

    const createProjectMutation = useMutation({
        mutationFn: async (projectData) => {
            const { selected_builds, ...projectPayload } = projectData;
            const project = await base44.entities.Project.create(projectPayload);
            
            // Associar builds selecionados ao projeto
            if (projectData.selected_builds && projectData.selected_builds.length > 0) {
                for (const buildId of projectData.selected_builds) {
                    await base44.entities.BuildHistory.update(buildId, {
                        project_id: project.id
                    });
                }
            }
            
            return project;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
            queryClient.invalidateQueries(['all-builds']);
            setIsCreateDialogOpen(false);
            setNewProject({ name: '', description: '', selected_builds: [] });
        }
    });

    const updateProjectMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            return await base44.entities.Project.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
            setIsEditDialogOpen(false);
            setEditingProject(null);
        }
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (projectId) => {
            await base44.entities.Project.delete(projectId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
        }
    });

    const handleCreateProject = () => {
        if (!newProject.name.trim()) {
            alert('Por favor, insira um nome para o projeto');
            return;
        }
        createProjectMutation.mutate(newProject);
    };

    const handleEditProject = (project) => {
        setEditingProject({ ...project });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editingProject.name.trim()) {
            alert('Por favor, insira um nome para o projeto');
            return;
        }
        updateProjectMutation.mutate({ id: editingProject.id, data: editingProject });
    };

    const handleOpenAssociateBuilds = (project) => {
        setSelectedProjectForBuilds(project);
        setSelectedBuildsToAssociate([]);
        setSearchQuery('');
        setIsAssociateBuildsOpen(true);
    };

    const handleSelectAll = () => {
        const availableBuilds = allBuilds.filter(b => !b.project_id);
        const filteredBuilds = availableBuilds.filter(build => {
            const searchLower = searchQuery.toLowerCase();
            const matchesName = build.project_name.toLowerCase().includes(searchLower);
            const matchesDate = new Date(build.created_date).toLocaleString().toLowerCase().includes(searchLower);
            return matchesName || matchesDate;
        });
        setSelectedBuildsToAssociate(filteredBuilds.map(b => b.id));
    };

    const handleDeselectAll = () => {
        setSelectedBuildsToAssociate([]);
    };

    const handleAssociateBuilds = async () => {
        if (selectedBuildsToAssociate.length === 0) {
            alert('Selecione pelo menos um build para associar');
            return;
        }

        try {
            for (const buildId of selectedBuildsToAssociate) {
                await base44.entities.BuildHistory.update(buildId, {
                    project_id: selectedProjectForBuilds.id
                });
            }
            queryClient.invalidateQueries(['all-builds']);
            queryClient.invalidateQueries(['project-builds', selectedProjectForBuilds.id]);
            setIsAssociateBuildsOpen(false);
            setSelectedProjectForBuilds(null);
            setSelectedBuildsToAssociate([]);
            alert('Builds associados com sucesso!');
        } catch (error) {
            alert('Erro ao associar builds: ' + error.message);
        }
    };

    const handleDeleteProject = async (projectId, projectName) => {
        if (confirm(`Tem certeza que deseja excluir o projeto "${projectName}"? Esta ação não pode ser desfeita.`)) {
            deleteProjectMutation.mutate(projectId);
        }
    };

    // Filtrar projetos por nome
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
    );

    // Buscar último build de cada projeto
    const getLastBuild = (projectId) => {
        return allBuilds
            .filter(b => b.project_id === projectId)
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando projetos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <FolderOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    Meus Projetos
                                </h1>
                                <p className="text-sm text-gray-500">Gerencie seus projetos React to HTML</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to={createPageUrl('Compiler')}>
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Button>
                            </Link>
                            <UserMenu user={user} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Actions */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between">
                    <ProjectSearchFilter
                        searchTerm={projectSearchTerm}
                        onSearchChange={setProjectSearchTerm}
                    />
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Projeto
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Novo Projeto</DialogTitle>
                                <DialogDescription>
                                    Crie um novo projeto para organizar suas compilações
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="name">Nome do Projeto *</Label>
                                    <Input
                                        id="name"
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        placeholder="Meu Projeto Incrível"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea
                                        id="description"
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        placeholder="Descrição do projeto..."
                                        rows={3}
                                    />
                                </div>
                                {allBuilds.filter(b => !b.project_id).length > 0 && (
                                    <div>
                                        <Label>Associar builds existentes (opcional)</Label>
                                        <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2 mt-2">
                                            {allBuilds.filter(b => !b.project_id).map((build) => (
                                                <div key={build.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`build-${build.id}`}
                                                        checked={newProject.selected_builds?.includes(build.id)}
                                                        onCheckedChange={(checked) => {
                                                            const builds = newProject.selected_builds || [];
                                                            if (checked) {
                                                                setNewProject({
                                                                    ...newProject,
                                                                    selected_builds: [...builds, build.id]
                                                                });
                                                            } else {
                                                                setNewProject({
                                                                    ...newProject,
                                                                    selected_builds: builds.filter(id => id !== build.id)
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`build-${build.id}`}
                                                        className="text-sm cursor-pointer"
                                                    >
                                                        {build.project_name} - {new Date(build.created_date).toLocaleDateString()}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleCreateProject}
                                    disabled={createProjectMutation.isPending}
                                >
                                    {createProjectMutation.isPending ? 'Criando...' : 'Criar Projeto'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Project Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Editar Projeto</DialogTitle>
                                <DialogDescription>
                                    Atualize as informações do projeto
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="edit-name">Nome do Projeto *</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingProject?.name || ''}
                                        onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                                        placeholder="Meu Projeto Incrível"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-description">Descrição</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={editingProject?.description || ''}
                                        onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                                        placeholder="Descrição do projeto..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleSaveEdit}
                                    disabled={updateProjectMutation.isPending}
                                >
                                    {updateProjectMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Collaborators Dialog */}
                    <Dialog open={!!collaboratingProject} onOpenChange={(open) => !open && setCollaboratingProject(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-violet-500" />
                                    Gerenciar Equipe — {collaboratingProject?.name}
                                </DialogTitle>
                                <DialogDescription>
                                    Convide colaboradores e defina permissões de acesso para este projeto
                                </DialogDescription>
                            </DialogHeader>
                            {collaboratingProject && (
                                <CollaboratorsPanel project={collaboratingProject} currentUser={user} />
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Associate Builds Dialog */}
                    <Dialog open={isAssociateBuildsOpen} onOpenChange={setIsAssociateBuildsOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Associar Builds Existentes</DialogTitle>
                                <DialogDescription>
                                    Selecione builds para associar ao projeto "{selectedProjectForBuilds?.name}"
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {allBuilds.filter(b => !b.project_id).length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Nenhum build disponível para associar
                                    </div>
                                ) : (
                                    <>
                                        {/* Barra de pesquisa e botões */}
                                        <div className="space-y-3">
                                            <Input
                                                placeholder="Pesquisar por nome, data ou hora..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleSelectAll}
                                                    className="flex-1"
                                                >
                                                    Selecionar Todos
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleDeselectAll}
                                                    className="flex-1"
                                                >
                                                    Desmarcar Todos
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Lista de builds */}
                                        <div className="max-h-96 overflow-y-auto border rounded-md p-3 space-y-2">
                                            {allBuilds
                                                .filter(b => !b.project_id)
                                                .filter(build => {
                                                    const searchLower = searchQuery.toLowerCase();
                                                    const matchesName = build.project_name.toLowerCase().includes(searchLower);
                                                    const matchesDate = new Date(build.created_date).toLocaleString().toLowerCase().includes(searchLower);
                                                    return matchesName || matchesDate;
                                                })
                                                .map((build) => (
                                            <div key={build.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                                <Checkbox
                                                    id={`associate-${build.id}`}
                                                    checked={selectedBuildsToAssociate.includes(build.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedBuildsToAssociate([...selectedBuildsToAssociate, build.id]);
                                                        } else {
                                                            setSelectedBuildsToAssociate(selectedBuildsToAssociate.filter(id => id !== build.id));
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`associate-${build.id}`}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">{build.project_name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(build.created_date).toLocaleDateString()} às {new Date(build.created_date).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            build.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            build.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {build.status}
                                                        </span>
                                                    </div>
                                                </label>
                                            </div>
                                        ))}
                                            {allBuilds
                                                .filter(b => !b.project_id)
                                                .filter(build => {
                                                    const searchLower = searchQuery.toLowerCase();
                                                    const matchesName = build.project_name.toLowerCase().includes(searchLower);
                                                    const matchesDate = new Date(build.created_date).toLocaleString().toLowerCase().includes(searchLower);
                                                    return matchesName || matchesDate;
                                                }).length === 0 && searchQuery && (
                                                <div className="text-center py-8 text-gray-500">
                                                    Nenhum build encontrado
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsAssociateBuildsOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleAssociateBuilds}
                                    disabled={selectedBuildsToAssociate.length === 0}
                                >
                                    Associar {selectedBuildsToAssociate.length > 0 ? `(${selectedBuildsToAssociate.length})` : ''}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={activeTab === 'mine' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('mine')}
                        className={activeTab === 'mine' ? 'bg-gradient-to-r from-violet-500 to-purple-600' : ''}
                    >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Meus Projetos ({projects.length})
                    </Button>
                    <Button
                        variant={activeTab === 'shared' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('shared')}
                        className={activeTab === 'shared' ? 'bg-gradient-to-r from-violet-500 to-purple-600' : ''}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Compartilhados comigo ({sharedProjects.length})
                    </Button>
                </div>

                {/* Projects Grid */}
                {activeTab === 'shared' ? (
                    sharedProjects.length === 0 ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum projeto compartilhado</h3>
                            <p className="text-gray-500">Quando alguém compartilhar um projeto com você, ele aparecerá aqui.</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sharedProjects.filter(p => p.name.toLowerCase().includes(projectSearchTerm.toLowerCase())).map((project, index) => {
                                const collab = myCollaborations.find(c => c.project_id === project.id);
                                return (
                                    <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                                        <ProjectDetailsCard
                                            project={project}
                                            lastBuild={getLastBuild(project.id)}
                                            onViewDetails={() => window.location.href = createPageUrl(`ProjectDetails?id=${project.id}`)}
                                            isShared={true}
                                            collaboratorPermission={collab?.permission}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>
                    )
                ) : filteredProjects.length === 0 ? (
                    projectSearchTerm ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16"
                        >
                            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Nenhum projeto encontrado
                            </h3>
                            <p className="text-gray-500">
                                Tente ajustar sua busca
                            </p>
                        </motion.div>
                    ) : projects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum projeto ainda</h3>
                        <p className="text-gray-500 mb-6">Crie seu primeiro projeto para começar</p>
                        <Button 
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-gradient-to-r from-violet-500 to-purple-600"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Primeiro Projeto
                        </Button>
                    </motion.div>
                ) : null
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ProjectDetailsCard
                                    project={project}
                                    lastBuild={getLastBuild(project.id)}
                                    onEdit={() => handleEditProject(project)}
                                    onDelete={() => handleDeleteProject(project.id, project.name)}
                                    onAssociateBuilds={() => handleOpenAssociateBuilds(project)}
                                    onViewDetails={() => window.location.href = createPageUrl(`ProjectDetails?id=${project.id}`)}
                                    onManageTeam={() => setCollaboratingProject(project)}
                                />
                                <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-violet-200 hidden">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                                                {project.description && (
                                                    <CardDescription className="mt-2 line-clamp-2">
                                                        {project.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Settings className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem 
                                                        className="cursor-pointer"
                                                        onClick={() => handleEditProject(project)}
                                                    >
                                                        <Settings className="w-4 h-4 mr-2" />
                                                        Editar Projeto
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="cursor-pointer"
                                                        asChild
                                                    >
                                                        <Link to={createPageUrl(`ProjectDetails?id=${project.id}&tab=ftp`)}>
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            Configurar FTP
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="cursor-pointer"
                                                        onClick={() => handleOpenAssociateBuilds(project)}
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Associar Builds
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600 cursor-pointer"
                                                        onClick={() => handleDeleteProject(project.id, project.name)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {project.selected_ai_tool && (
                                                <div className="text-sm">
                                                    <span className="text-gray-500">AI: </span>
                                                    <span className="font-medium">{project.selected_ai_tool}</span>
                                                </div>
                                            )}
                                            {project.last_deploy_date && (
                                                <div className="text-sm text-gray-500">
                                                    Último deploy: {new Date(project.last_deploy_date).toLocaleDateString()}
                                                </div>
                                            )}
                                            <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
                                                <Button className="w-full" variant="outline">
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Ver Detalhes
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}