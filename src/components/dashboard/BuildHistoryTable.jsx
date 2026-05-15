import React from 'react';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Download, ExternalLink, ChevronLeft, ChevronRight, Loader2, Calendar, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function BuildHistoryTable({
    builds,
    isLoading,
    currentPage,
    totalPages,
    itemsPerPage,
    totalBuilds,
    statusFilter,
    dateFrom,
    dateTo,
    onPageChange,
    onItemsPerPageChange,
    onStatusFilterChange,
    onDateFromChange,
    onDateToChange
}) {
    const getStatusBadge = (status) => {
        const config = {
            completed: { label: 'Concluído', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
            processing: { label: 'Processando', variant: 'secondary', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
            failed: { label: 'Falhou', variant: 'destructive', className: 'bg-red-500 hover:bg-red-600' }
        };
        const { label, variant, className } = config[status] || config.processing;
        return <Badge variant={variant} className={className}>{label}</Badge>;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '-';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const handleDelete = async (buildId) => {
        if (confirm('Deseja realmente excluir este build?')) {
            await base44.entities.BuildHistory.delete(buildId);
        }
    };

    const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-violet-600" />
                        <h3 className="font-semibold text-gray-800">Filtros</h3>
                    </div>
                    {hasActiveFilters && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                                onStatusFilterChange('all');
                                onDateFromChange('');
                                onDateToChange('');
                            }}
                            className="text-violet-600 hover:text-violet-700 hover:bg-violet-100"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Limpar filtros
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="completed">✓ Concluídos</SelectItem>
                                <SelectItem value="processing">⏳ Processando</SelectItem>
                                <SelectItem value="failed">✗ Falhados</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Data Início</label>
                        <div className="relative">
                            <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => onDateFromChange(e.target.value)}
                                className="bg-white pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Data Fim</label>
                        <div className="relative">
                            <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => onDateToChange(e.target.value)}
                                className="bg-white pl-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Info Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold text-gray-900">{builds.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalBuilds)}</span> de{' '}
                    <span className="font-semibold text-gray-900">{totalBuilds}</span> builds
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Itens por página:</span>
                    <Select 
                        value={itemsPerPage.toString()} 
                        onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Projeto</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Tamanho</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-500" />
                                </TableCell>
                            </TableRow>
                        ) : builds.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Nenhum build encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            builds.map((build) => (
                                <TableRow key={build.id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">
                                        <div>
                                            <div className="font-semibold text-gray-900">{build.project_name}</div>
                                            {build.error_message && (
                                                <div className="text-xs text-red-600 mt-1">{build.error_message}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(build.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(build.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {build.build_duration ? (
                                            <span className="text-sm text-gray-600">{build.build_duration}s</span>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-600">{formatFileSize(build.file_size)}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {build.status === 'completed' && build.compiled_file_url && (
                                                <a
                                                    href={build.compiled_file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Baixar arquivo compilado"
                                                >
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </Button>
                                                </a>
                                            )}
                                            {build.original_file_url && (
                                                <a
                                                    href={build.original_file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Ver arquivo original"
                                                >
                                                    <Button variant="ghost" size="sm">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">
                        Página <span className="font-semibold text-gray-900">{currentPage}</span> de{' '}
                        <span className="font-semibold text-gray-900">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="gap-1"
                        >
                            Próxima
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}