import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Download, Zap, History, AlertCircle, BarChart3, User, LogOut, HelpCircle, Gift, Crown, Settings, CreditCard, FolderOpen, Menu, X, FlaskConical } from 'lucide-react';
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

export default function CompilerTest() {
    const [selectedFile, setSelectedFile] = useState(null);
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
    // Nova opção: estrutura de saída
    const [outputStructure, setOutputStructure] = useState('standard'); // 'standard' | 'per_page' | 'inline_html' | 'single_html'
    const [carouselIndex, setCarouselIndex] = useState(0);
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
                base44.auth.redirectToLogin(createPageUrl('CompilerTest'));
            } else {
                setIsAuthChecking(false);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const processReferral = async () => {
            if (!user) return;
            const urlParams = new URLSearchParams(window.location.search);
            const referralCode = urlParams.get('ref');
            if (referralCode) {
                try {
                    const fingerprint = navigator.userAgent + navigator.language + screen.width + screen.height;
                    await base44.functions.invoke('processReferral', {
                        referred_email: user.email,
                        referral_code: referralCode,
                        ip_address: '',
                        user_agent: navigator.userAgent,
                        fingerprint: btoa(fingerprint)
                    });
                    window.history.replaceState({}, document.title, '/CompilerTest');
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
            let allBuilds = await base44.entities.BuildHistory.filter(
                { created_by: user.email },
                '-created_date',
                1000
            );
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

    const startPolling = (repoName, githubUsername, buildId, projectName, aiTool, startTime, outputStructureParam) => {
        buildContextRef.current = { repoName, githubUsername, buildId, projectName, aiTool, startTime, outputStructure: outputStructureParam };
        pollRef.current = setInterval(async () => {
            const ctx = buildContextRef.current;
            if (!ctx) { stopPolling(); return; }
            try {
                const response = await base44.functions.invoke('pollToolBuild', {
                    repo: ctx.repoName,
                    github_username: ctx.githubUsername,
                    build_id: ctx.buildId,
                    project_name: ctx.projectName,
                    ai_tool: ctx.aiTool,
                    output_structure: ctx.outputStructure
                });
                const data = response.data;

                if (data.status === 'pending' || data.status === 'running') {
                    setBuildLogs(prev => [...prev, `⏳ Build em andamento...`]);
                    setProgress(prev => Math.min(prev + 3, 90));
                    return;
                }

                stopPolling();
                setIsProcessing(false);
                const duration = Math.round((Date.now() - ctx.startTime) / 1000);

                if (data.status === 'completed' && data.success && data.compiled_file_url) {
                    setBuildLogs(prev => [...prev, `✅ Compilação concluída em ${duration}s!`]);
                    setProgress(100);
                    setBuildStatus('completed');
                    setCompiledUrl(data.compiled_file_url);
                    setBuildSteps({ upload: 'completed', validation: 'completed', install: 'completed', build: 'completed', optimize: 'completed' });
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

        // Admins e owners têm limite ilimitado na página de teste
        if (user?.role !== 'admin' && user?.role !== 'owner') {
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
        }

        stopPolling();
        setIsProcessing(true);
        setBuildStatus('uploading');
        setProgress(10);
        setBuildSteps({ upload: 'running' });
        setBuildLogs([
            `🛠️ Ferramenta: ${currentAITool || 'Não especificada'}`,
            `📁 Estrutura de saída: ${outputStructure === 'per_page' ? 'Por Página' : 'Padrão'}`,
            `📦 ${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}`,
            'Iniciando upload...'
        ]);

        const startTime = Date.now();

        const compileSingle = async (file) => {
            setBuildLogs(prev => [...prev, `📤 Enviando: ${file.name}...`]);
            await base44.functions.invoke('incrementUsage', {});
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            const projectName = file.name.endsWith('.zip')
                ? file.name.replace('.zip', '')
                : file.name;
            const build = await base44.entities.BuildHistory.create({
                project_name: projectName,
                original_file_url: file_url,
                status: 'processing',
                file_size: file.size,
                ai_tool: currentAITool || undefined
            });
            const response = await base44.functions.invoke('startToolBuild', {
                file_url,
                project_name: projectName,
                ai_tool: currentAITool || '',
                build_id: build.id,
                output_structure: outputStructure  // <-- novo parâmetro
            });
            if (!response.data.success) throw new Error(response.data.error || 'Erro ao iniciar build');
            return { build, repo: response.data.repo, github_username: response.data.github_username };
        };

        try {
            if (files.length === 1) {
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
                startPolling(repo, github_username, build.id, projectName, currentAITool, startTime, outputStructure);

            } else {
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

                const pollBatch = async (ctx) => {
                    const { build, repo, github_username, file } = ctx;
                    const projectName = file.name.endsWith('.zip') ? file.name.replace('.zip', '') : file.name;
                    const aiTool = currentAITool || '';
                    let attempts = 0;
                    const MAX_ATTEMPTS = 60;

                    while (attempts < MAX_ATTEMPTS) {
                        await new Promise(r => setTimeout(r, 8000));
                        attempts++;
                        try {
                            const response = await base44.functions.invoke('pollToolBuild', {
                                repo,
                                github_username,
                                build_id: build.id,
                                project_name: projectName,
                                ai_tool: aiTool,
                                output_structure: outputStructure
                            });
                            const data = response.data;
                            if (data.status === 'pending' || data.status === 'running') continue;
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
                    setBuildLogs(prev => [...prev, `⚠️ Timeout no polling de ${file.name}`]);
                    await base44.entities.BuildHistory.update(build.id, {
                        status: 'failed',
                        error_message: 'Timeout: build demorou mais de 8 minutos'
                    }).catch(() => {});
                    base44.functions.invoke('sendBuildNotification', { build_id: build.id }).catch(() => {});
                };

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
                output_structure: outputStructure
            });

            if (!response.data.success) throw new Error(response.data.error || 'Erro ao iniciar recompilação');

            const { repo, github_username } = response.data;
            setBuildLogs(prev => [...prev, `✅ Build iniciado! Repo: ${repo}`, '⏳ Aguardando conclusão...']);
            setCurrentBuildId(build.id);
            startPolling(repo, github_username, build.id, build.project_name, build.ai_tool, startTime, outputStructure);
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
                base44.functions.invoke('sendBuildNotification', { build_id: build.id }).catch(() => {});
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
                console.error('Erro ao baixar arquivo:', error);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
            <NotificationToast />
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                              <FlaskConical className="w-6 h-6 text-white" />
                          </div>
                          <div className="hidden sm:block">
                              <div className="flex items-center gap-2">
                                  <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                      Compiler (Test)
                                  </h1>
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">BETA</span>
                              </div>
                              <p className="text-sm text-gray-500">Teste de nova estrutura de saída</p>
                          </div>
                       </div>
                       {/* Desktop Menu */}
                       <div className="hidden lg:flex items-center gap-3">
                           <Link to={createPageUrl('Compiler')}>
                               <Button variant="outline" className="gap-2">
                                   <Zap className="w-4 h-4" />
                                   Compiler Original
                               </Button>
                           </Link>
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
                             <Link to={createPageUrl('Compiler')} onClick={() => setMenuOpen(false)}>
                                 <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-amber-50">
                                     <Zap className="w-4 h-4" />
                                     Compiler Original
                                 </Button>
                             </Link>
                             <Link to={createPageUrl('Dashboard')} onClick={() => setMenuOpen(false)}>
                                 <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-amber-50">
                                     <BarChart3 className="w-4 h-4" />
                                     Dashboard
                                 </Button>
                             </Link>
                             <Link to={createPageUrl('Projects')} onClick={() => setMenuOpen(false)}>
                                 <Button variant="ghost" className="w-full justify-start gap-3 text-gray-700 hover:bg-amber-50">
                                     <FolderOpen className="w-4 h-4" />
                                     Projetos
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

                            {/* Output Structure Selector - Carrossel */}
                            {(() => {
                                const opts = [
                                    {
                                        value: 'standard',
                                        label: 'Padrão',
                                        desc: 'HTMLs na raiz, assets em pasta global',
                                        tree: ['📄 index.html', '📄 obrigado.html', '📁 assets/', '   ├ index.js', '   ├ index.css', '   ├ obrigado.js', '   └ obrigado.css']
                                    },
                                    {
                                        value: 'per_page',
                                        label: 'Por Página',
                                        desc: 'Cada página isolada com seus próprios assets',
                                        tree: ['📄 index.html', '📁 assets/ (globais)', '📁 obrigado/', '   ├ index.html', '   └ 📁 assets/', '      ├ obrigado.js', '      └ obrigado.css']
                                    },
                                    {
                                        value: 'inline_html',
                                        label: 'HTML Inline',
                                        desc: 'Todo JS e CSS embutido diretamente no .html',
                                        tree: ['📄 index.html (inline)', '📄 obrigado.html (inline)', '', '✅ Sem pasta assets', '✅ Arquivo único por página', '✅ Abre direto no browser']
                                    },
                                    {
                                        value: 'single_html',
                                        label: 'HTML Único',
                                        desc: 'Um index.html + assets/bundle.js e assets/bundle.css',
                                        tree: ['📄 index.html', '📁 assets/', '   ├ bundle.js', '   └ bundle.css', '', '✅ JS e CSS unificados', '✅ Apenas 3 arquivos no total']
                                    }
                                ];
                                const visibleCount = 3;
                                const maxIndex = opts.length - visibleCount;
                                const visibleOpts = opts.slice(carouselIndex, carouselIndex + visibleCount);
                                return (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Estrutura de saída dos arquivos compilados
                                        </label>
                                        <div className="relative">
                                            <div className="flex gap-3 overflow-hidden">
                                                {visibleOpts.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setOutputStructure(opt.value)}
                                                        className={`flex-1 p-4 rounded-xl border-2 text-left transition-all min-w-0 ${
                                                            outputStructure === opt.value
                                                                ? 'border-amber-500 bg-amber-50'
                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                                outputStructure === opt.value ? 'border-amber-500' : 'border-gray-400'
                                                            }`}>
                                                                {outputStructure === opt.value && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                                                            </div>
                                                            <span className={`font-semibold text-sm ${outputStructure === opt.value ? 'text-amber-700' : 'text-gray-700'}`}>
                                                                {opt.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mb-2">{opt.desc}</p>
                                                        <div className="font-mono text-xs text-gray-400 bg-gray-50 rounded p-2 space-y-0.5">
                                                            {opt.tree.map((line, i) => <div key={i}>{line}</div>)}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Navegação carrossel */}
                                            <div className="flex items-center justify-between mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                                                    disabled={carouselIndex === 0}
                                                    className="px-3 py-1 rounded-lg border border-gray-200 text-gray-500 text-xs disabled:opacity-30 hover:bg-gray-50 transition-all"
                                                >
                                                    ← Anterior
                                                </button>
                                                <div className="flex gap-1.5">
                                                    {opts.map((_, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => setCarouselIndex(Math.min(i, maxIndex))}
                                                            className={`w-2 h-2 rounded-full transition-all ${
                                                                i >= carouselIndex && i < carouselIndex + visibleCount
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCarouselIndex(i => Math.min(maxIndex, i + 1))}
                                                    disabled={carouselIndex >= maxIndex}
                                                    className="px-3 py-1 rounded-lg border border-gray-200 text-gray-500 text-xs disabled:opacity-30 hover:bg-gray-50 transition-all"
                                                >
                                                    Próximo →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

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
                                        className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg font-semibold rounded-xl shadow-lg"
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
                                    <History className="w-5 h-5 text-amber-500" />
                                    <h3 className="font-bold text-gray-800">Histórico</h3>
                                </div>
                                
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