import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Database, HardDrive, FileArchive, Trash2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function StorageManagement() {
    const { data: builds = [], isLoading } = useQuery({
        queryKey: ['admin-builds'],
        queryFn: () => base44.entities.BuildHistory.list(),
    });

    // Calculate storage stats
    const totalSize = builds.reduce((sum, build) => sum + (build.file_size || 0), 0);
    const totalSizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
    const maxStorageGB = 100; // Configure based on your needs
    const usagePercent = (totalSizeGB / maxStorageGB) * 100;

    const completedBuilds = builds.filter(b => b.status === 'completed');
    const failedBuilds = builds.filter(b => b.status === 'failed');
    const processingBuilds = builds.filter(b => b.status === 'processing');

    const largestBuilds = [...builds]
        .filter(b => b.file_size)
        .sort((a, b) => b.file_size - a.file_size)
        .slice(0, 10);

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const mb = bytes / (1024 * 1024);
        if (mb < 1) return `${(bytes / 1024).toFixed(2)} KB`;
        if (mb < 1024) return `${mb.toFixed(2)} MB`;
        return `${(mb / 1024).toFixed(2)} GB`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Storage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Armazenamento Total</CardDescription>
                        <CardTitle className="text-3xl">{totalSizeGB} GB</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress value={usagePercent} className="h-2" />
                        <p className="text-xs text-gray-500 mt-2">
                            {usagePercent.toFixed(1)}% de {maxStorageGB} GB
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total de Arquivos</CardDescription>
                        <CardTitle className="text-3xl">{builds.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Média por Build</CardDescription>
                        <CardTitle className="text-3xl">
                            {builds.length > 0 ? formatFileSize(totalSize / builds.length) : '0 B'}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Build Status Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileArchive className="w-5 h-5" />
                        Status dos Builds
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-green-700">Completos</span>
                                <span className="text-2xl font-bold text-green-900">{completedBuilds.length}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-700">Falhos</span>
                                <span className="text-2xl font-bold text-red-900">{failedBuilds.length}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-blue-700">Processando</span>
                                <span className="text-2xl font-bold text-blue-900">{processingBuilds.length}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Largest Builds */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5" />
                        Builds Maiores
                    </CardTitle>
                    <CardDescription>Os 10 builds que ocupam mais espaço</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {largestBuilds.map((build) => (
                            <div key={build.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex-1">
                                    <p className="font-medium">{build.project_name}</p>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(build.created_date), 'dd/MM/yyyy HH:mm')} • {build.created_by}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-700">
                                        {formatFileSize(build.file_size)}
                                    </span>
                                    <div className="flex gap-2">
                                        {build.compiled_file_url && (
                                            <Button size="sm" variant="outline" asChild>
                                                <a href={build.compiled_file_url} download>
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={async () => {
                                                if (confirm('Deseja realmente remover este build?')) {
                                                    await base44.entities.BuildHistory.delete(build.id);
                                                    window.location.reload();
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Storage Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Ações de Gerenciamento</CardTitle>
                    <CardDescription>Ferramentas para otimizar o armazenamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (confirm('Remover todos os builds com falha? Esta ação não pode ser desfeita.')) {
                                for (const build of failedBuilds) {
                                    await base44.entities.BuildHistory.delete(build.id);
                                }
                                window.location.reload();
                            }
                        }}
                        className="w-full justify-start"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpar Builds Falhos ({failedBuilds.length})
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            const oldBuilds = builds.filter(b => new Date(b.created_date) < thirtyDaysAgo);
                            alert(`Encontrados ${oldBuilds.length} builds com mais de 30 dias`);
                        }}
                        className="w-full justify-start"
                    >
                        <Database className="w-4 h-4 mr-2" />
                        Encontrar Builds Antigos
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}