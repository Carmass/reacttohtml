import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Copy, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function DeploymentLogsViewer({ deployment }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    
    if (!deployment?.deployment_logs || deployment.deployment_logs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Logs do Deployment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        Nenhum log disponível para este deployment
                    </div>
                </CardContent>
            </Card>
        );
    }

    const logs = deployment.deployment_logs;
    const filteredLogs = logs.filter(log => {
        const matchSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === 'all' || log.type === filterType;
        return matchSearch && matchType;
    });

    const copyLog = (text) => {
        navigator.clipboard.writeText(text);
    };

    const downloadLogs = () => {
        const logText = logs
            .map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`)
            .join('\n');
        
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logText));
        element.setAttribute('download', `deployment-${deployment.id}-logs.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'warning':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            default:
                return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Logs do Deployment</CardTitle>
                        <CardDescription>
                            {logs.length} registro(s) • {new Date(deployment.created_date).toLocaleString()}
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadLogs}
                        className="gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Baixar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Buscar nos logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm bg-white"
                    >
                        <option value="all">Todos</option>
                        <option value="info">Info</option>
                        <option value="warning">Aviso</option>
                        <option value="error">Erro</option>
                    </select>
                </div>

                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {filteredLogs.length === 0 ? (
                            <div className="text-gray-500 text-center py-4">Nenhum log encontrado</div>
                        ) : (
                            filteredLogs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-start gap-3 p-2 hover:bg-gray-800 rounded group transition-colors ${
                                        log.type === 'error' ? 'text-red-400' :
                                        log.type === 'warning' ? 'text-yellow-400' :
                                        'text-green-400'
                                    }`}
                                >
                                    <span className="flex-shrink-0 mt-0.5">
                                        {getTypeIcon(log.type)}
                                    </span>
                                    <div className="flex-1 break-all min-w-0">
                                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className="mx-2 text-gray-500">
                                            {log.elapsed ? `+${log.elapsed}ms` : ''}
                                        </span>
                                        <span>{log.message}</span>
                                    </div>
                                    <button
                                        onClick={() => copyLog(log.message)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 hover:bg-gray-700 rounded"
                                        title="Copiar"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}