import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Shield, DollarSign, Users, TrendingUp, AlertTriangle, ArrowLeft, User, LogOut } from 'lucide-react';
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

export default function AdminSubscriptions() {
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['admin-all-users'],
        queryFn: async () => {
            return await base44.entities.User.filter({}, '-created_date', 1000);
        },
        enabled: user?.role === 'admin' || user?.data?.is_owner
    });

    const { data: plans = [] } = useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            return await base44.entities.Plan.filter({}, 'price');
        },
        enabled: user?.role === 'admin' || user?.data?.is_owner
    });

    const isAdmin = user?.role === 'admin' || user?.data?.is_owner;
    
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                        <p className="text-gray-600 mb-4">Apenas administradores podem acessar esta página.</p>
                        <Link to={createPageUrl('Compiler')}>
                            <Button>Voltar para Home</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Calcular estatísticas
    const subscribedUsers = allUsers.filter(u => u.subscription_status === 'active');
    const planDistribution = {};
    let totalMRR = 0;

    allUsers.forEach(user => {
        const plan = plans.find(p => p.id === user.current_plan_id);
        if (plan) {
            if (!planDistribution[plan.name]) {
                planDistribution[plan.name] = { count: 0, revenue: 0 };
            }
            planDistribution[plan.name].count++;
            if (user.subscription_status === 'active') {
                planDistribution[plan.name].revenue += plan.price;
                totalMRR += plan.price;
            }
        }
    });

    const canceledCount = allUsers.filter(u => u.subscription_status === 'canceled').length;
    const pastDueCount = allUsers.filter(u => u.subscription_status === 'past_due').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    Admin - Assinaturas
                                </h1>
                                <p className="text-sm text-gray-500">Painel de controle de assinaturas e receita</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to={createPageUrl('Compiler')}>
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <User className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('Profile')} className="cursor-pointer">
                                            <User className="w-4 h-4 mr-2" />
                                            Perfil
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={() => base44.auth.logout()}
                                        className="cursor-pointer text-red-600"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sair
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">MRR Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">${totalMRR.toFixed(2)}</div>
                            <p className="text-xs text-gray-500 mt-1">Receita Mensal Recorrente</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Assinantes Ativos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{subscribedUsers.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Usuários</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{allUsers.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Cancelamentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600">{canceledCount}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Pagamento Atrasado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{pastDueCount}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Plan Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Distribuição por Plano
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(planDistribution).map(([planName, data]) => (
                                <div key={planName} className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">{planName}</h3>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-2xl font-bold text-violet-600">{data.count}</span>
                                        <span className="text-sm text-gray-500">usuários</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        MRR: ${data.revenue.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Subscribers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Lista de Assinantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border border-gray-200 overflow-hidden max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Email</TableHead>
                                        <TableHead>Plano</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Uso Diário</TableHead>
                                        <TableHead>Próxima Cobrança</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers
                                        .filter(u => u.current_plan_id)
                                        .map((user) => {
                                            const plan = plans.find(p => p.id === user.current_plan_id);
                                            return (
                                                <TableRow key={user.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium">{user.email}</TableCell>
                                                    <TableCell>{plan?.name || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            user.subscription_status === 'active' ? 'bg-green-500' :
                                                            user.subscription_status === 'canceled' ? 'bg-amber-500' :
                                                            user.subscription_status === 'past_due' ? 'bg-red-500' :
                                                            'bg-gray-500'
                                                        }>
                                                            {user.subscription_status || 'free'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.daily_usage_count || 0} / {plan?.daily_limit || 0}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.next_billing_date ? 
                                                            format(new Date(user.next_billing_date), "dd/MM/yy", { locale: ptBR }) : 
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        ${plan?.price?.toFixed(2) || '0.00'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}