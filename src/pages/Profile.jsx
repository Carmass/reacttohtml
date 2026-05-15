import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, ArrowLeft, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ProfileForm from '../components/profile/ProfileForm';
import ProfileAvatar from '../components/profile/ProfileAvatar';
import AccountStats from '../components/profile/AccountStats';
import ActivityTimeline from '../components/profile/ActivityTimeline';
import SubscriptionInfo from '../components/profile/SubscriptionInfo';
import UserMenu from '../components/common/UserMenu';

export default function Profile() {
    const [isSaving, setIsSaving] = useState(false);

    const { data: user, isLoading, refetch: loadUser } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: builds = [] } = useQuery({
        queryKey: ['builds', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            return await base44.entities.BuildHistory.filter({ created_by: user.email }, '-created_date', 5);
        },
        enabled: !!user?.id
    });

    const { data: referrals = [] } = useQuery({
        queryKey: ['referrals', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            return await base44.entities.Referral.filter({ referrer_user_id: user.id }, '-updated_date', 5);
        },
        enabled: !!user?.id
    });

    const { data: plans = [] } = useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            return await base44.entities.Plan.filter({ active: true });
        }
    });

    const currentPlan = plans.find(p => p.id === user?.current_plan_id);

    const handleSave = async (data) => {
        setIsSaving(true);
        try {
            await base44.auth.updateMe(data);
            await loadUser();
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            // Deletar todos os builds do usuário
            const builds = await base44.entities.BuildHistory.filter({ created_by: user.email });
            for (const build of builds) {
                await base44.entities.BuildHistory.delete(build.id);
            }
            
            // Deletar o usuário
            await base44.entities.User.delete(user.id);
            
            // Fazer logout
            base44.auth.logout();
        } catch (error) {
            console.error('Erro ao remover conta:', error);
            alert('Erro ao remover conta. Tente novamente.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    Meu Perfil
                                </h1>
                                <p className="text-sm text-gray-500">Gerencie suas informações pessoais</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to={createPageUrl('Compiler')}>
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Button>
                            </Link>
                            <UserMenu user={user} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                {/* Account Stats */}
                <AccountStats 
                    user={user} 
                    totalBuilds={builds.length}
                    currentPlan={currentPlan}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Avatar Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Foto de Perfil</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProfileAvatar user={user} onUpdate={loadUser} />
                        </CardContent>
                    </Card>

                    {/* Profile Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações Pessoais</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProfileForm 
                                    user={user} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subscription Info */}
                    <SubscriptionInfo user={user} currentPlan={currentPlan} />

                    {/* Activity Timeline */}
                    <ActivityTimeline 
                        recentBuilds={builds}
                        recentReferrals={referrals}
                    />
                </div>

                {/* Danger Zone */}
                <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-600 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Zona de Perigo
                            </CardTitle>
                            <CardDescription>
                                Ações irreversíveis que afetam permanentemente sua conta
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="gap-2">
                                        <Trash2 className="w-4 h-4" />
                                        Remover Conta
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso irá permanentemente deletar sua
                                            conta e remover todos os seus dados, incluindo histórico de builds.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Sim, remover minha conta
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
            </div>
        </div>
    );
}