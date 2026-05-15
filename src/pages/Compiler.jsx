import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Zap, History, AlertCircle, BarChart3, User, LogOut, HelpCircle, Gift, Crown, Settings, CreditCard, FolderOpen, Menu, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UploadZone from '../components/compiler/UploadZone';
import BuildProgress from '../components/compiler/BuildProgress';
import BuildProgressDetailed from '../components/compiler/BuildProgressDetailed';
import BuildHistoryPanel from '../components/compiler/BuildHistoryPanel';
import NotificationToast from '../components/compiler/NotificationToast';
import UserMenu from '../components/common/UserMenu';
import AIToolFilter from '../components/compiler/AIToolFilter';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Compiler() {
    const [selectedFile, setSelectedFile] = useState(null); // pode ser File ou File[]
    const [isProcessing, setIsProcessing] = useState(false);
    const [buildStatus, setBuildStatus] = useState(null);
    const [progress, setProgress] = useState(0);
    const [compiledUrl, setCompiledUrl] = useState(null);
    const [currentBuildId, setCurrentBuildId] = useState(null);
    const [buildSteps, setBuildSteps] = useState({});
    const [buildLogs, setBuildLogs] = useState([]);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedAITool, setSelectedAITool] = useState('all');
    const [currentAITool, setCurrentAITool] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [uploadReset, setUploadReset] = useState(0);
    const [projectAppId, setProjectAppId] = useState('');
    const pollRef = React.useRef(null);
    const buildContextRef = React.useRef(null);

    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me(),
        enabled: !isAuthChecking
    });

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

    // Carregar configurações do admin (incluindo webhook URL)
    useEffect(() => {
        base44.functions.invoke('getAdminSettings', {}).then(res => {
            const settings = res?.data?.settings;
            if (settings?.form_webhook_url) {
                window.__FORM_WEBHOOK_URL__ = settings.form_webhook_url;
            }
        }).catch(() => {});
    }, []);

    // Processar código de indicação da URL
    useEffect(() => {
        const processReferral = async () => {
            if (!user) return;

            const urlParams = new URLSearchParams(window.location.search);
            const referralCode = urlParams.get('ref');

            if (referralCode) {
                try {
                    // Capturar informações anti-fraude
                    const fingerprint = navigator.userAgent + navigator.language + screen.width + screen.height;
                    
                    await base44.functions.invoke('processReferral', {
                        referred_email: user.email,
                        referral_code: referralCode,
                        ip_address: '', // Será preenchido no backend
                        user_agent: navigator.userAgent,
                        fingerprint: btoa(fingerprint)
                    });

                    // Limpar URL
                    window.history.replaceState({}, document.title, '/Compiler');
                } catch (error) {
                    console.error('Erro ao processar indicação:', error);
                }
            }
        };

        processReferral();
    }, [user]);

    const { data: buildsData = { items: [], total: 0 } } = useQuery({
        queryKey: ['builds', currentPage, itemsPerPage, user?.email, selectedAITool],
        queryFn: async () => {
            if (!user?.email) return { items: [], total: 0 };
            
            const skip = (currentPage - 1) * itemsPerPage;
            // Filtrar builds do usuário atual
            let allBuilds = await base44.entities.BuildHistory.filter(
                { created_by: user.email },
                '-created_date',
                1000
            );
            
            // Aplicar filtro de AI Tool se selecionado
            if (selectedAITool && selectedAITool !== 'all') {
                allBuilds = allBuilds.filter(build => build.ai_tool === selectedAITool);
            }
            
            const items = allBuilds.slice(skip, skip + itemsPerPage);
            return { items, total: allBuilds.length };
        },
        initialData: { items: [], total: 0 },
        enabled: !isAuthChecking && !!user?.email,
        refetchInterval: 5000
    });

    const builds = buildsData.items;
    const totalBuilds = buildsData.total;
    const totalPages = Math.ceil(totalBuilds / itemsPerPage);

    const stopPolling = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    const startPolling = (repoName, githubUsername, buildId, projectName, aiTool, startTime) => {
        buildContextRef.current = { repoName, githubUsername, buildId, projectName, aiTool, startTime };
        pollRef.current = setInterval(async () => {
            const ctx = buildContextRef.current;
            if (!ctx) { stopPolling(); return; }
            try {
                const response = await base44.functions.invoke('pollToolBuild', {
                    repo: ctx.repoName,
                    github_username: ctx.githubUsername,
                    build_id: ctx.buildId,
                    project_name: ctx.projectName,
                    ai_tool: ctx.aiTool
                });
                const data = response.data;

                if (data.status === 'pending' || data.status === 'running') {
                    setBuildLogs(prev => [...prev, `⏳ Build em andamento...`]);
                    setProgress(prev => Math.min(prev + 3, 90));
                    return;
                }

                // Build finalizado (sucesso ou falha)
                stopPolling();
                setIsProcessing(false);
                const duration = Math.round((Date.now() - ctx.startTime) / 1000);

                if (data.status === 'completed' && data.success && data.compiled_file_url) {
                    setBuildLogs(prev => [...prev, `✅ Compilação concluída em ${duration}s!`]);
                    setProgress(100);
                    setBuildStatus('completed');
                    setCompiledUrl(data.compiled_file_url);
                    setBuildSteps({ upload: 'completed', validation: 'completed', install: 'completed', build: 'completed', optimize: 'completed' });
                    // Notificação disparada APÓS banco já atualizado pelo pollToolBuild
                    base44.functions.invoke('sendBuildNotification', { build_id: ctx.buildId }).catch(() => {});
                } else {
                    const errMsg = data.error || 'Erro desconhecido no build';
                    setBuildLogs(prev => [...prev, `❌ Erro: ${errMsg}`]);
                    setBuildStatus('failed');
                    setBuildSteps(prev => {
                        const s = { ...prev };
                        const running = Object.entries(s).find(([, v]) => v === 'running');
                        if (running) s[running[0]] = 'failed';
                        return s;
                    });
                    // Notificação disparada APÓS banco já atualizado pelo pollToolBuild
                    base44.functions.invoke('sendBuildNotification', { build_id: ctx.buildId }).catch(() => {});
                }
                queryClient.invalidateQueries(['builds']);
            } catch (pollError) {
                console.warn('⚠️ Erro transiente no polling, tentando novamente...', pollError.message);
            }
        }, 8000);
    };

    const handleCompile = async () => {
        const files = Array.isArray(selectedFile) ? selectedFile : (selectedFile ? [selectedFile] : []);
        if (files.length === 0) return;

        // Verificar limite diário antes de compilar
        try {
            const limitCheck = await base44.functions.invoke('checkDailyLimit', {});
            if (!limitCheck.data.can_compile) {
                alert(`❌ Limite diário atingido!\n\nVocê já usou ${limitCheck.data.daily_usage} de ${limitCheck.data.effective_limit} compilações hoje.\n\nFaça upgrade do seu plano para compilar mais!`);
                return;
            }
        } catch (error) {
            console.error('Erro ao verificar limite:', error);
            alert('Erro ao verificar limite diário. Tente novamente.');
            return;
        }

        stopPolling();
        setIsProcessing(true);
        setBuildStatus('uploading');
        setProgress(10);
        setBuildSteps({ upload: 'running' });
        setBuildLogs([
            `🛠️ Ferramenta: ${currentAITool || 'Não especificada'}`,
            `📦 ${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}`,
            'Iniciando upload...'
        ]);

        const startTime = Date.now();

        const compileSingle = async (file) => {
            setBuildLogs(prev => [...prev, `📤 Enviando: ${file.name}...`]);
            await base44.functions.invoke('incrementUsage', {});
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            // Preservar a extensão para arquivos soltos (.jsx, .js, .tsx, .ts)
            // para que o backend saiba como tratá-los corretamente
            const projectName = file.name.endsWith('.zip')
                ? file.name.replace('.zip', '')
                : file.name; // manter extensão para arquivos soltos
            const build = await base44.entities.BuildHistory.create({
                project_name: projectName,
                original_file_url: file_url,
                status: 'processing',
                file_size: file.size,
                ai_tool: currentAITool || undefined,
                app_id: projectAppId.trim() || undefined
            });
            const response = await base44.functions.invoke('startToolBuild', {
                file_url,
                project_name: projectName,
                ai_tool: currentAITool || '',
                build_id: build.id,
                app_id: projectAppId.trim() || undefined,
                webhook_url: window.__FORM_WEBHOOK_URL__ || undefined
            });
            if (!response.data.success) throw new Error(response.data.error || 'Erro ao iniciar build');
            return { build, repo: response.data.repo, github_username: response.data.github_username };
        };

        try {
            if (files.length === 1) {
                // ── Fluxo único: polling completo com botão de download ──
                const file = files[0];
                const { build, repo, github_username } = await compileSingle(file);

                setBuildSteps({ upload: 'completed', validation: 'completed', install: 'running' });
                setBuildLogs(prev => [...prev, '✅ Upload concluído', `📌 Build ID: ${build.id}`, '🚀 Iniciando build no GitHub Actions...']);
                setProgress(40);
                setCurrentBuildId(build.id);
                setBuildStatus('processing');
                setBuildLogs(prev => [...prev, `✅ Build iniciado! Repo: ${repo}`, '⏳ Aguardando conclusão (polling a cada 8s)...']);
                setProgress(50);
                setBuildSteps({ upload: 'completed', validation: 'completed', install: 'running', build: 'pending' });
                const projectName = file.name.endsWith('.zip') ? file.name.replace('.zip', '') : file.name;
                startPolling(repo, github_username, build.id, projectName, currentAITool, startTime);

            } else {
                // ── Fluxo em lote: dispara todos, depois polling para cada um ──
                const total = files.length;
                const batchBuilds = [];

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    setBuildLogs(prev => [...prev, `📤 [${i + 1}/${total}] ${file.name}`]);
                    setProgress(Math.round(10 + (i / total) * 50));
                    const { build, repo, github_username } = await compileSingle(file);
                    setBuildLogs(prev => [...prev, `✅ [${i + 1}/${total}] Build iniciado: ${file.name} (ID: ${build.id})`]);
                    batchBuilds.push({ build, repo, github_username, file });
                }

                setBuildLogs(prev => [...prev, `⏳ Polling iniciado para ${total} builds...`]);
                setProgress(60);

                // Polling paralelo para cada build do lote
                const pollBatch = async (ctx) => {
                    const { build, repo, github_username, file } = ctx;
                    const projectName = file.name.endsWith('.zip') ? file.name.replace('.zip', '') : file.name;
                    const aiTool = currentAITool || '';
                    let attempts = 0;
                    const MAX_ATTEMPTS = 60; // ~8 min (60 x 8s)

                    while (attempts < MAX_ATTEMPTS) {
                        await new Promise(r => setTimeout(r, 8000));
                        attempts++;
                        try {
                            const response = await base44.functions.invoke('pollToolBuild', {
                                repo,
                                github_username,
                                build_id: build.id,
                                project_name: projectName,
                                ai_tool: aiTool
                            });
                            const data = response.data;
                            if (data.status === 'pending' || data.status === 'running') continue;
                            // Finalizado
                            if (data.status === 'completed' && data.success) {
                                setBuildLogs(prev => [...prev, `✅ ${file.name} concluído!`]);
                                base44.functions.invoke('sendBuildNotification', { build_id: build.id }).catch(() => {});
                            } else {
                                const errMsg = data.error || 'Erro desconhecido';
                                setBuildLogs(prev => [...prev, `❌ ${file.name} falhou: ${errMsg}`]);
                                base44.functions.invoke('sendBuildNotification', { build_id: build.id }).catch(() => {});
                            }
                            return;
                        } catch (e) {
                            console.warn(`⚠️ Poll error para ${file.name}:`, e.message);
                        }
                    }
                    // Timeout: marcar como falho
                    setBuildLogs(prev => [...prev, `⚠️ Timeout no polling de ${file.name}`]);
                    await base44.entities.BuildHistory.update(build.id, {
                        status: 'failed',
                        error_message: 'Timeout: build demorou mais de 8 minutos'
                    }).catch(() => {});
                    base44.functions.invoke('sendBuildNotification', { build_id: build.id }).catch(() => {});
                };

                // Disparar polling em paralelo (não bloqueia a UI)
                Promise.all(batchBuilds.map(pollBatch)).then(() => {
                    queryClient.invalidateQueries(['builds']);
                    setBuildLogs(prev => [...prev, `🏁 Todos os ${total} builds finalizados!`]);
                });

                setProgress(100);
                setBuildSteps({ upload: 'completed', validation: 'completed', install: 'completed', build: 'completed', optimize: 'completed' });
                setBuildLogs(prev => [...prev, `🚀 ${total} projetos enviados! Acompanhe o progresso nos logs.`]);
                setBuildStatus('batch_sent');
                setIsProcessing(false);
                queryClient.invalidateQueries(['builds']);
            }
        } catch (error) {
            stopPolling();
            console.error('Erro:', error);
            setBuildStatus('failed');
            const errorMsg = error.response?.data?.error || error.message || 'Erro desconhecido';
            setBuildLogs(prev => [...prev, `❌ Erro: ${errorMsg}`]);
            setBuildSteps(prev => { const s = {...prev}; const running = Object.entries(s).find(([,v]) => v==='running'); if (running) s[running[0]] = 'failed'; return s; });
            setIsProcessing(false);
            queryClient.invalidateQueries(['builds']);
        }
    };

    const handleRecompile = async (build) => {
        setSelectedFile(null);
        setBuildStatus('processing');
        setProgress(40);
        setIsProcessing(true);
        setBuildLogs(['🔄 Recompilando: ' + build.project_name]);
        const startTime = Date.now();

        try {
            const response = await base44.functions.invoke('startToolBuild', {
                file_url: build.original_file_url,
                project_name: build.project_name,
                ai_tool: build.ai_tool || '',
                build_id: build.id,
                app_id: build.app_id || projectAppId.trim() || undefined,
                webhook_url: window.__FORM_WEBHOOK_URL__ || undefined
            });

            if (!response.data.success) throw new Error(response.data.error || 'Erro ao iniciar recompilação');

            const { repo, github_username } = response.data;
            setBuildLogs(prev => [...prev, `✅ Build iniciado! Repo: ${repo}`, '⏳ Aguardando conclusão...']);
            setCurrentBuildId(build.id);
            startPolling(repo, github_username, build.id, build.project_name, build.ai_tool, startTime);
        } catch (error) {
            console.error('Erro:', error);
            setBuildStatus('failed');
            setIsProcessing(false);
            alert(`Erro na recompilação: ${error.response?.data?.error || error.message}`);
            queryClient.invalidateQueries(['builds']);
        }
    };

    const handleCancelBuild = async (build) => {
        if (confirm('Deseja realmente cancelar este build em andamento?')) {
            try {
                await base44.entities.BuildHistory.update(build.id, {
                    status: 'failed',
                    error_message: 'Compilação cancelada pelo usuário'
                });

                // Notificar via email e in-app
                base44.functions.invoke('sendBuildNotification', { build_id: build.id }).catch(() => {});

                // Se for o build atual, atualizar a interface
                if (currentBuildId === build.id) {
                    setBuildStatus('failed');
                    setBuildLogs(prev => [...prev, '❌ Compilação cancelada pelo usuário']);
                    setIsProcessing(false);
                }

                queryClient.invalidateQueries(['builds']);
            } catch (error) {
                console.error('Erro ao cancelar build:', error);
                alert('Erro ao cancelar build');
            }
        }
    };

    const handleRevertToBuild = async (build) => {
        if (confirm(`Deseja reverter para o build "${build.project_name}" de ${new Date(build.created_date).toLocaleString()}?`)) {
            if (build.compiled_file_url) {
                window.open(build.compiled_file_url, '_blank');
                alert('Build anterior aberto! Baixe o arquivo para usar esta versão.');
            } else {
                alert('Este build não possui arquivo compilado disponível.');
            }
        }
    };

    const handleDownload = async () => {
        if (compiledUrl) {
            try {
                const urlParts = compiledUrl.split('/');
                const suggestedFileName = decodeURIComponent(urlParts[urlParts.length - 1]) || 'compiled-project.zip';

                const response = await base44.functions.invoke('downloadCompiledFile', {
                    fileUrl: compiledUrl,
                    fileName: suggestedFileName
                });

                // A função retorna base64 para evitar corrupção binária via Axios
                const { base64, fileName: respFileName } = response.data;
                const binaryStr = atob(base64);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/zip' });
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = respFileName || suggestedFileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
            } catch (error) {
                console.error('Erro ao baixar arquivo:', error);
                // Fallback: abrir URL diretamente
                window.open(compiledUrl, '_blank');
            }

            setSelectedFile(null);
            setBuildStatus(null);
            setProgress(0);
            setCompiledUrl(null);
            setCurrentBuildId(null);
            setBuildSteps({});
            setBuildLogs([]);
            setIsProcessing(false);
            setUploadReset(r => r + 1);
        }
    };

    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            <NotificationToast />
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                              <Zap className="w-6 h-6 text-white" />
                          </div>
                          <div className="hidden sm:block">
                              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                  React to HTML Compiler
                              </h1>
                              <p className="text-sm text-gray-500">Compile seus projetos React em HTML estático</p>
                          </div>
                       </div>
                       {/* Desktop Menu */}
                       <div className="hidden lg:flex items-center gap-3">
                           <Link to={createPageUrl('Dashboard')}>
                               <Button variant="outline" className="gap-2">
                                   <BarChart3 className="w-4 h-4" />
                                   Dashboard
                               </Button>
                           </Link>
                           <Link to={createPageUrl('Projects')}>
                               <Button variant="outline" className="gap-2">
                                   <FolderOpen className="w-4 h-4" />
                                   Projetos
                               </Button>
                           </Link>
                           <Link to={createPageUrl('Referrals')}>
                               <Button variant="outline" className="gap-2">
                                   <Gift className="w-4 h-4" />
                                   Indicações
                               </Button>
                           </Link>
                           <Link to={createPageUrl('PlanManagement')}>
                               <Button variant="outline" className="gap-2">
                                   <Crown className="w-4 h-4" />
                                   Planos
                               </Button>
                           </Link>
                           <Link to={createPageUrl('Support')}>
                               <Button variant="outline" className="gap-2">
                                   <HelpCircle className="w-4 h-4" />
                                   Suporte
                               </Button>
                           </Link>
                           <UserMenu user={user} />
                       </div>

                       {/* Mobile Menu Button */}
                       <div className="lg:hidden flex items-center gap-2">
                           <UserMenu user={user} />
                           <Button 
                               variant="outline" 
                               size="icon"
                               onClick={() => setMenuOpen(!menuOpen)}
                               className="rounded-lg"
                           >
                               {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                           </Button>
                       </div>
                     </div>

                     {/* Mobile Menu */}
                     {menuOpen && (
                         <motion.div
                             initial={{ opacity: 0, y: -10 }}
                             animate={{ opacity: 1, y: 0 }}
                             exit={{ opacity: 0, y: -10 }}
                             className="lg:hidden border-t border-gray-200 mt-4 pt-4 pb-2 space-y-2"
                         >
                             <Link to={createPageUrl('Dashboard')} onClick={() => setMenuOpen(false)}>
                                 <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-violet-50">
                                     <BarChart3 className="w-4 h-4" />
                                     Dashboard
                                 </Button>
                             </Link>
                             <Link to={createPageUrl('Projects')} onClick={() => setMenuOpen(false)}>
                                 <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-violet-50">
                                     <FolderOpen className="w-4 h-4" />
                                     Projetos
                                 </Button>
                             </Link>
                             <Link to={createPageUrl('Referrals')} onClick={() => setMenuOpen(false)}>
                                 <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-violet-50">
                                     <Gift className="w-4 h-4" />
                                     Indicações
                                 </Button>
                             </Link>
                             <Link to={createPageUrl('PlanManagement')} onClick={() => setMenuOpen(false)}>
                                 <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-violet-50">
                                     <Crown className="w-4 h-4" />
                                     Planos
                                 </Button>
                             </Link>
                             <Link to={createPageUrl('Support')} onClick={() => setMenuOpen(false)}>
                                 <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-violet-50">
                                     <HelpCircle className="w-4 h-4" />
                                     Suporte
                                 </Button>
                             </Link>
                         </motion.div>
                     )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-xl p-8"
                        >
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Upload do Projeto</h2>
                            
                            {/* AI Tool Selector */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Qual ferramenta de AI você usou para gerar este projeto?
                                </label>
                                <div className="w-full">
                                    <AIToolFilter 
                                        selectedTool={currentAITool}
                                        onToolChange={setCurrentAITool}
                                    />
                                </div>
                            </div>

                            <UploadZone 
                                onFileSelect={setSelectedFile}
                                isProcessing={isProcessing}
                                externalReset={uploadReset}
                            />

                            {(Array.isArray(selectedFile) ? selectedFile.length > 0 : !!selectedFile) && !buildStatus && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-6"
                                >
                                    <Button
                                        onClick={handleCompile}
                                        disabled={isProcessing}
                                        className="w-full h-14 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg"
                                    >
                                        <Zap className="w-5 h-5 mr-2" />
                                        {Array.isArray(selectedFile) && selectedFile.length > 1
                                            ? `Compilar ${selectedFile.length} Projetos`
                                            : 'Compilar Projeto'}
                                    </Button>
                                </motion.div>
                            )}
                        </motion.div>

                        <AnimatePresence>
                            {buildStatus && (
                                <BuildProgressDetailed 
                                    status={buildStatus} 
                                    progress={progress}
                                    buildId={currentBuildId}
                                    buildSteps={buildSteps}
                                    logs={buildLogs}
                                />
                            )}
                        </AnimatePresence>

                        {buildStatus === 'failed' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-8 border border-red-200"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Erro na compilação</h3>
                                        <p className="text-sm text-gray-600">Não foi possível processar o projeto</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setBuildStatus(null);
                                        setProgress(0);
                                        setCompiledUrl(null);
                                        setIsProcessing(false);
                                    }}
                                    variant="outline"
                                    className="w-full h-12 border-red-300 text-red-700 hover:bg-red-100"
                                >
                                    Tentar Novamente
                                </Button>
                            </motion.div>
                        )}

                        {buildStatus === 'batch_sent' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Compilação em lote iniciada!</h3>
                                        <p className="text-sm text-gray-600">Acompanhe o progresso no Histórico ao lado</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setBuildStatus(null);
                                        setProgress(0);
                                        setCompiledUrl(null);
                                        setUploadReset(r => r + 1);
                                    }}
                                    variant="outline"
                                    className="w-full h-12 font-semibold rounded-xl"
                                >
                                    Novo Upload
                                </Button>
                            </motion.div>
                        )}

                        {buildStatus === 'completed' && compiledUrl && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                        <Download className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Pronto para download!</h3>
                                        <p className="text-sm text-gray-600">Seu projeto foi compilado com sucesso</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        Baixar HTML Compilado
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setBuildStatus(null);
                                            setProgress(0);
                                            setCompiledUrl(null);
                                            queryClient.invalidateQueries(['builds']);
                                        }}
                                        variant="outline"
                                        className="h-12 px-6 font-semibold rounded-xl"
                                    >
                                        Novo Upload
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Sidebar - History */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-3xl shadow-xl p-6 overflow-hidden"
                        >
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <History className="w-5 h-5 text-violet-500" />
                                    <h3 className="font-bold text-gray-800">Histórico</h3>
                                </div>
                                
                                {/* Filtro de AI Tool */}
                                <div className="w-full">
                                    <AIToolFilter 
                                        selectedTool={selectedAITool}
                                        onToolChange={(value) => {
                                            setSelectedAITool(value);
                                            setCurrentPage(1);
                                        }}
                                        buildsCount={totalBuilds}
                                    />
                                </div>
                            </div>

                            <BuildHistoryPanel 
                                  builds={builds}
                                  onRecompile={handleRecompile}
                                  onCancelBuild={handleCancelBuild}
                                  onRevertToBuild={handleRevertToBuild}
                                  onRefresh={() => queryClient.invalidateQueries(['builds'])}
                                  currentPage={currentPage}
                                  totalPages={totalPages}
                                  itemsPerPage={itemsPerPage}
                                  totalBuilds={totalBuilds}
                                  onPageChange={setCurrentPage}
                                  onItemsPerPageChange={(value) => {
                                      setItemsPerPage(value);
                                      setCurrentPage(1);
                                  }}
                              />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}