import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, HelpCircle, Zap, UploadCloud, Gift, CreditCard, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatsCards from '../components/dashboard/StatsCards';
import BuildsChart from '../components/dashboard/BuildsChart';
import StatusDistribution from '../components/dashboard/StatusDistribution';
import BuildHistoryTable from '../components/dashboard/BuildHistoryTable';
import AIToolsChart from '../components/dashboard/AIToolsChart';
import UserMenu from '../components/common/UserMenu';
import DeployStatsSection from '../components/dashboard/DeployStatsSection';
import ReferralStatsSection from '../components/dashboard/ReferralStatsSection';
import PaymentStatsSection from '../components/dashboard/PaymentStatsSection';
import ProjectStatsSection from '../components/dashboard/ProjectStatsSection';
import DashboardExport from '../components/dashboard/DashboardExport';

export default function Dashboard() {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: deployments = [] } = useQuery({
        queryKey: ['dashboard-deployments', user?.email],
        queryFn: async () => {
            if (!user) return [];
            if (user.role === 'admin') return base44.entities.Deployment.list('-created_date', 500);
            return base44.entities.Deployment.filter({ created_by: user.email }, '-created_date', 500);
        },
        enabled: !!user
    });

    const { data: referrals = [] } = useQuery({
        queryKey: ['dashboard-referrals', user?.email],
        queryFn: async () => {
            if (!user) return [];
            if (user.role === 'admin') return base44.entities.Referral.list('-created_date', 500);
            return base44.entities.Referral.filter({ referrer_email: user.email }, '-created_date', 200);
        },
        enabled: !!user
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['dashboard-invoices', user?.email],
        queryFn: async () => {
            if (!user) return [];
            if (user.role === 'admin') return base44.entities.Invoice.list('-created_date', 500);
            return base44.entities.Invoice.filter({ user_email: user.email }, '-created_date', 200);
        },
        enabled: !!user
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['dashboard-projects', user?.email],
        queryFn: async () => {
            if (!user) return [];
            return base44.entities.Project.filter({ created_by: user.email }, '-created_date', 200);
        },
        enabled: !!user
    });

    const { data: collaborators = [] } = useQuery({
        queryKey: ['dashboard-collaborators', user?.email],
        queryFn: async () => {
            if (!user) return [];
            return base44.entities.ProjectCollaborator.filter({ owner_email: user.email }, '-created_date', 200);
        },
        enabled: !!user
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['dashboard-users'],
        queryFn: async () => {
            if (!user || user.role !== 'admin') return [];
            return base44.entities.User.list('-created_date', 500);
        },
        enabled: !!user && user?.role === 'admin'
    });

    const { data: buildsData = { items: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['dashboard-builds', currentPage, itemsPerPage, statusFilter, dateFrom, dateTo, user?.email],
        queryFn: async () => {
            if (!user?.email) return { items: [], total: 0, allBuilds: [] };
            
            const skip = (currentPage - 1) * itemsPerPage;
            // Filtrar apenas builds do usuário atual
            let allBuilds = await base44.entities.BuildHistory.filter(
                { created_by: user.email },
                '-created_date',
                1000
            );
            
            // Filtrar por status
            if (statusFilter !== 'all') {
                allBuilds = allBuilds.filter(b => b.status === statusFilter);
            }
            
            // Filtrar por data
            if (dateFrom) {
                allBuilds = allBuilds.filter(b => new Date(b.created_date) >= new Date(dateFrom));
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                allBuilds = allBuilds.filter(b => new Date(b.created_date) <= endDate);
            }
            
            const total = allBuilds.length;
            const items = allBuilds.slice(skip, skip + itemsPerPage);
            
            return { items, total, allBuilds };
        },
        enabled: !!user?.email,
        refetchInterval: 5000
    });

    // Estatísticas
    const stats = React.useMemo(() => {
        const all = buildsData.allBuilds || [];
        const completed = all.filter(b => b.status === 'completed').length;
        const failed = all.filter(b => b.status === 'failed').length;
        const processing = all.filter(b => b.status === 'processing').length;
        const builtWithDuration = all.filter(b => b.build_duration && b.build_duration > 0);
        const avgDuration = builtWithDuration.length > 0 
            ? Math.round(builtWithDuration.reduce((sum, b) => sum + b.build_duration, 0) / builtWithDuration.length)
            : 0;
        
        return { completed, failed, processing, avgDuration, total: all.length };
    }, [buildsData.allBuilds]);

    const builds = buildsData.items;
    const totalBuilds = buildsData.total;
    const totalPages = Math.ceil(totalBuilds / itemsPerPage);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <BarChart3 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    Dashboard
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">Análise completa das suas compilações</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <DashboardExport
                                builds={buildsData.allBuilds || []}
                                deployments={deployments}
                                referrals={referrals}
                                invoices={invoices}
                                projects={projects}
                                collaborators={collaborators}
                            />
                            <Link to={createPageUrl('Compiler')}>
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Button>
                            </Link>
                            <Link to={createPageUrl('Support')}>
                                <Button variant="outline" className="gap-2">
                                    <HelpCircle className="w-4 h-4" />
                                    Suporte
                                </Button>
                            </Link>
                            <UserMenu user={user} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Cards — existentes, sem alteração */}
                <StatsCards stats={stats} />

                <Tabs defaultValue="builds">
                    <TabsList className="flex flex-wrap gap-1 h-auto">
                        <TabsTrigger value="builds" className="gap-1.5 text-xs">
                            <Zap className="w-3.5 h-3.5" /> Compilações
                        </TabsTrigger>
                        <TabsTrigger value="deploys" className="gap-1.5 text-xs">
                            <UploadCloud className="w-3.5 h-3.5" /> Deploys
                        </TabsTrigger>
                        <TabsTrigger value="projects" className="gap-1.5 text-xs">
                            <FolderOpen className="w-3.5 h-3.5" /> Projetos
                        </TabsTrigger>
                        <TabsTrigger value="referrals" className="gap-1.5 text-xs">
                            <Gift className="w-3.5 h-3.5" /> Indicações
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="gap-1.5 text-xs">
                            <CreditCard className="w-3.5 h-3.5" /> Pagamentos
                        </TabsTrigger>
                    </TabsList>

                    {/* ABA COMPILAÇÕES — mantém tudo que existia */}
                    <TabsContent value="builds" className="space-y-8 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <BuildsChart builds={buildsData.allBuilds || []} />
                            </div>
                            <div className="lg:col-span-1">
                                <StatusDistribution stats={stats} />
                            </div>
                        </div>
                        <AIToolsChart builds={buildsData.allBuilds || []} />
                        <Card>
                            <CardHeader>
                                <CardTitle>Histórico de Compilações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <BuildHistoryTable
                                    builds={builds}
                                    isLoading={isLoading}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    itemsPerPage={itemsPerPage}
                                    totalBuilds={totalBuilds}
                                    statusFilter={statusFilter}
                                    dateFrom={dateFrom}
                                    dateTo={dateTo}
                                    onPageChange={setCurrentPage}
                                    onItemsPerPageChange={(value) => {
                                        setItemsPerPage(value);
                                        setCurrentPage(1);
                                    }}
                                    onStatusFilterChange={setStatusFilter}
                                    onDateFromChange={setDateFrom}
                                    onDateToChange={setDateTo}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ABA DEPLOYS */}
                    <TabsContent value="deploys" className="mt-6">
                        <DeployStatsSection deployments={deployments} />
                    </TabsContent>

                    {/* ABA PROJETOS */}
                    <TabsContent value="projects" className="mt-6">
                        <ProjectStatsSection projects={projects} collaborators={collaborators} />
                    </TabsContent>

                    {/* ABA INDICAÇÕES */}
                    <TabsContent value="referrals" className="mt-6">
                        <ReferralStatsSection referrals={referrals} user={user} />
                    </TabsContent>

                    {/* ABA PAGAMENTOS */}
                    <TabsContent value="payments" className="mt-6">
                        <PaymentStatsSection invoices={invoices} users={allUsers} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}