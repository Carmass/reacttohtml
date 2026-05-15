import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Upload, Zap, Download, AlertCircle, CheckCircle2,
    Loader2, Info, FlaskConical, RotateCcw, ChevronDown, ChevronUp,
    ChevronLeft, ChevronRight
} from 'lucide-react';

const AI_TOOLS = [
    "Base44 (base44.ai)", "GPT (OpenAI)", "Google AI Studio", "Claude (claude.ai)",
    "Lovable (lovable.dev)", "Bolt.new (stackblitz.com)", "Replit Agent (replit.com)",
    "Marblism (marblism.com)", "DhiWise (dhiwise.com)", "Softgen (softgen.ai)",
    "Emergent (emergent.ai)", "GPT-Engineer (gptengineer.app)", "Pythagora (pythagora.ai)",
    "Create.xyz (create.xyz)", "v0 (v0.dev)", "Tempo (tempo.labs)", "Locofy.ai (locofy.ai)",
    "Anima (animaapp.com)", "Kombai (kombai.com)", "TeleportHQ (teleporthq.io)",
    "Plasmic (plasmic.app)", "Relume (relume.io)", "Quest AI (quest.ai)",
    "Bifrost (bifrost.so)", "Dualite (dualite.ai)", "Uizard (uizard.io)",
    "Cursor (cursor.com)", "Windsurf (codeium.com/windsurf)", "Builder.io (builder.io)", "Reweb (reweb.so)"
];

