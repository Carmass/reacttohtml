import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FtpConnectionTest({ project }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [credentials, setCredentials] = useState({
        ftp_host: '',
        ftp_port: 21,
        ftp_username: '',
        ftp_password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        setCredentials({
            ftp_host: project?.ftp_host || '',
            ftp_port: project?.ftp_port || 21,
            ftp_username: project?.ftp_username || '',
            ftp_password: ''
        });
    }, [project?.id, project?.ftp_host, project?.ftp_port, project?.ftp_username]);

    const handleTest = async () => {
        if (!credentials.ftp_host || !credentials.ftp_username || !credentials.ftp_password) {
            alert('Preencha host, usuário e senha para testar');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await base44.functions.invoke('testFtpConnection', credentials);
            setTestResult({
                success: true,
                message: response.data.message,
                currentDir: response.data.currentDir,
                duration: response.data.duration,
                logs: response.data.logs
            });
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            const errorLogs = error.response?.data?.logs || [];
            setTestResult({
                success: false,
                message: `Erro: ${errorMsg}`,
                logs: errorLogs
            });
        } finally {
            setIsTesting(false);
        }
    };

    const copyLog = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Card>
            <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <span>Teste de Conexão FTP</span>
                        </CardTitle>
                        <CardDescription>Teste suas credenciais FTP antes de fazer deploy</CardDescription>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Host FTP</Label>
                            <Input
                                value={credentials.ftp_host}
                                onChange={(e) => setCredentials({ ...credentials, ftp_host: e.target.value })}
                                placeholder="ftp.seusite.com"
                                disabled={isTesting}
                            />
                        </div>
                        <div>
                            <Label>Porta</Label>
                            <Input
                                type="number"
                                value={credentials.ftp_port}
                                onChange={(e) => setCredentials({ ...credentials, ftp_port: parseInt(e.target.value) })}
                                disabled={isTesting}
                            />
                        </div>
                        <div>
                            <Label>Usuário</Label>
                            <Input
                                value={credentials.ftp_username}
                                onChange={(e) => setCredentials({ ...credentials, ftp_username: e.target.value })}
                                placeholder="usuario@seusite.com"
                                disabled={isTesting}
                            />
                        </div>
                        <div>
                            <Label>Senha</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={credentials.ftp_password}
                                    onChange={(e) => setCredentials({ ...credentials, ftp_password: e.target.value })}
                                    placeholder="••••••••"
                                    disabled={isTesting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? '👁️‍🗨️' : '👁️'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleTest}
                        disabled={isTesting || !credentials.ftp_host || !credentials.ftp_username || !credentials.ftp_password}
                        className="w-full"
                    >
                        {isTesting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Testando...
                            </>
                        ) : (
                            'Testar Conexão'
                        )}
                    </Button>

                    {testResult && (
                        <div className={`rounded-lg p-4 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-start gap-3 mb-3">
                                {testResult.success ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                )}
                                <div>
                                    <p className={`font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                        {testResult.message}
                                    </p>
                                    {testResult.currentDir && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Diretório atual: <code className="bg-white px-2 py-1 rounded">{testResult.currentDir}</code>
                                        </p>
                                    )}
                                    {testResult.duration && (
                                        <p className="text-sm text-gray-600">
                                            Duração: {testResult.duration}s
                                        </p>
                                    )}
                                </div>
                            </div>

                            {testResult.logs && testResult.logs.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-semibold mb-2 text-gray-700">Logs detalhados:</div>
                                    <div className="bg-gray-900 text-gray-100 rounded p-3 text-xs font-mono overflow-y-auto max-h-48 space-y-1">
                                        {testResult.logs.map((log, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-start justify-between gap-2 hover:bg-gray-800 p-1 rounded group ${
                                                    log.type === 'error' ? 'text-red-400' :
                                                    log.type === 'warning' ? 'text-yellow-400' :
                                                    'text-green-400'
                                                }`}
                                            >
                                                <div className="flex-1 break-all">
                                                    <span className="text-gray-500 mr-2">[{log.elapsed}ms]</span>
                                                    {log.message}
                                                </div>
                                                <button
                                                    onClick={() => copyLog(log.message)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1"
                                                    title="Copiar"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                        <p className="font-semibold mb-1">💡 Dica:</p>
                        <p>Use este teste para validar suas credenciais FTP antes de fazer um deploy real. Ele simulará toda a sequência de conexão (USER, PASS, TYPE, PWD) sem enviar nenhum arquivo.</p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}