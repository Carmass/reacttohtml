import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Search, Filter, Eye, AlertCircle, CheckCircle, Clock, XCircle, ChevronLeft, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserMenu from '../components/common/UserMenu';

export default function AdminPayments() {
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [searchEmail, setSearchEmail] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [menuOpen, setMenuOpen] = useState(false);
    const itemsPerPage = 10;
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
                base44.auth.redirectToLogin(createPageUrl('AdminPayments'));
            } else {
                setIsAuthChecking(false);
            }
        };
        checkAuth();
    }, []);

    const { data: allInvoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => base44.entities.Invoice.list(),
        enabled: !isAuthChecking && user?.role === 'admin',
        refetchInterval: 10000
    });

    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
                    <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
                    <Link to={createPageUrl('Home')}>
                        <Button>Voltar ao Início</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Filtrar faturas
    const filteredInvoices = allInvoices.filter(invoice => {
        const emailMatch = invoice.user_email?.toLowerCase().includes(searchEmail.toLowerCase());
        const statusMatch = statusFilter === 'all' || invoice.status === statusFilter;
        return emailMatch && statusMatch;
    });

    // Paginar
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'open':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'void':
                return <XCircle className="w-5 h-5 text-gray-500" />;
            case 'uncollectible':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'open':
                return 'bg-yellow-100 text-yellow-800';
            case 'void':
                return 'bg-gray-100 text-gray-800';
            case 'uncollectible':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'paid':
                return 'Paga';
            case 'open':
                return 'Pendente';
            case 'void':
                return 'Anulada';
            case 'uncollectible':
                return 'Não Cobrável';
            default:
                return status;
        }
    };

    const handleDownloadPDF = (invoice) => {
        if (invoice.invoice_pdf_url) {
            window.open(invoice.invoice_pdf_url, '_blank');
        }
    };

    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pendingAmount = filteredInvoices.filter(inv => inv.status === 'open').reduce((sum, inv) => sum + (inv.amount || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link to={createPageUrl('Compiler')}>
                                <Button variant="outline" size="icon" className="rounded-lg">
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Painel de Pagamentos
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">Gerenciar faturas e pagamentos dos clientes</p>
                            </div>
                        </div>
                        
                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center gap-2">
                            <UserMenu user={user} />
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden">
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
                            className="lg:hidden border-t border-gray-200 mt-4 pt-4 flex justify-end"
                        >
                            <UserMenu user={user} />
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-blue-900">Total de Faturas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">${(totalAmount / 100).toFixed(2)}</div>
                                <p className="text-xs text-blue-700 mt-2">{filteredInvoices.length} faturas</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-green-900">Recebido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">${(paidAmount / 100).toFixed(2)}</div>
                                <p className="text-xs text-green-700 mt-2">{filteredInvoices.filter(inv => inv.status === 'paid').length} faturas pagas</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-yellow-900">Pendente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-yellow-600">${(pendingAmount / 100).toFixed(2)}</div>
                                <p className="text-xs text-yellow-700 mt-2">{filteredInvoices.filter(inv => inv.status === 'open').length} faturas pendentes</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por email</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Digite o email do cliente..."
                                    value={searchEmail}
                                    onChange={(e) => {
                                        setSearchEmail(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <Select value={statusFilter} onValueChange={(value) => {
                                setStatusFilter(value);
                                setCurrentPage(1);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrar por status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="paid">Paga</SelectItem>
                                    <SelectItem value="open">Pendente</SelectItem>
                                    <SelectItem value="void">Anulada</SelectItem>
                                    <SelectItem value="uncollectible">Não Cobrável</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </motion.div>

                {/* Invoices Table */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {paginatedInvoices.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cliente</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Plano</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Valor</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Data Vencimento</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedInvoices.map((invoice, idx) => (
                                            <motion.tr
                                                key={invoice.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{invoice.user_name || 'N/A'}</div>
                                                    <div className="text-sm text-gray-500">{invoice.user_email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{invoice.plan_name || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                                    ${(invoice.amount / 100).toFixed(2)} {invoice.currency?.toUpperCase()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(invoice.status)}
                                                        <Badge className={getStatusBadgeColor(invoice.status)}>
                                                            {getStatusLabel(invoice.status)}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDownloadPDF(invoice)}
                                                            disabled={!invoice.invoice_pdf_url}
                                                            className="gap-2"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            PDF
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} de {filteredInvoices.length}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = i + 1;
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    size="sm"
                                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 font-medium">Nenhuma fatura encontrada</p>
                            <p className="text-sm text-gray-500 mt-1">Tente ajustar seus filtros</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}