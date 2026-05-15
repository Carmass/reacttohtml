import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Download, RefreshCw, Trash2, X, CheckCircle, XCircle, Clock,
    Calendar, User, Cpu, FileText, AlertCircle, Zap, BarChart3, FolderOpen,
    Gift, Crown, HelpCircle, Menu, ChevronLeft, ChevronRight, RotateCcw, Rocket
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import UserMenu from '../components/common/UserMenu';
import AIToolFilter from '../components/compiler/AIToolFilter';

const STATUS_CONFIG = {
    completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
    failed: { label: 'Falhou', color: 'bg-red-100 text-red-700', icon: XCircle, iconColor: 'text-red-500' },
    processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Clock, iconColor: 'text-blue-500' },
    queued: { label: 'Na Fila', color: 'bg-yellow-100 text-yellow-700', icon: Clock, iconColor: 'text-yellow-500' },
};

export default function BuildDetails() {
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(window.location.search);
    const buildId = urlParams.get('id');

    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [selectedAITool, setSelectedAITool] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const queryClient = useQueryClient();

    useEffect(() => {
        const checkAuth = async () => {
            const isAuthenticated = await base44.auth.isAuthenticated();
            if (!isAuthenticated) {
                base44.auth.redirectToLogin(createPageUrl('Compiler'));
            } else {
                setIsAuthChecking(false);
            }
        };
        checkAuth();
    }, []);

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me(),
        enabled: !isAuthChecking,
    });

    // Single build view
    const { data: build, refetch: refetchBuild } = useQuery({
        queryKey: ['build', buildId],
        queryFn: () => base44.entities.BuildHistory.get(buildId),
        enabled: !!buildId && !isAuthChecking,
        refetchInterval: (data) => data?.status === 'processing' ? 5000 : false,
    });

    // All builds list view (when no id)
    const { data: buildsData = { items: [], total: 0 }, refetch: refetchBuilds } = useQuery({
        queryKey: ['all-builds', currentPage, itemsPerPage, user?.email, selectedAITool, statusFilter, sortBy],
        queryFn: async () => {
            if (!user?.email) return { items: [], total: 0 };
            const skip = (currentPage - 1) * itemsPerPage;
            let allBuilds = await base44.entities.BuildHistory.filter(
                { created_by: user.email },
                '-created_date',
                1000
            );
            if (selectedAITool && selectedAITool !== 'all') {
                allBuilds = allBuilds.filter(b => b.ai_tool === selectedAITool);
            }
            if (statusFilter !== 'all') {
                allBuilds = allBuilds.filter(b => b.status === statusFilter);
            }
            allBuilds.sort((a, b) => {
                if (sortBy === 'date-desc') return new Date(b.created_date) - new Date(a.created_date);
                if (sortBy === 'date-asc') return new Date(a.created_date) - new Date(b.created_date);
                if (sortBy === 'name') return a.project_name.localeCompare(b.project_name);
                return 0;
            });
            const items = allBuilds.slice(skip, skip + itemsPerPage);
            return { items, total: allBuilds.length };
        },
        enabled: !buildId && !isAuthChecking && !!user?.email,
        refetchInterval: 8000,
    });

    const handleDownload = async (fileUrl, projectName) => {
        try {
            const urlParts = fileUrl.split('/');
            const suggestedFileName = decodeURIComponent(urlParts[urlParts.length - 1]) || `${projectName}.zip`;
            const response = await base44.functions.invoke('downloadCompiledFile', {
                fileUrl,
                fileName: suggestedFileName
            });
            const blob = new Blob([response.data], { type: 'application/zip' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = suggestedFileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Erro ao baixar:', error);
            window.open(fileUrl, '_blank');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Deseja realmente excluir este build?')) {
            await base44.entities.BuildHistory.delete(id);
            if (buildId) navigate(createPageUrl('BuildDetails'));
            else queryClient.invalidateQueries(['all-builds']);
        }
    };

    const handleCancel = async (b) => {
        if (confirm('Deseja realmente cancelar este build?')) {
            await base44.entities.BuildHistory.update(b.id, {
                status: 'failed',
                error_message: 'Compilação cancelada pelo usuário'
            });
            base44.functions.invoke('sendBuildNotification', { build_id: b.id }).catch(() => {});
            if (buildId) refetchBuild();
            else queryClient.invalidateQueries(['all-builds']);
        }
    };

    const handleRecompile = (b) => {
        navigate(createPageUrl('Compiler') + `?recompile=${b.id}`);
    };

    const handleDeploy = (b) => {
        navigate(createPageUrl('Projects') + `?deploy_build=${b.id}`);
    };

    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const renderHeader = () => (
        <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                {buildId ? 'Detalhes da Compilação' : 'Histórico de Compilações'}
                            </h1>
                            <p className="text-sm text-gray-500">React to HTML Compiler</p>
                        </div>
                    </div>
                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link to={createPageUrl('Compiler')}>
                            <Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Compilar</Button>
                        </Link>
                        <Link to={createPageUrl('Dashboard')}>
                            <Button variant="outline" className="gap-2"><BarChart3 className="w-4 h-4" />Dashboard</Button>
                        </Link>
                        <Link to={createPageUrl('Projects')}>
                            <Button variant="outline" className="gap-2"><FolderOpen className="w-4 h-4" />Projetos</Button>
                        </Link>
                        <Link to={createPageUrl('Referrals')}>
                            <Button variant="outline" className="gap-2"><Gift className="w-4 h-4" />Indicações</Button>
                        </Link>
                        <Link to={createPageUrl('PlanManagement')}>
                            <Button variant="outline" className="gap-2"><Crown className="w-4 h-4" />Planos</Button>
                        </Link>
                        <Link to={createPageUrl('Support')}>
                            <Button variant="outline" className="gap-2"><HelpCircle className="w-4 h-4" />Suporte</Button>
                        </Link>
                        <UserMenu user={user} />
                    </div>
                    {/* Mobile */}
                    <div className="lg:hidden flex items-center gap-2">
                        <UserMenu user={user} />
                        <Button variant="outline" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                {/* Mobile Menu */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="lg:hidden border-t border-gray-200 mt-4 pt-4 pb-2 space-y-2"
                        >
                            {[
                                { to: 'Compiler', icon: ArrowLeft, label: 'Compilar' },
                                { to: 'Dashboard', icon: BarChart3, label: 'Dashboard' },
                                { to: 'Projects', icon: FolderOpen, label: 'Projetos' },
                                { to: 'Referrals', icon: Gift, label: 'Indicações' },
                                { to: 'PlanManagement', icon: Crown, label: 'Planos' },
                                { to: 'Support', icon: HelpCircle, label: 'Suporte' },
                            ].map(({ to, icon: Icon, label }) => (
                                <Link key={to} to={createPageUrl(to)} onClick={() => setMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-violet-50">
                                        <Icon className="w-4 h-4" />{label}
                                    </Button>
                                </Link>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    // Single build detail view
    if (buildId) {
        if (!build) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
                    {renderHeader()}
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            );
        }

        const cfg = STATUS_CONFIG[build.status] || STATUS_CONFIG.queued;
        const Icon = cfg.icon;

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
                {renderHeader()}
                <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                    {/* Back */}
                    <Link to={createPageUrl('BuildDetails')}>
                        <Button variant="ghost" className="gap-2 text-violet-600">
                            <ArrowLeft className="w-4 h-4" />Voltar ao Histórico
                        </Button>
                    </Link>

                    {/* Status Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center",
                                    build.status === 'completed' ? 'bg-green-100' :
                                    build.status === 'failed' ? 'bg-red-100' : 'bg-blue-100')}>
                                    <Icon className={cn("w-8 h-8", cfg.iconColor,
                                        build.status === 'processing' ? 'animate-spin' : '')} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{build.project_name}</h2>
                                    <span className={cn("px-3 py-1 rounded-full text-sm font-medium", cfg.color)}>
                                        {cfg.label}
                                    </span>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                {build.status === 'completed' && build.compiled_file_url && (
                                    <>
                                        <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => handleDownload(build.compiled_file_url, build.project_name)}>
                                            <Download className="w-4 h-4" />Baixar
                                        </Button>
                                        <Button variant="outline" className="gap-2 text-violet-600 border-violet-200" onClick={() => handleDeploy(build)}>
                                            <Rocket className="w-4 h-4" />Deploy
                                        </Button>
                                    </>
                                )}
                                {build.status === 'processing' && (
                                    <Button variant="outline" className="gap-2 text-red-600 border-red-200" onClick={() => handleCancel(build)}>
                                        <X className="w-4 h-4" />Cancelar
                                    </Button>
                                )}
                                {build.status === 'failed' && (
                                    <Button variant="outline" className="gap-2 text-blue-600 border-blue-200" onClick={() => handleRecompile(build)}>
                                        <RefreshCw className="w-4 h-4" />Recompilar
                                    </Button>
                                )}
                                <Button variant="outline" className="gap-2 text-red-600 border-red-200" onClick={() => handleDelete(build.id)}>
                                    <Trash2 className="w-4 h-4" />Excluir
                                </Button>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { icon: Calendar, label: 'Data', value: format(new Date(build.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
                                { icon: User, label: 'Usuário', value: build.created_by || '-' },
                                { icon: Cpu, label: 'Ferramenta AI', value: build.ai_tool || 'Não especificada' },
                                { icon: FileText, label: 'Build ID', value: build.id?.substring(0, 12) + '...' },
                                { icon: Clock, label: 'Duração', value: build.build_duration ? `${build.build_duration}s` : '-' },
                                { icon: FileText, label: 'Tamanho', value: build.file_size ? `${(build.file_size / 1024 / 1024).toFixed(2)} MB` : '-' },
                            ].map(({ icon: IcoComp, label, value }) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <IcoComp className="w-4 h-4 text-violet-500" />
                                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 break-all">{value}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Error Message */}
                    {build.error_message && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-red-50 border border-red-200 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <h3 className="font-bold text-red-700">Mensagem de Erro</h3>
                            </div>
                            <p className="text-red-600 text-sm font-mono bg-red-100 p-3 rounded-lg break-all">
                                {build.error_message}
                            </p>
                        </motion.div>
                    )}

                    {/* Build Steps */}
                    {build.build_steps && Object.keys(build.build_steps).length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-violet-500" />Etapas do Build
                            </h3>
                            <div className="space-y-2">
                                {Object.entries(build.build_steps).map(([step, status]) => {
                                    const stepCfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
                                    const StepIcon = stepCfg.icon;
                                    return (
                                        <div key={step} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <StepIcon className={cn("w-4 h-4", stepCfg.iconColor,
                                                status === 'processing' ? 'animate-spin' : '')} />
                                            <span className="text-sm font-medium text-gray-700 capitalize flex-1">{step}</span>
                                            <span className={cn("text-xs px-2 py-0.5 rounded-full", stepCfg.color)}>{stepCfg.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Logs */}
                    {build.logs && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-gray-900 rounded-2xl p-6 shadow-lg">
                            <h3 className="font-bold text-gray-100 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-violet-400" />Logs do Build
                            </h3>
                            <pre className="text-xs text-green-400 overflow-auto max-h-96 font-mono whitespace-pre-wrap">
                                {build.logs}
                            </pre>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    }

    // List view
    const totalPages = Math.ceil(buildsData.total / itemsPerPage);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {renderHeader()}
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4">Filtros</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <AIToolFilter selectedTool={selectedAITool} onToolChange={(v) => { setSelectedAITool(v); setCurrentPage(1); }} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Status</label>
                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="completed">Concluídos</SelectItem>
                                    <SelectItem value="processing">Processando</SelectItem>
                                    <SelectItem value="failed">Falhados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Ordenar</label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date-desc">Mais recentes</SelectItem>
                                    <SelectItem value="date-asc">Mais antigos</SelectItem>
                                    <SelectItem value="name">Nome A-Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Por página</label>
                            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 por página</SelectItem>
                                    <SelectItem value="30">30 por página</SelectItem>
                                    <SelectItem value="60">60 por página</SelectItem>
                                    <SelectItem value="100">100 por página</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">{buildsData.total} compilações encontradas</p>
                </motion.div>

                {/* Builds List */}
                <div className="space-y-3">
                    {buildsData.items.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                            Nenhuma compilação encontrada
                        </div>
                    ) : (
                        <AnimatePresence>
                            {buildsData.items.map((b, idx) => {
                                const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.queued;
                                const BIcon = cfg.icon;
                                return (
                                    <motion.div key={b.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer"
                                        onClick={() => navigate(createPageUrl('BuildDetails') + `?id=${b.id}`)}
                                    >
                                        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className={cn("w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center",
                                                b.status === 'completed' ? 'bg-green-100' :
                                                b.status === 'failed' ? 'bg-red-100' : 'bg-blue-100')}>
                                                <BIcon className={cn("w-5 h-5", cfg.iconColor,
                                                    b.status === 'processing' ? 'animate-spin' : '')} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <p className="font-semibold text-gray-900 truncate">{b.project_name}</p>
                                                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.color)}>{cfg.label}</span>
                                                    {b.ai_tool && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium truncate max-w-[120px]" title={b.ai_tool}>
                                                            {b.ai_tool.split('(')[0].trim()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(b.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />{b.created_by}
                                                    </span>
                                                    {b.build_duration && <span>{b.build_duration}s</span>}
                                                </div>
                                                {b.error_message && (
                                                    <p className="text-xs text-red-500 mt-1 truncate">{b.error_message}</p>
                                                )}
                                            </div>
                                            {/* Quick actions - stop propagation */}
                                            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                {b.status === 'completed' && b.compiled_file_url && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Baixar" onClick={() => handleDownload(b.compiled_file_url, b.project_name)}>
                                                        <Download className="w-4 h-4 text-green-600" />
                                                    </Button>
                                                )}
                                                {b.status === 'completed' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Deploy" onClick={() => handleDeploy(b)}>
                                                        <Rocket className="w-4 h-4 text-violet-600" />
                                                    </Button>
                                                )}
                                                {b.status === 'processing' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Cancelar" onClick={() => handleCancel(b)}>
                                                        <X className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                )}
                                                {b.status === 'failed' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Recompilar" onClick={() => handleRecompile(b)}>
                                                        <RefreshCw className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Excluir" onClick={() => handleDelete(b.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="gap-2">
                            <ChevronLeft className="w-4 h-4" />Anterior
                        </Button>
                        <span className="text-sm font-medium text-gray-700 px-4 py-2 bg-white rounded-lg shadow-sm">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="gap-2">
                            Próxima<ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}