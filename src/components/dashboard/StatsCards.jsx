import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsCards({ stats }) {
    const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
    const failureRate = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0;
    
    const cards = [
        {
            title: 'Total de Builds',
            value: stats.total,
            icon: Zap,
            color: 'violet',
            bgGradient: 'from-violet-500 to-purple-600',
            delay: 0
        },
        {
            title: 'Concluídos',
            value: stats.completed,
            icon: CheckCircle,
            color: 'green',
            bgGradient: 'from-green-500 to-emerald-600',
            subtitle: `${successRate}% taxa de sucesso`,
            trend: successRate >= 80 ? 'up' : successRate >= 50 ? 'neutral' : 'down',
            delay: 0.1
        },
        {
            title: 'Falhados',
            value: stats.failed,
            icon: XCircle,
            color: 'red',
            bgGradient: 'from-red-500 to-rose-600',
            subtitle: `${failureRate}% taxa de falha`,
            trend: failureRate <= 10 ? 'up' : failureRate <= 30 ? 'neutral' : 'down',
            delay: 0.2
        },
        {
            title: 'Tempo Médio',
            value: `${stats.avgDuration.toFixed(1)}s`,
            icon: Clock,
            color: 'blue',
            bgGradient: 'from-blue-500 to-cyan-600',
            subtitle: stats.processing > 0 ? `${stats.processing} processando` : 'Sem builds em andamento',
            delay: 0.3
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
                
                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: card.delay }}
                    >
                        <Card className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.bgGradient} opacity-10 rounded-full -mr-16 -mt-16`} />
                            
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {card.title}
                                </CardTitle>
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.bgGradient} flex items-center justify-center shadow-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </CardHeader>
                            
                            <CardContent>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {card.value}
                                    </div>
                                    {card.trend && (
                                        <TrendIcon 
                                            className={`w-5 h-5 ${
                                                card.trend === 'up' ? 'text-green-500' : 'text-gray-400'
                                            }`}
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {card.subtitle || '\u00A0'}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}