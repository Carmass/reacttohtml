import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, ArrowUpRight, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubscriptionInfo({ user, currentPlan }) {
    const hasActivePlan = user?.stripe_subscription_id && user?.subscription_status === 'active';
    const isCanceled = user?.subscription_status === 'canceled';

    return (
        <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                            <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle>Assinatura Atual</CardTitle>
                            <CardDescription>
                                {hasActivePlan ? 'Plano Premium Ativo' : 'Plano Gratuito'}
                            </CardDescription>
                        </div>
                    </div>
                    {hasActivePlan ? (
                        <Badge className="bg-green-500">Ativo</Badge>
                    ) : isCanceled ? (
                        <Badge className="bg-red-500">Cancelado</Badge>
                    ) : (
                        <Badge className="bg-gray-500">Gratuito</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {hasActivePlan ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-3 border border-violet-200">
                                <p className="text-xs text-gray-600 mb-1">Plano</p>
                                <p className="font-semibold text-gray-900">{currentPlan?.name || 'Premium'}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-violet-200">
                                <p className="text-xs text-gray-600 mb-1">Limite Diário</p>
                                <p className="font-semibold text-gray-900">{currentPlan?.daily_limit || '∞'} builds</p>
                            </div>
                        </div>

                        {user?.next_billing_date && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg p-3 border border-violet-200">
                                <Calendar className="w-4 h-4" />
                                <span>Próxima cobrança: {format(new Date(user.next_billing_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                            </div>
                        )}

                        <Link to={createPageUrl('PlanManagement')}>
                            <Button variant="outline" className="w-full gap-2">
                                <CreditCard className="w-4 h-4" />
                                Gerenciar Assinatura
                            </Button>
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="bg-white rounded-lg p-4 border border-violet-200">
                            <p className="text-sm text-gray-600 mb-2">
                                Você está no plano gratuito. Faça upgrade para desbloquear:
                            </p>
                            <ul className="space-y-1 text-sm text-gray-700">
                                <li>✨ Builds ilimitados</li>
                                <li>⚡ Prioridade no processamento</li>
                                <li>🚀 Deploy automático</li>
                                <li>💎 Suporte prioritário</li>
                            </ul>
                        </div>

                        <Link to={createPageUrl('PlanManagement')}>
                            <Button className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                <Crown className="w-4 h-4" />
                                Ver Planos Premium
                                <ArrowUpRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </>
                )}
            </CardContent>
        </Card>
    );
}