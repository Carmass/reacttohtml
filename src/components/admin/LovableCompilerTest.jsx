import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Zap, Download, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function LovableCompilerTest() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState(null); // null | 'processing' | 'success' | 'error'
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setProjectName(file.name.replace('.zip', ''));
        }
    };

    const handleCompile = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);
        setStatus('processing');
        setLogs([]);
        setResult(null);
        setErrorMsg('');

        try {
            addLog('Fazendo upload do arquivo...');
            const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
            addLog(`Upload concluído: ${file_url.substring(0, 60)}...`);

            addLog('Criando registro de build...');
            const build = await base44.entities.BuildHistory.create({
                project_name: projectName,
                original_file_url: file_url,
                status: 'processing',
                file_size: selectedFile.size,
                ai_tool: 'Lovable (lovable.dev)'
            });
            addLog(`Build ID: ${build.id}`);

            addLog('Iniciando compilação com módulo Lovable (pode levar 2-5 min)...');
            const response = await base44.functions.invoke('compileLovable', {
                file_url,
                project_name: projectName,
                build_id: build.id
            });

            if (response.data.success) {
                addLog('✅ Compilação concluída com sucesso!');
                setResult(response.data.compiled_file_url);
                setStatus('success');
            } else {
                throw new Error(response.data.error || 'Erro desconhecido');
            }
        } catch (error) {
            const msg = error.response?.data?.error || error.message || 'Erro desconhecido';
            addLog(`❌ Erro: ${msg}`);
            setErrorMsg(msg);
            setStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4 pb-3">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-amber-800">Módulo experimental — apenas admins</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Este módulo usa <strong>npm install --legacy-peer-deps</strong> e <strong>CI=false</strong> para compatibilidade com projetos do Lovable que costumam ter conflitos de dependências.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-violet-500" />
                        Teste: Compilar Projeto Lovable
                        <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">Admin Only</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selecionar arquivo .zip do Lovable
                        </label>
                        <input
                            type="file"
                            accept=".zip"
                            onChange={handleFileInput}
                            disabled={isProcessing}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 disabled:opacity-50"
                        />
                        {selectedFile && (
                            <p className="text-xs text-gray-500 mt-1">
                                {selectedFile.name} — {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleCompile}
                        disabled={!selectedFile || isProcessing}
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                    >
                        {isProcessing ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compilando Lovable...</>
                        ) : (
                            <><Upload className="w-4 h-4 mr-2" /> Compilar com Módulo Lovable</>
                        )}
                    </Button>

                    {/* Logs */}
                    {logs.length > 0 && (
                        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 max-h-48 overflow-y-auto space-y-1">
                            {logs.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                            {isProcessing && <div className="animate-pulse">▌</div>}
                        </div>
                    )}

                    {/* Sucesso */}
                    {status === 'success' && result && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Build gerado com sucesso!</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => window.open(result, '_blank')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Download className="w-4 h-4 mr-1" /> Baixar
                            </Button>
                        </div>
                    )}

                    {/* Erro */}
                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Erro na compilação</p>
                                <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}