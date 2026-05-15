import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BuildLogsViewer({ logs }) {
    const parseLogType = (log) => {
        const lowered = log.toLowerCase();
        if (lowered.includes('error') || lowered.includes('❌') || lowered.includes('falhou')) {
            return 'error';
        }
        if (lowered.includes('warning') || lowered.includes('⚠️')) {
            return 'warning';
        }
        if (lowered.includes('✓') || lowered.includes('sucesso') || lowered.includes('concluído')) {
            return 'success';
        }
        return 'info';
    };

    const getLogIcon = (type) => {
        switch (type) {
            case 'error':
                return <AlertCircle className="w-3 h-3 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-3 h-3 text-amber-500" />;
            case 'success':
                return <Info className="w-3 h-3 text-green-500" />;
            default:
                return <Info className="w-3 h-3 text-blue-500" />;
        }
    };

    const getLogClasses = (type) => {
        switch (type) {
            case 'error':
                return 'bg-red-50 border-l-4 border-red-500 text-red-900';
            case 'warning':
                return 'bg-amber-50 border-l-4 border-amber-500 text-amber-900';
            case 'success':
                return 'bg-green-50 border-l-4 border-green-500 text-green-900';
            default:
                return 'bg-gray-50 border-l-4 border-gray-300 text-gray-700';
        }
    };

    if (!logs || logs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="w-5 h-5" />
                        Logs de Build
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhum log disponível</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    Logs de Build ({logs.length} {logs.length === 1 ? 'linha' : 'linhas'})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96 w-full rounded-md border bg-gray-900">
                    <div className="p-4 space-y-2 font-mono text-sm">
                        {logs.map((log, index) => {
                            const type = parseLogType(log);
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        'flex items-start gap-2 p-2 rounded',
                                        getLogClasses(type)
                                    )}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-gray-500 select-none font-bold text-xs">
                                            {String(index + 1).padStart(3, '0')}
                                        </span>
                                        {getLogIcon(type)}
                                    </div>
                                    <span className="flex-1 whitespace-pre-wrap break-words">
                                        {log}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}