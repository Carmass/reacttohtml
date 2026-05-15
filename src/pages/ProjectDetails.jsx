import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, Server, History, Download, RefreshCw, Rocket, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import UserMenu from '../components/common/UserMenu';
import FtpConnectionTest from '../components/projects/FtpConnectionTest';
import DeploymentLogsViewer from '../components/deployments/DeploymentLogsViewer';
import DeploymentNotification from '../components/deployments/DeploymentNotification';

const AI_TOOLS = [
    "GPT (OpenAI)",
    "Google AI Studio",
    "Claude (claude.ai)",
    "Lovable (lovable.dev)",
    "Bolt.new (stackblitz.com)",
    "Replit Agent (replit.com)",
    "Marblism (marblism.com)",
    "DhiWise (dhiwise.com)",
    "Softgen (softgen.ai)",
    "Emergent (emergent.ai)",
    "GPT-Engineer (gptengineer.app)",
    "Pythagora (pythagora.ai)",
    "Create.xyz (create.xyz)",
    "v0 (v0.dev)",
    "Tempo (tempo.labs)",
    "Locofy.ai (locofy.ai)",
    "Anima (animaapp.com)",
    "Kombai (kombai.com)",
    "TeleportHQ (teleporthq.io)",
    "Plasmic (plasmic.app)",
    "Relume (relume.io)",
    "Quest AI (quest.ai)",
    "Bifrost (bifrost.so)",
    "Dualite (dualite.ai)",
    "Uizard (uizard.io)",
    "Cursor (cursor.com)",
    "Windsurf (codeium.com/windsurf)",
    "Builder.io (builder.io)",
    "Reweb (reweb.so)"
];

const HOSTING_PROVIDERS = [
    "Hostgator",
    "Hostinger",
    "GoDaddy",
    "Bluehost",
    "SiteGround",
    "DreamHost",
    "HostDime",
    "A2 Hosting",
    "InMotion Hosting",
    "Locaweb",
    "UOL Host",
    "KingHost",
    "Outro"
];

