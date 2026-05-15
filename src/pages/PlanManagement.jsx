import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap, ArrowLeft, Loader2, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import PlanCard from '../components/plans/PlanCard';
import UsageStats from '../components/plans/UsageStats';
import UserMenu from '../components/common/UserMenu';

export default function PlanManagement() {
    const [isLoading, setIsLoading] = useState(false);

    const { data: user, refetch: refetchUser } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: plans = [] } = useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            return await base44.entities.Plan.filter({ is_active: true }, 'price');
        }
    });

    const { data: usageData } = useQuery({
        queryKey: ['usage', user?.id],
        queryFn: async () => {
            const response = await base44.functions.invoke('checkDailyLimit', {});
            return response.data;
        },
        enabled: !!user,
        refetchInterval: 10000
    });

    const handleUpgrade = async (plan) => {
        if (!plan.stripe_price_id) {
            alert('Este plano não tem preço configurado. Configure o Stripe Price ID no painel admin.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await base44.functions.invoke('stripeCreateCheckout', {
                price_id: plan.stripe_price_id,
                plan_name: plan.name,
            });
            if (response.data?.url) {
                window.location.href = response.data.url;
            } else {
                alert('Erro ao criar sessão de checkout. Verifique a configuração do Stripe.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert(error.message || 'Erro ao criar checkout. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você terá acesso até o fim do período.')) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await base44.functions.invoke('cancelSubscription', {});
            alert(response.data.message);
            refetchUser();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao cancelar assinatura. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    // Match current plan by name (our DB uses subscription_plan name, not ID)
    const currentPlanName = user?.subscription_plan || 'Free';
    const currentPlan = plans.find(p => p.name?.toLowerCase() === currentPlanName?.toLowerCase());
    const currentPlanId = currentPlan?.id;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Crown className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    Gerenciar Plano
                                </h1>
                                <p className="text-sm text-gray-500">Escolha o plano ideal para você</p>
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

            <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
                {/* Usage Stats */}
                {usageData && (
                    <UsageStats 
                        usageData={usageData} 
                        currentPlan={currentPlan}
                        nextBillingDate={user?.next_billing_date}
                    />
                )}

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan, index) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            currentPlanId={currentPlanId}
                            onUpgrade={handleUpgrade}
                            isLoading={isLoading}
                            index={index}
                        />
                    ))}
                </div>

                {/* Cancel Subscription */}
                {user?.stripe_subscription_id && user?.subscription_status !== 'canceled' && (
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-600">Cancelar Assinatura</CardTitle>
                            <CardDescription>
                                Você manterá acesso aos recursos premium até o fim do período atual
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleCancelSubscription}
                                variant="destructive"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Cancelar Assinatura
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}