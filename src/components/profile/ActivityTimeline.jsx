import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Users, CreditCard, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ActivityTimeline({ recentBuilds, recentReferrals }) {
    const activities = [];

    // Adicionar builds recentes
    recentBuilds?.forEach(build => {
        activities.push({
            type: 'build',
            date: new Date(build.created_date),
            title: 'Build Compilado',
            description: build.project_name,
            status: build.status,
            icon: Package
        });
    });

    // Adicionar referrals recentes
    recentReferrals?.forEach(referral => {
        if (referral.status === 'rewarded') {
            activities.push({
                type: 'referral',
                date: new Date(referral.updated_date || referral.created_date),
                title: 'Indicação Validada',
                description: `+${referral.reward_amount} créditos`,
                status: 'success',
                icon: Users
            });
        }
    });

    // Ordenar por data mais recente
    activities.sort((a, b) => b.date - a.date);
    const recentActivities = activities.slice(0, 8);

    if (recentActivities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma atividade recente</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getStatusColor = (type, status) => {
        if (type === 'referral') return 'bg-green-500';
        if (status === 'completed') return 'bg-blue-500';
        if (status === 'failed') return 'bg-red-500';
        return 'bg-amber-500';
    };

    const getStatusBadge = (type, status) => {
        if (type === 'referral') {
            return <Badge className="bg-green-100 text-green-800">Recompensa</Badge>;
        }
        
        const statusMap = {
            completed: <Badge className="bg-blue-100 text-blue-800">Sucesso</Badge>,
            failed: <Badge className="bg-red-100 text-red-800">Falhou</Badge>,
            processing: <Badge className="bg-amber-100 text-amber-800">Processando</Badge>,
            queued: <Badge className="bg-gray-100 text-gray-800">Na Fila</Badge>
        };
        
        return statusMap[status] || statusMap.queued;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                    
                    {/* Activities */}
                    <div className="space-y-6">
                        {recentActivities.map((activity, index) => {
                            const Icon = activity.icon;
                            return (
                                <div key={index} className="relative flex gap-4">
                                    {/* Icon */}
                                    <div className={`relative z-10 w-12 h-12 rounded-full ${getStatusColor(activity.type, activity.status)} flex items-center justify-center shadow-md flex-shrink-0`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 pt-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                                                <p className="text-sm text-gray-600">{activity.description}</p>
                                            </div>
                                            {getStatusBadge(activity.type, activity.status)}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {format(activity.date, "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}