export default function ProjectDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const defaultTab = urlParams.get('tab') || 'settings';
    const queryClient = useQueryClient();

    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isEditingFtp, setIsEditingFtp] = useState(false);
    const [editedProject, setEditedProject] = useState(null);
    const [ftpPassword, setFtpPassword] = useState('');
    const [deployingBuildId, setDeployingBuildId] = useState(null);
    const [selectedDeployment, setSelectedDeployment] = useState(null);
    const [notificationDeployment, setNotificationDeployment] = useState(null);
    const [deploymentsPage, setDeploymentsPage] = useState(1);
    const deploymentsPerPage = 10;

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    // Check if user has FTP/Deploy access (Pro, Business, owner, admin)
    const hasFtpAccess = user && (
        user.is_owner ||
        user.role === 'admin' ||
        user.current_plan === 'Pro' ||
        user.current_plan === 'Business'
    );

    const { data: project, isLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            return await base44.entities.Project.get(projectId);
        },
        enabled: !!projectId
    });

    const { data: builds = [] } = useQuery({
        queryKey: ['project-builds', projectId],
        queryFn: async () => {
            return await base44.entities.BuildHistory.filter(
                { project_id: projectId },
                '-created_date',
                50
            );
        },
        enabled: !!projectId,
        refetchInterval: 5000
    });

    const { data: deploymentsData } = useQuery({
        queryKey: ['project-deployments', projectId, deploymentsPage],
        queryFn: async () => {
            const skip = (deploymentsPage - 1) * deploymentsPerPage;
            const items = await base44.entities.Deployment.filter(
                { project_id: projectId },
                '-created_date',
                deploymentsPerPage + 1,
                skip
            );
            return {
                items: items.slice(0, deploymentsPerPage),
                hasMore: items.length > deploymentsPerPage
            };
        },
        enabled: !!projectId,
        refetchInterval: 4000,
        select: (data) => {
            // Normalizar status: 'success' → 'success', 'completed' → 'success'
            return {
                ...data,
                items: data.items.map(d => ({
                    ...d,
                    status: d.status === 'completed' ? 'success' : d.status
                }))
            };
        }
    });

    const deployments = deploymentsData?.items || [];
    const hasMoreDeployments = deploymentsData?.hasMore || false;

    // Notificação quando o deploy mais recente muda de status
    const latestDeployment = deployments[0];
    React.useEffect(() => {
        if (latestDeployment && ['success', 'failed'].includes(latestDeployment.status)) {
            setNotificationDeployment(latestDeployment);
        }
    }, [latestDeployment?.status, latestDeployment?.id]);

    const updateProjectMutation = useMutation({
        mutationFn: async (data) => {
            return await base44.entities.Project.update(projectId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['project', projectId]);
            setIsEditingInfo(false);
            setIsEditingFtp(false);
            setFtpPassword('');
            alert('Projeto atualizado com sucesso!');
        }
    });

    const deployMutation = useMutation({
        mutationFn: async (buildId) => {
            return base44.functions.invoke('deployToFTP', {
                project_id: projectId,
                build_id: buildId
            });
        },
        onSuccess: (response) => {
            setDeployingBuildId(null);
            queryClient.invalidateQueries(['project-deployments', projectId]);
            
            const message = response.data?.message || 'Deploy iniciado!';
            alert(`✓ ${message}\n\nO deploy está sendo processado em segundo plano. Acompanhe o status na aba Deployments.`);
        },
        onError: (error) => {
            setDeployingBuildId(null);
            const errorMsg = error.response?.data?.error || error.message;
            alert(`❌ Erro ao iniciar deploy:\n\n${errorMsg}`);
        }
    });

    const handleSaveInfo = () => {
        const { name, description, selected_ai_tool } = editedProject;
        updateProjectMutation.mutate({ name, description, selected_ai_tool });
    };

    const handleSaveFtp = () => {
        const data = {
            ftp_host: editedProject?.ftp_host,
            ftp_port: editedProject?.ftp_port,
            ftp_username: editedProject?.ftp_username,
            ftp_remote_path: editedProject?.ftp_remote_path,
            auto_deploy: editedProject?.auto_deploy,
            hosting_provider: editedProject?.hosting_provider,
            deploy_protocol: editedProject?.deploy_protocol || 'sftp'
        };
        
        // Salvar senha apenas se foi digitada
        if (ftpPassword) {
            data.ftp_password = ftpPassword;
        }
        
        updateProjectMutation.mutate(data);
    };

    const handleDeploy = (buildId) => {
        if (!project.ftp_host || !project.ftp_username) {
            alert('Configure as credenciais FTP antes de fazer deploy!');
            return;
        }
        if (confirm('Deseja fazer deploy deste build?')) {
            setDeployingBuildId(buildId);
            deployMutation.mutate(buildId);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando projeto...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Projeto não encontrado</p>
                    <Link to={createPageUrl('Projects')}>
                        <Button className="mt-4">Voltar aos Projetos</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            <DeploymentNotification 
                deployment={notificationDeployment}
                onClose={() => setNotificationDeployment(null)}
            />

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link to={createPageUrl('Projects')}>
                                <Button variant="outline" size="icon">
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
                                {project.description && (
                                    <p className="text-sm text-gray-500">{project.description}</p>
                                )}
                                </div>
                                </div>
                                <div className="flex items-center gap-3">
                                <Link to={createPageUrl(`Compiler?project=${projectId}`)}>
                                <Button className="bg-gradient-to-r from-violet-500 to-purple-600">
                                   <Upload className="w-4 h-4 mr-2" />
                                   Nova Compilação
                                </Button>
                                </Link>
                                <UserMenu user={user} />
                                </div>
                                </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <Tabs defaultValue={defaultTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="settings">Informações</TabsTrigger>
                        <TabsTrigger value="ftp" disabled={!hasFtpAccess} className={!hasFtpAccess ? 'opacity-40 cursor-not-allowed' : ''}>
                            Configuração FTP {!hasFtpAccess && '🔒'}
                        </TabsTrigger>
                        <TabsTrigger value="builds">Builds ({builds.length})</TabsTrigger>
                        <TabsTrigger value="deployments" disabled={!hasFtpAccess} className={!hasFtpAccess ? 'opacity-40 cursor-not-allowed' : ''}>
                            Deployments ({deploymentsData?.items?.length ?? 0}{hasMoreDeployments ? '+' : ''}) {!hasFtpAccess && '🔒'}
                        </TabsTrigger>
                    </TabsList>

                    {!hasFtpAccess && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="font-semibold text-amber-800">Configuração FTP e Deploy disponível no plano Pro ou Business</p>
                                <p className="text-sm text-amber-700">Faça upgrade para acessar deploy automático via FTP/SFTP e integração com GitHub Pages.</p>
                                <a href="/PlanManagement" className="text-sm text-violet-600 hover:underline font-semibold mt-1 inline-block">Ver planos →</a>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    <TabsContent value="settings">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Project Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações do Projeto</CardTitle>
                                    <CardDescription>Configure as informações básicas</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Nome do Projeto</Label>
                                        <Input
                                            value={isEditingInfo ? editedProject?.name : project.name}
                                            onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                                            disabled={!isEditingInfo}
                                        />
                                    </div>
                                    <div>
                                        <Label>Descrição</Label>
                                        <Textarea
                                            value={isEditingInfo ? editedProject?.description || '' : project.description || ''}
                                            onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                                            disabled={!isEditingInfo}
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <Label>Ferramenta de AI</Label>
                                        <Select
                                            value={isEditingInfo ? editedProject?.selected_ai_tool : project.selected_ai_tool}
                                            onValueChange={(value) => setEditedProject({ ...editedProject, selected_ai_tool: value })}
                                            disabled={!isEditingInfo}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a AI usada" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {AI_TOOLS.map((tool) => (
                                                    <SelectItem key={tool} value={tool}>
                                                        {tool}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {!isEditingInfo ? (
                                        <Button onClick={() => {
                                            setIsEditingInfo(true);
                                            setEditedProject({ ...project });
                                        }} className="w-full">
                                            Editar
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button onClick={() => setIsEditingInfo(false)} variant="outline" className="flex-1">
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleSaveInfo} className="flex-1" disabled={updateProjectMutation.isPending}>
                                                {updateProjectMutation.isPending ? 'Salvando...' : 'Salvar'}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* FTP Configuration Tab */}
                    <TabsContent value="ftp">
                        <div className="grid grid-cols-1 gap-6">

                            {/* FTP Connection Test */}
                            <FtpConnectionTest project={project} />

                            {/* FTP Config */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Server className="w-5 h-5" />
                                                Configuração {project.deploy_protocol === 'ftp' ? 'FTP' : 'SFTP'}
                                            </CardTitle>
                                            <CardDescription>Configure o servidor {project.deploy_protocol === 'ftp' ? 'FTP' : 'SFTP'} para deploy automático (SFTP recomendado)</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Instruções FTP */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                            <Server className="w-4 h-4" />
                                            Como obter credenciais FTP
                                        </h4>
                                        <div className="text-sm text-blue-800 space-y-2">
                                            <p><strong>1. Acesse o painel da sua hospedagem</strong></p>
                                            <p className="ml-4">Entre no painel de controle do seu provedor (cPanel, Plesk, etc.)</p>
                                            
                                            <p><strong>2. Localize as credenciais SFTP/FTP</strong></p>
                                            <ul className="ml-4 list-disc list-inside space-y-1">
                                                <li><strong>Host:</strong> Geralmente ftp.seudominio.com ou IP do servidor</li>
                                                <li><strong>Usuário:</strong> Seu usuário (pode ser o email ou username)</li>
                                                <li><strong>Senha:</strong> Senha SSH/FTP (pode criar ou redefinir no painel)</li>
                                                <li><strong>Porta:</strong> 22 para SFTP (recomendado) ou 21 para FTP</li>
                                                <li><strong>Caminho:</strong> /public_html ou /www ou /httpdocs</li>
                                            </ul>
                                            
                                            <p className="mt-3 font-semibold text-green-700">💡 Use SFTP sempre que possível - é mais seguro e confiável!</p>

                                            <p className="mt-3"><strong>Provedores populares:</strong></p>
                                            <ul className="ml-4 list-disc list-inside">
                                                <li><strong>Hostinger:</strong> Painel → Arquivos → Contas FTP</li>
                                                <li><strong>Hostgator:</strong> cPanel → Contas FTP</li>
                                                <li><strong>GoDaddy:</strong> Produtos → Web Hosting → Gerenciar → FTP</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Formulário FTP */}
                                    <div>
                                        <Label>Provedor de Hospedagem</Label>
                                        <Select
                                            value={isEditingFtp ? editedProject?.hosting_provider : project.hosting_provider}
                                            onValueChange={(value) => setEditedProject({ ...editedProject, hosting_provider: value })}
                                            disabled={!isEditingFtp}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o provedor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {HOSTING_PROVIDERS.map((provider) => (
                                                    <SelectItem key={provider} value={provider}>
                                                        {provider}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div>
                                        <Label>Protocolo de Deploy</Label>
                                        <Select
                                            value={isEditingFtp ? (editedProject?.deploy_protocol || 'sftp') : (project.deploy_protocol || 'sftp')}
                                            onValueChange={(value) => {
                                                const newPort = value === 'sftp' ? 22 : 21;
                                                setEditedProject({ 
                                                    ...editedProject, 
                                                    deploy_protocol: value,
                                                    ftp_port: newPort
                                                });
                                            }}
                                            disabled={!isEditingFtp}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o protocolo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sftp">SFTP (Recomendado - mais seguro)</SelectItem>
                                                <SelectItem value="ftp">FTP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(isEditingFtp ? editedProject?.deploy_protocol : project.deploy_protocol) === 'sftp' 
                                                ? '✓ SFTP é mais seguro e confiável (porta 22)'
                                                : 'FTP padrão (porta 21)'}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <Label>Host {(isEditingFtp ? editedProject?.deploy_protocol : project.deploy_protocol) === 'sftp' ? 'SFTP' : 'FTP'}</Label>
                                        <Input
                                            value={isEditingFtp ? editedProject?.ftp_host || '' : project.ftp_host || ''}
                                            onChange={(e) => setEditedProject({ ...editedProject, ftp_host: e.target.value })}
                                            disabled={!isEditingFtp}
                                            placeholder="ftp.seusite.com"
                                        />
                                    </div>
                                    <div>
                                        <Label>Porta</Label>
                                        <Input
                                            type="number"
                                            value={isEditingFtp ? (editedProject?.ftp_port || ((editedProject?.deploy_protocol || 'sftp') === 'sftp' ? 22 : 21)) : (project.ftp_port || 21)}
                                            onChange={(e) => setEditedProject({ ...editedProject, ftp_port: parseInt(e.target.value) })}
                                            disabled={!isEditingFtp}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Padrão: SFTP = 22, FTP = 21
                                        </p>
                                    </div>
                                    <div>
                                        <Label>Usuário</Label>
                                        <Input
                                            value={isEditingFtp ? editedProject?.ftp_username || '' : project.ftp_username || ''}
                                            onChange={(e) => setEditedProject({ ...editedProject, ftp_username: e.target.value })}
                                            disabled={!isEditingFtp}
                                            placeholder="usuario@seusite.com"
                                        />
                                    </div>
                                    {isEditingFtp && (
                                        <div>
                                            <Label>Senha {(editedProject?.deploy_protocol || 'sftp') === 'sftp' ? 'SFTP/SSH' : 'FTP'} (deixe vazio para manter a atual)</Label>
                                            <Input
                                                type="password"
                                                value={ftpPassword}
                                                onChange={(e) => setFtpPassword(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <Label>Caminho Remoto</Label>
                                        <Input
                                            value={isEditingFtp ? editedProject?.ftp_remote_path || '' : project.ftp_remote_path || ''}
                                            onChange={(e) => setEditedProject({ ...editedProject, ftp_remote_path: e.target.value })}
                                            disabled={!isEditingFtp}
                                            placeholder="/public_html"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Deploy Automático após Build</Label>
                                        <Switch
                                            checked={isEditingFtp ? editedProject?.auto_deploy : project.auto_deploy}
                                            onCheckedChange={(checked) => setEditedProject({ ...editedProject, auto_deploy: checked })}
                                            disabled={!isEditingFtp}
                                        />
                                    </div>
                                    {!isEditingFtp ? (
                                        <Button onClick={() => {
                                            setIsEditingFtp(true);
                                            setEditedProject({ ...project });
                                        }} className="w-full">
                                            Editar
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button onClick={() => {
                                                setIsEditingFtp(false);
                                                setFtpPassword('');
                                            }} variant="outline" className="flex-1">
                                                Cancelar
                                            </Button>
                                            <Button onClick={handleSaveFtp} className="flex-1" disabled={updateProjectMutation.isPending}>
                                                {updateProjectMutation.isPending ? 'Salvando...' : 'Salvar'}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Builds Tab */}
                    <TabsContent value="builds">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5" />
                                    Histórico de Builds
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {builds.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Nenhum build ainda
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {builds.map((build) => (
                                            <div key={build.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                                <div>
                                                    <p className="font-medium">{build.project_name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(build.created_date).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        build.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        build.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {build.status}
                                                    </span>
                                                    {build.status === 'completed' && build.compiled_file_url && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => window.open(build.compiled_file_url, '_blank')}
                                                                className="gap-1"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Baixar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleDeploy(build.id)}
                                                                disabled={deployingBuildId !== null}
                                                                className="gap-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                                                            >
                                                                <Rocket className="w-4 h-4" />
                                                                {deployingBuildId === build.id ? 'Deployando...' : 'Deploy'}
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Deployments Tab */}
                    <TabsContent value="deployments">
                        <div className="space-y-6">
                            {selectedDeployment ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedDeployment(null)}
                                        className="gap-2"
                                    >
                                        ← Voltar
                                    </Button>
                                    <DeploymentLogsViewer deployment={selectedDeployment} />
                                </>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Rocket className="w-5 h-5" />
                                            Histórico de Deployments
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {deployments.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                Nenhum deployment ainda
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-3">
                                                    {deployments.map((deployment) => (
                                                        <button
                                                            key={deployment.id}
                                                            onClick={() => setSelectedDeployment(deployment)}
                                                            className="w-full text-left flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                                                        >
                                                            <div className="flex-1">
                                                               <p className="font-medium">{project.ftp_host || deployment.ftp_host || 'Deploy FTP'}</p>
                                                               <p className="text-sm text-gray-500">
                                                                   {new Date(deployment.created_date).toLocaleString()}
                                                               </p>
                                                               {deployment.commit_message && (
                                                                   <p className="text-xs text-gray-400">{deployment.commit_message}</p>
                                                               )}
                                                               {deployment.error_message && deployment.status === 'failed' && (
                                                                   <p className="text-xs text-red-500 mt-1 break-words">{deployment.error_message}</p>
                                                               )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                    (deployment.status === 'success' || deployment.status === 'completed') ? 'bg-green-100 text-green-700' :
                                                                    deployment.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                                    deployment.status === 'pushing' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                    {deployment.status === 'success' || deployment.status === 'completed' ? '✅ enviado' :
                                                                     deployment.status === 'failed' ? '❌ falhou' :
                                                                     deployment.status === 'pushing' ? '🚀 enviando...' :
                                                                     deployment.status}
                                                                </span>

                                                                {(deployment.repository_url || deployment.deployment_url) && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            window.open(deployment.repository_url || deployment.deployment_url, '_blank');
                                                                        }}
                                                                    >
                                                                        Visitar
                                                                    </Button>
                                                                )}
                                                                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeploymentsPage(p => Math.max(1, p - 1))}
                                                        disabled={deploymentsPage === 1}
                                                    >
                                                        ← Anterior
                                                    </Button>
                                                    <span className="text-sm text-gray-600">
                                                        Página {deploymentsPage}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeploymentsPage(p => p + 1)}
                                                        disabled={!hasMoreDeployments}
                                                    >
                                                        Próxima →
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}