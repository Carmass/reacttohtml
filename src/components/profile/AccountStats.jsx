import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar, Crown, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function AccountStats({ user, totalBuilds, currentPlan }) {
    const stats = [
        {
            label: 'Total de Builds',
            value: totalBuilds,
            icon: Package,
            color: 'from-blue-500 to-cyan-600'
        },
        {
            label: 'Créditos de Indicação',
            value: user?.referral_credits || 0,
            icon: Gift,
            color: 'from-emerald-500 to-green-600'
        },
        {
            label: 'Plano Atual',
            value: currentPlan?.name || 'Gratuito',
            icon: Crown,
            color: 'from-violet-500 to-purple-600'
        },
        {
            label: 'Membro desde',
            value: user?.created_date ? format(new Date(user.created_date), 'MMM/yyyy', { locale: ptBR }) : '-',
            icon: Calendar,
            color: 'from-amber-500 to-orange-600'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </div>
    );
}