const ALL_TOOL_CONFIGS = [
    { tool: 'Lovable (lovable.dev)', node: '20', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Google AI Studio', node: '20', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Bolt.new (stackblitz.com)', node: '20', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'v0 (v0.dev)', node: '20', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Cursor (cursor.com)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Windsurf (codeium.com/windsurf)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Replit Agent (replit.com)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'GPT-Engineer (gptengineer.app)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Marblism (marblism.com)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Softgen (softgen.ai)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Emergent (emergent.ai)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Tempo (tempo.labs)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Builder.io (builder.io)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Reweb (reweb.so)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
    { tool: 'Outros (padrão)', node: '18', install: '--legacy-peer-deps', ci: 'CI=false' },
];

const CONFIGS_PER_PAGE = 6;

const POLL_INTERVAL_MS = 8000; // 8 segundos por poll

export default function AIToolCompilerLab() {
    const [selectedTool, setSelectedTool] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState(null);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(true);
    const [testHistory, setTestHistory] = useState([]);
    const [configPage, setConfigPage] = useState(0);

    const pollRef = useRef(null);
    const buildContextRef = useRef(null);

    const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setProjectName(file.name.replace('.zip', ''));
            setStatus(null);
            setResult(null);
            setErrorMsg('');
            setLogs([]);
        }
    };

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const startPolling = (repoName, githubUsername, buildId, startTime) => {
        buildContextRef.current = { repoName, githubUsername, buildId, startTime };

        pollRef.current = setInterval(async () => {
            const ctx = buildContextRef.current;
            if (!ctx) { stopPolling(); return; }

            try {
                addLog(`🔄 Verificando status do build...`);
                const response = await base44.functions.invoke('pollToolBuild', {
                    repo: ctx.repoName,
                    github_username: ctx.githubUsername,
                    build_id: ctx.buildId,
                    project_name: projectName,
                    ai_tool: selectedTool
                });

                const data = response.data;
                console.log('Poll result:', data);

                if (data.status === 'pending' || data.status === 'running') {
                    addLog(`⏳ ${data.message || 'Build em andamento...'}`);
                    return; // continua polling
                }

                // Finalizado (success ou fail)
                stopPolling();
                setIsProcessing(false);
                const duration = Math.round((Date.now() - ctx.startTime) / 1000);

                if (data.status === 'completed' && data.success) {
                    addLog(`✅ Compilação concluída em ${duration}s!`);
                    setResult(data.compiled_file_url);
                    setStatus('success');
                    setTestHistory(prev => [{
                        tool: selectedTool, project: projectName, status: 'success',
                        url: data.compiled_file_url, duration, time: new Date().toLocaleTimeString()
                    }, ...prev.slice(0, 9)]);
                } else {
                    const errMsg = data.error || 'Erro desconhecido';
                    addLog(`❌ Erro: ${errMsg}`);
                    setErrorMsg(errMsg);
                    setStatus('error');
                    setTestHistory(prev => [{
                        tool: selectedTool, project: projectName, status: 'error',
                        error: errMsg, time: new Date().toLocaleTimeString()
                    }, ...prev.slice(0, 9)]);
                }

            } catch (pollError) {
                const msg = pollError.response?.data?.error || pollError.message || 'Erro no poll';
                // Não parar o poll por erros transientes (ex: rede)
                addLog(`⚠️ Erro transiente no poll: ${msg}`);
                console.warn('Poll error (transient):', msg);
            }
        }, POLL_INTERVAL_MS);
    };

    const handleCompile = async () => {
        if (!selectedFile || !selectedTool) return;

        stopPolling();
        setIsProcessing(true);
        setStatus('processing');
        setLogs([]);
        setResult(null);
        setErrorMsg('');

        const startTime = Date.now();

        try {
            addLog(`🛠️ Ferramenta: ${selectedTool}`);
            addLog('📤 Fazendo upload do arquivo...');
            const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
            addLog('✅ Upload concluído');

            addLog('📋 Criando registro de build...');
            const build = await base44.entities.BuildHistory.create({
                project_name: projectName,
                original_file_url: file_url,
                status: 'processing',
                file_size: selectedFile.size,
                ai_tool: selectedTool
            });
            addLog(`📌 Build ID: ${build.id}`);

            addLog('🚀 Iniciando build no GitHub Actions...');
            addLog(`⚙️ Usando configurações para: ${selectedTool}`);

            const response = await base44.functions.invoke('startToolBuild', {
                file_url,
                project_name: projectName,
                ai_tool: selectedTool,
                build_id: build.id
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Erro ao iniciar build');
            }

            const { repo, github_username } = response.data;
            addLog(`✅ Build iniciado! Repo: ${repo}`);
            addLog('⏳ Aguardando conclusão do build (polling a cada 8s)...');

            startPolling(repo, github_username, build.id, startTime);

        } catch (error) {
            stopPolling();
            const msg = error.response?.data?.error || error.message || 'Erro desconhecido';
            addLog(`❌ Erro: ${msg}`);
            setErrorMsg(msg);
            setStatus('error');
            setIsProcessing(false);
            setTestHistory(prev => [{
                tool: selectedTool, project: projectName, status: 'error',
                error: msg, time: new Date().toLocaleTimeString()
            }, ...prev.slice(0, 9)]);
        }
    };

    const handleReset = () => {
        stopPolling();
        setSelectedFile(null);
        setStatus(null);
        setResult(null);
        setErrorMsg('');
        setLogs([]);
        setIsProcessing(false);
        buildContextRef.current = null;
        const input = document.getElementById('lab-file-upload');
        if (input) input.value = '';
    };

    const totalConfigPages = Math.ceil(ALL_TOOL_CONFIGS.length / CONFIGS_PER_PAGE);
    const visibleConfigs = ALL_TOOL_CONFIGS.slice(configPage * CONFIGS_PER_PAGE, (configPage + 1) * CONFIGS_PER_PAGE);

    const selectedToolConfigInfo = ALL_TOOL_CONFIGS.find(c => c.tool === selectedTool);

    return (
        <div className="space-y-6">
            {/* Header info */}
            <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                        <FlaskConical className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-violet-800">Laboratório de Compilação — Admin Only</p>
                            <p className="text-sm text-violet-700 mt-1">
                                Teste a compilação de qualquer ferramenta AI antes de publicar no compilador principal.
                                Cada ferramenta usa configurações otimizadas de build.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel esquerdo - configuração */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Zap className="w-5 h-5 text-violet-500" />
                                Configurar Teste
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Seletor de ferramenta */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    1. Selecionar Ferramenta AI
                                </label>
                                <Select value={selectedTool} onValueChange={setSelectedTool} disabled={isProcessing}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Escolha a ferramenta AI do projeto..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                        {AI_TOOLS.map(tool => (
                                            <SelectItem key={tool} value={tool}>{tool}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedTool && selectedToolConfigInfo && (
                                    <div className="mt-2 flex gap-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs">Node {selectedToolConfigInfo.node}</Badge>
                                        <Badge variant="outline" className="text-xs">{selectedToolConfigInfo.install}</Badge>
                                        <Badge variant="outline" className="text-xs">{selectedToolConfigInfo.ci}</Badge>
                                    </div>
                                )}
                                {selectedTool && !selectedToolConfigInfo && (
                                    <p className="text-xs text-gray-500 mt-1">Usando configuração padrão (Node 18, --legacy-peer-deps)</p>
                                )}
                            </div>

                            {/* Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    2. Upload do arquivo .zip
                                </label>
                                <input
                                    type="file"
                                    accept=".zip"
                                    id="lab-file-upload"
                                    onChange={handleFileInput}
                                    disabled={isProcessing}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 disabled:opacity-50"
                                />
                                {selectedFile && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        📁 {selectedFile.name} — {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                )}
                            </div>

                            {/* Botões */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleCompile}
                                    disabled={!selectedFile || !selectedTool || isProcessing}
                                    className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compilando...</>
                                    ) : (
                                        <><Zap className="w-4 h-4 mr-2" /> Compilar e Testar</>
                                    )}
                                </Button>
                                {(status || selectedFile) && !isProcessing && (
                                    <Button variant="outline" onClick={handleReset} className="gap-2">
                                        <RotateCcw className="w-4 h-4" /> Resetar
                                    </Button>
                                )}
                                {isProcessing && (
                                    <Button variant="outline" onClick={handleReset} className="gap-2 border-red-300 text-red-600 hover:bg-red-50">
                                        Cancelar
                                    </Button>
                                )}
                            </div>

                            {/* Resultado */}
                            {status === 'success' && result && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-semibold text-green-800">Build gerado com sucesso!</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => window.open(result, '_blank')}
                                        className="bg-green-600 hover:bg-green-700 text-white w-full"
                                    >
                                        <Download className="w-4 h-4 mr-1" /> Baixar HTML Compilado
                                    </Button>
                                    <p className="text-xs text-green-600 mt-2 break-all">{result}</p>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-800">Erro na compilação</p>
                                            <p className="text-xs text-red-600 mt-1 font-mono">{errorMsg}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Logs */}
                            {logs.length > 0 && (
                                <div>
                                    <button
                                        onClick={() => setShowLogs(v => !v)}
                                        className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800 mb-2"
                                    >
                                        {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        Logs ({logs.length} linhas)
                                    </button>
                                    {showLogs && (
                                        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 max-h-52 overflow-y-auto space-y-0.5">
                                            {logs.map((log, i) => (
                                                <div key={i}>{log}</div>
                                            ))}
                                            {isProcessing && <div className="animate-pulse">▌</div>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Panel direito */}
                <div className="space-y-4">
                    {/* Histórico */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Histórico de Testes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {testHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">Nenhum teste realizado</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {testHistory.map((test, i) => (
                                        <div key={i} className={`rounded-lg p-3 border text-xs ${test.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-700 truncate flex-1">{test.tool.split('(')[0].trim()}</span>
                                                {test.status === 'success'
                                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                                    : <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                                }
                                            </div>
                                            <p className="text-gray-500 truncate">{test.project}</p>
                                            <p className="text-gray-400 mt-0.5">{test.time}{test.duration ? ` — ${test.duration}s` : ''}</p>
                                            {test.status === 'error' && (
                                                <p className="text-red-500 mt-1 truncate" title={test.error}>{test.error}</p>
                                            )}
                                            {test.status === 'success' && test.url && (
                                                <button
                                                    onClick={() => window.open(test.url, '_blank')}
                                                    className="mt-1 text-green-700 hover:underline flex items-center gap-1"
                                                >
                                                    <Download className="w-3 h-3" /> Baixar
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Config info card com paginação */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-1">
                                <Info className="w-4 h-4 text-blue-500" />
                                Configurações por Tool
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-xs">
                                {visibleConfigs.map((cfg, i) => (
                                    <div key={i} className="border rounded p-2">
                                        <p className="font-medium text-gray-700">{cfg.tool.split('(')[0].trim()}</p>
                                        <p className="text-gray-500">Node {cfg.node} · {cfg.install} · {cfg.ci}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Paginação */}
                            {totalConfigPages > 1 && (
                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                    <button
                                        onClick={() => setConfigPage(p => Math.max(0, p - 1))}
                                        disabled={configPage === 0}
                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        {configPage + 1} / {totalConfigPages}
                                    </span>
                                    <button
                                        onClick={() => setConfigPage(p => Math.min(totalConfigPages - 1, p + 1))}
                                        disabled={configPage === totalConfigPages - 1}
                                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}