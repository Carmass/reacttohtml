import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Settings, Users, CreditCard, UserPlus, Database, 
    LayoutDashboard, ArrowLeft, Shield, Loader2, FlaskConical, FileText, Bell, UsersRound, Cookie
} from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';
import PlanManagement from '../components/admin/PlanManagement';
import ReferralSettings from '../components/admin/ReferralSettings';
import SystemSettings from '../components/admin/SystemSettings';
import StorageManagement from '../components/admin/StorageManagement';
import DashboardCustomization from '../components/admin/DashboardCustomization';
import AIToolCompilerLab from '../components/admin/AIToolCompilerLab';
import GitHubLogsViewer from '../components/admin/GitHubLogsViewer';
import NotificationsSettings from '../components/admin/NotificationsSettings';
import TeamManagement from '../components/admin/TeamManagement';
import CookieConsentAnalytics from '../components/admin/CookieConsentAnalytics';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('users');

    const { data: user, isLoading } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me(),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const isAdmin = user?.role === 'admin' || user?.data?.is_owner;
    
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
                            Esta área é restrita apenas para administradores do sistema.
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    Painel Administrativo
                                </h1>
                                <p className="text-sm text-gray-500">Gerencie todos os aspectos do sistema</p>
                            </div>
                        </div>
                        <Link to={createPageUrl('Compiler')}>
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-2 lg:grid-cols-11 gap-2 h-auto p-2 bg-white">
                        <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <Users className="w-4 h-4" />
                            <span className="hidden sm:inline">Usuários</span>
                        </TabsTrigger>
                        <TabsTrigger value="plans" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <CreditCard className="w-4 h-4" />
                            <span className="hidden sm:inline">Planos</span>
                        </TabsTrigger>
                        <TabsTrigger value="referrals" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Indicações</span>
                        </TabsTrigger>
                        <TabsTrigger value="storage" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <Database className="w-4 h-4" />
                            <span className="hidden sm:inline">Armazenamento</span>
                        </TabsTrigger>
                        <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <Settings className="w-4 h-4" />
                            <span className="hidden sm:inline">Sistema</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications-config" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <Bell className="w-4 h-4" />
                            <span className="hidden sm:inline">Notificações</span>
                        </TabsTrigger>
                        <TabsTrigger value="github-logs" className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Logs GitHub</span>
                        </TabsTrigger>
                        <TabsTrigger value="teams" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <UsersRound className="w-4 h-4" />
                            <span className="hidden sm:inline">Equipes</span>
                        </TabsTrigger>
                        <TabsTrigger value="ai-lab" className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                            <FlaskConical className="w-4 h-4" />
                            <span className="hidden sm:inline">AI Lab</span>
                        </TabsTrigger>
                        <TabsTrigger value="cookies" className="flex items-center gap-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                            <Cookie className="w-4 h-4" />
                            <span className="hidden sm:inline">Cookies</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <UserManagement />
                    </TabsContent>

                    <TabsContent value="plans">
                        <PlanManagement />
                    </TabsContent>

                    <TabsContent value="referrals">
                        <ReferralSettings />
                    </TabsContent>

                    <TabsContent value="storage">
                        <StorageManagement />
                    </TabsContent>

                    <TabsContent value="dashboard">
                        <DashboardCustomization />
                    </TabsContent>

                    <TabsContent value="system">
                        <SystemSettings />
                    </TabsContent>

                    <TabsContent value="notifications-config">
                        <NotificationsSettings />
                    </TabsContent>

                    <TabsContent value="github-logs">
                        <GitHubLogsViewer />
                    </TabsContent>

                    <TabsContent value="teams">
                        <TeamManagement />
                    </TabsContent>

                    <TabsContent value="ai-lab">
                        <AIToolCompilerLab />
                    </TabsContent>

                    <TabsContent value="cookies">
                        <CookieConsentAnalytics />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}