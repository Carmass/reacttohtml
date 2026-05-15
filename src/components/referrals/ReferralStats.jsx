import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, CheckCircle, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReferralStats({ stats, user }) {
    const cards = [
        {
            title: 'Créditos Disponíveis',
            value: stats.credits,
            icon: Gift,
            color: 'from-emerald-500 to-green-600',
            delay: 0
        },
        {
            title: 'Total Indicados',
            value: stats.total,
            icon: Users,
            color: 'from-violet-500 to-purple-600',
            delay: 0.1
        },
        {
            title: 'Aguardando Validação',
            value: stats.pending,
            icon: Clock,
            color: 'from-amber-500 to-orange-600',
            delay: 0.2
        },
        {
            title: 'Validados',
            value: stats.valid,
            icon: CheckCircle,
            color: 'from-blue-500 to-cyan-600',
            delay: 0.3
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => {
                const Icon = card.icon;
                
                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: card.delay }}
                        className="h-full"
                    >
                        <Card className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full -mr-16 -mt-16`} />
                            
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {card.title}
                                </CardTitle>
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </CardHeader>
                            
                            <CardContent className="flex-1 flex flex-col justify-between">
                                <div className="text-3xl font-bold text-gray-900">
                                    {card.value}
                                </div>
                                <div className="h-8">
                                    {card.title === 'Créditos Disponíveis' && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Total ganho: {stats.totalEarned} créditos
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}