import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UsageStats({ usageData, currentPlan, nextBillingDate }) {
    const usagePercent = (usageData.daily_usage / usageData.effective_limit) * 100;

    return (
        <Card className="border-2 border-violet-100">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-violet-600" />
                        Uso Diário
                    </CardTitle>
                    {usageData.subscription_status === 'active' && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                            Assinatura Ativa
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">
                            {usageData.daily_usage} de {usageData.effective_limit} compilações usadas
                        </span>
                        <span className="text-sm text-gray-500">
                            {usageData.remaining} restantes
                        </span>
                    </div>
                    <Progress value={usagePercent} className="h-3" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-violet-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-violet-600" />
                            <span className="text-xs font-medium text-gray-600">Plano Atual</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                            {currentPlan?.name || 'Starter'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {usageData.daily_limit} compilações/dia
                        </p>
                    </div>

                    {usageData.referral_credits > 0 && (
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Gift className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-medium text-gray-600">Créditos Bônus</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                                +{usageData.referral_credits}
                            </p>
                            <p className="text-xs text-gray-500">
                                De indicações
                            </p>
                        </div>
                    )}

                    {nextBillingDate && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-medium text-gray-600">Próxima Cobrança</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                                {format(new Date(nextBillingDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}