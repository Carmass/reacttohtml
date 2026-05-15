import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, AlertCircle, CheckCircle2, Loader2, Copy, Download } from 'lucide-react';

export default function GitHubLogsViewer() {
    const [selectedBuildId, setSelectedBuildId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);

    const { data: failedBuilds, isLoading } = useQuery({
        queryKey: ['failed-builds'],
        queryFn: async () => {
            const builds = await base44.entities.BuildHistory.filter({ status: 'failed' }, '-created_date', 100);
            return builds;
        }
    });

    const selectedBuild = failedBuilds?.find(b => b.id === selectedBuildId);
    // logs pode ser o texto bruto do GitHub Actions OU um JSON de metadados (builds antigos)
    const rawLogs = selectedBuild?.logs || '';
    let isJsonMeta = false;
    try { JSON.parse(rawLogs); isJsonMeta = true; } catch { isJsonMeta = false; }
    const logs = isJsonMeta ? '' : rawLogs; // Se for JSON interno, não exibir como log
    
    const filteredLogs = searchQuery
        ? logs.split('\n').filter(line => line.toLowerCase().includes(searchQuery.toLowerCase())).join('\n')
        : logs;

    const handleCopyLogs = () => {
        navigator.clipboard.writeText(logs);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadLogs = () => {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logs));
        element.setAttribute('download', `logs-${selectedBuildId}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800">Logs do GitHub Actions</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Visualize os logs detalhados dos builds que falharam no GitHub Actions para diagnosticar problemas.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Seletor de Build */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Selecionar Build com Falha
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedBuildId} onValueChange={setSelectedBuildId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Escolha um build para visualizar logs..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                            {failedBuilds && failedBuilds.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    Nenhum build com falha encontrado
                                </div>
                            ) : (
                                failedBuilds?.map(build => (
                                    <SelectItem key={build.id} value={build.id}>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3 text-red-500" />
                                            <span className="font-medium">{build.project_name}</span>
                                            <span className="text-xs text-gray-500">({build.ai_tool?.split('(')[0].trim()})</span>
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Logs Viewer */}
            {selectedBuild && logs && (
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-lg">{selectedBuild.project_name}</CardTitle>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    <Badge variant="destructive">Falhou</Badge>
                                    <Badge variant="outline">{selectedBuild.ai_tool}</Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {new Date(selectedBuild.created_date).toLocaleString('pt-BR')}
                                    </Badge>
                                </div>
                                {selectedBuild.error_message && (
                                    <p className="text-sm text-gray-600 mt-3 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                                        {selectedBuild.error_message}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyLogs}
                                    className="gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleDownloadLogs}
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filtro de logs */}
                        <div className="mb-4">
                            <Input
                                placeholder="Filtrar logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Logs */}
                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 max-h-96 overflow-y-auto space-y-0.5 border border-gray-700">
                            {filteredLogs.split('\n').map((line, i) => (
                                <div key={i} className="whitespace-pre-wrap break-words">
                                    {line || '\n'}
                                </div>
                            ))}
                            {filteredLogs.length === 0 && (
                                <div className="text-gray-500">Nenhum log disponível para este build</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedBuild && !logs && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-yellow-800">
                                    {selectedBuild.error_message ? 'Erro antes do GitHub Actions' : 'Logs não disponíveis'}
                                </p>
                                {selectedBuild.error_message ? (
                                    <p className="text-xs text-red-700 mt-2 font-mono bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap">
                                        {selectedBuild.error_message}
                                    </p>
                                ) : (
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Este build não possui logs do GitHub Actions. Pode ter ocorrido antes da implementação desta funcionalidade.
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!selectedBuild && (
                <Card className="border-gray-200">
                    <CardContent className="pt-12 pb-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Selecione um build acima para visualizar os logs</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}