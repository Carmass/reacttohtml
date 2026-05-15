import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Trash2, Filter, Calendar, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, RotateCcw, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function BuildHistoryPanel({ 
    builds, 
    onRecompile, 
    onRefresh,
    onCancelBuild,
    onRevertToBuild,
    currentPage,
    totalPages,
    itemsPerPage,
    totalBuilds,
    onPageChange,
    onItemsPerPageChange
}) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const navigate = useNavigate();

    const filteredBuilds = builds
        .filter(build => statusFilter === 'all' || build.status === statusFilter)
        .sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.created_date) - new Date(a.created_date);
            if (sortBy === 'date-asc') return new Date(a.created_date) - new Date(b.created_date);
            if (sortBy === 'name') return a.project_name.localeCompare(b.project_name);
            return 0;
        });

    const handleDelete = async (buildId) => {
        if (confirm('Deseja realmente excluir este build?')) {
            await base44.entities.BuildHistory.delete(buildId);
            onRefresh();
        }
    };

    const handleDownload = async (build) => {
        try {
            const urlParts = build.compiled_file_url.split('/');
            const suggestedFileName = decodeURIComponent(urlParts[urlParts.length - 1]) || 'compiled-project.zip';
            const response = await base44.functions.invoke('downloadCompiledFile', {
                fileUrl: build.compiled_file_url,
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
            window.open(build.compiled_file_url, '_blank');
        }
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    };

    const getStatusText = (status) => {
        if (status === 'completed') return 'Concluído';
        if (status === 'failed') return 'Falhou';
        return 'Processando';
    };

    return (
        <div className="space-y-4">
            {/* Info e Controles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                    {totalBuilds} {totalBuilds === 1 ? 'build' : 'builds'} no total
                </p>
                <Select 
                    value={itemsPerPage.toString()} 
                    onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                >
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10 por página</SelectItem>
                        <SelectItem value="30">30 por página</SelectItem>
                        <SelectItem value="60">60 por página</SelectItem>
                        <SelectItem value="100">100 por página</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="completed">Concluídos</SelectItem>
                        <SelectItem value="processing">Processando</SelectItem>
                        <SelectItem value="failed">Falhados</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-desc">Mais recentes</SelectItem>
                        <SelectItem value="date-asc">Mais antigos</SelectItem>
                        <SelectItem value="name">Nome A-Z</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Build List */}
            <div className="space-y-3">
                {filteredBuilds.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                        Nenhuma compilação encontrada
                    </p>
                ) : (
                    <AnimatePresence>
                        {filteredBuilds.map((build) => (
                            <motion.div
                                key={build.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => navigate(createPageUrl('BuildDetails') + `?id=${build.id}`)}
                            >
                                <div className="flex flex-col gap-3">
                                    {/* Linha 1: Status Icon + Projeto + AI Tool */}
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(build.status)}
                                        <p className="font-semibold text-sm text-gray-800 truncate flex-1">
                                            {build.project_name}
                                        </p>
                                        {build.ai_tool && (
                                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium max-w-[90px] truncate" title={build.ai_tool}>
                                                {build.ai_tool.split('(')[0].trim()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Linha 2: Data + Status */}
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(build.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full whitespace-nowrap text-xs font-medium",
                                            build.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            build.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                        )}>
                                            {getStatusText(build.status)}
                                        </span>
                                    </div>

                                    {/* Linha 3: Ações */}
                                     <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        {build.status === 'completed' && build.compiled_file_url && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Baixar" onClick={() => handleDownload(build)}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                {onRevertToBuild && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => onRevertToBuild(build)}
                                                        title="Reverter para este build"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        {build.status === 'processing' && onCancelBuild && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => onCancelBuild(build)}
                                                title="Cancelar build"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {build.status === 'failed' && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => onRecompile(build)}
                                                title="Recompilar"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(build.id)}
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Mensagem de erro (se houver) */}
                                    {build.error_message && (
                                        <p className="text-xs text-red-600 break-words">{build.error_message}</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    )}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                    </Button>

                    <div className="flex items-center justify-center px-4 py-2 bg-gray-50 rounded-lg whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-700">
                            Página {currentPage} de {totalPages}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="gap-2"
                    >
                        Próxima
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    </div>
                    )}
                    </div>
                    );
                    }