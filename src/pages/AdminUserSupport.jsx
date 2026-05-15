import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Search, Shield, Download, Calendar, User, LogOut, ArrowLeft, ChevronLeft, Menu, X,
    FileArchive, Activity, CreditCard, UserCheck, AlertTriangle,
    Gift, Loader2, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import UserMenu from '../components/common/UserMenu';
import { motion } from 'framer-motion';

export default function AdminUserSupport() {
    const [searchEmail, setSearchEmail] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const { data: currentUser } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['admin-all-users-support'],
        queryFn: async () => {
            return await base44.entities.User.filter({}, '-created_date', 1000);
        },
        enabled: currentUser?.role === 'admin' || currentUser?.data?.is_owner
    });

    const { data: plans = [] } = useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            return await base44.entities.Plan.filter({}, 'price');
        }
    });

    const { data: userBuilds = [], isLoading: loadingBuilds } = useQuery({
        queryKey: ['user-builds', selectedUserId],
        queryFn: async () => {
            const selectedUser = allUsers.find(u => u.id === selectedUserId);
            if (!selectedUser) return [];
            return await base44.entities.BuildHistory.filter(
                { created_by: selectedUser.email },
                '-created_date',
                100
            );
        },
        enabled: !!selectedUserId
    });

    const { data: userReferrals = [] } = useQuery({
        queryKey: ['user-referrals', selectedUserId],
        queryFn: async () => {
            const selectedUser = allUsers.find(u => u.id === selectedUserId);
            if (!selectedUser) return [];
            return await base44.entities.Referral.filter(
                { referrer_user_id: selectedUserId },
                '-created_date',
                50
            );
        },
        enabled: !!selectedUserId
    });

    const isAdmin = currentUser?.role === 'admin' || currentUser?.data?.is_owner;

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Acesso Negado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">
                            Esta área é restrita apenas para administradores.
                        </p>
                        <Link to={createPageUrl('Compiler')}>
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Voltar ao Início
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const filteredUsers = allUsers.filter(u => 
        !searchEmail || u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
    );

    const selectedUser = allUsers.find(u => u.id === selectedUserId);
    const userPlan = selectedUser ? plans.find(p => p.id === selectedUser.current_plan_id) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Suporte - Usuários
                                </h1>
                                <p className="text-sm text-gray-500">Administração de contas e arquivos dos usuários</p>
                            </div>
                        </div>
                        
                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center gap-2">
                            <UserMenu user={currentUser} />
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
                            <UserMenu user={currentUser} />
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Search Panel */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="w-5 h-5" />
                                    Buscar Usuário
                                </CardTitle>
                                <CardDescription>
                                    Pesquise por email ou nome
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    placeholder="Digite o email ou nome..."
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    className="w-full"
                                />

                                {loadingUsers ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                        {filteredUsers.map((user) => {
                                            const plan = plans.find(p => p.id === user.current_plan_id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    onClick={() => setSelectedUserId(user.id)}
                                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                                        selectedUserId === user.id
                                                            ? 'border-violet-500 bg-violet-50'
                                                            : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-sm">{user.email}</span>
                                                        {user.role === 'admin' && (
                                                            <Badge className="bg-red-500 text-xs">Admin</Badge>
                                                        )}
                                                    </div>
                                                    {user.full_name && (
                                                        <p className="text-xs text-gray-500 mb-2">{user.full_name}</p>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {plan?.name || 'Free'}
                                                        </Badge>
                                                        {user.subscription_status === 'active' && (
                                                            <Badge className="bg-green-500 text-xs">Ativo</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {filteredUsers.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">
                                                Nenhum usuário encontrado
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* User Details Panel */}
                    <div className="lg:col-span-2">
                        {!selectedUser ? (
                            <Card>
                                <CardContent className="py-20 text-center">
                                    <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        Selecione um usuário
                                    </h3>
                                    <p className="text-gray-500">
                                        Busque e selecione um usuário para ver detalhes
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {/* User Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <UserCheck className="w-5 h-5" />
                                            Informações da Conta
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Email</label>
                                                <p className="font-medium">{selectedUser.email}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Nome</label>
                                                <p className="font-medium">{selectedUser.full_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Role</label>
                                                <Badge className={selectedUser.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}>
                                                    {selectedUser.role}
                                                </Badge>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Data Registro</label>
                                                <p className="font-medium">
                                                    {format(new Date(selectedUser.created_date), "dd/MM/yyyy", { locale: ptBR })}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Plano Atual</label>
                                                <p className="font-medium">{userPlan?.name || 'Free'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Status Assinatura</label>
                                                <Badge className={
                                                    selectedUser.subscription_status === 'active' ? 'bg-green-500' :
                                                    selectedUser.subscription_status === 'canceled' ? 'bg-amber-500' :
                                                    'bg-gray-500'
                                                }>
                                                    {selectedUser.subscription_status || 'free'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Uso Diário</label>
                                                <p className="font-medium">
                                                    {selectedUser.daily_usage_count || 0} / {userPlan?.daily_limit || 3}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Créditos de Indicação</label>
                                                <p className="font-medium">{selectedUser.referral_credits || 0}</p>
                                            </div>
                                            {selectedUser.stripe_customer_id && (
                                                <div>
                                                    <label className="text-xs text-gray-500">Stripe Customer ID</label>
                                                    <p className="font-mono text-xs">{selectedUser.stripe_customer_id}</p>
                                                </div>
                                            )}
                                            {selectedUser.next_billing_date && (
                                                <div>
                                                    <label className="text-xs text-gray-500">Próxima Cobrança</label>
                                                    <p className="font-medium">
                                                        {format(new Date(selectedUser.next_billing_date), "dd/MM/yyyy", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Builds & Files */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileArchive className="w-5 h-5" />
                                            Builds e Arquivos ({userBuilds.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingBuilds ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                                            </div>
                                        ) : userBuilds.length === 0 ? (
                                            <p className="text-center text-gray-500 py-8">
                                                Nenhum build encontrado
                                            </p>
                                        ) : (
                                            <div className="rounded-xl border border-gray-200 overflow-hidden max-h-[400px] overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50">
                                                            <TableHead>Projeto</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead>Data</TableHead>
                                                            <TableHead>Tamanho</TableHead>
                                                            <TableHead className="text-right">Ações</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {userBuilds.map((build) => (
                                                            <TableRow key={build.id}>
                                                                <TableCell className="font-medium">
                                                                    {build.project_name}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={
                                                                        build.status === 'completed' ? 'bg-green-500' :
                                                                        build.status === 'failed' ? 'bg-red-500' :
                                                                        'bg-blue-500'
                                                                    }>
                                                                        {build.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {format(new Date(build.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {(build.file_size / 1024 / 1024).toFixed(2)} MB
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex gap-2 justify-end">
                                                                        {build.original_file_url && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => window.open(build.original_file_url, '_blank')}
                                                                            >
                                                                                <Download className="w-3 h-3 mr-1" />
                                                                                Original
                                                                            </Button>
                                                                        )}
                                                                        {build.compiled_file_url && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => window.open(build.compiled_file_url, '_blank')}
                                                                            >
                                                                                <Download className="w-3 h-3 mr-1" />
                                                                                Compilado
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Referrals Activity */}
                                {userReferrals.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Gift className="w-5 h-5" />
                                                Atividade de Indicações ({userReferrals.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="rounded-xl border border-gray-200 overflow-hidden max-h-[300px] overflow-y-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50">
                                                            <TableHead>Email Indicado</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead>Recompensa</TableHead>
                                                            <TableHead>Data</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {userReferrals.map((ref) => (
                                                            <TableRow key={ref.id}>
                                                                <TableCell>{ref.referred_email}</TableCell>
                                                                <TableCell>
                                                                    <Badge className={
                                                                        ref.status === 'valid' ? 'bg-green-500' :
                                                                        ref.status === 'pending' ? 'bg-blue-500' :
                                                                        ref.status === 'rewarded' ? 'bg-purple-500' :
                                                                        'bg-red-500'
                                                                    }>
                                                                        {ref.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {ref.reward_given ? '✅' : '⏳'} {ref.reward_amount || 0} créditos
                                                                </TableCell>
                                                                <TableCell>
                                                                    {format(new Date(ref.created_date), "dd/MM/yy", { locale: ptBR })}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}