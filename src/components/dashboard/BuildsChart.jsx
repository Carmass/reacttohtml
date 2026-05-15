import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuildsChart({ builds }) {
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

    const chartData = useMemo(() => {
        if (!builds || builds.length === 0) return [];

        // Filtrar por range
        const now = new Date();
        const filteredBuilds = builds.filter(build => {
            if (timeRange === 'all') return true;
            const buildDate = new Date(build.created_date);
            const daysAgo = timeRange === '7d' ? 7 : 30;
            const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            return buildDate >= cutoffDate;
        });

        // Agrupar por dia
        const groupedByDay = {};
        filteredBuilds.forEach(build => {
            const date = new Date(build.created_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit'
            });
            
            if (!groupedByDay[date]) {
                groupedByDay[date] = { date, total: 0, completed: 0, failed: 0, processing: 0 };
            }
            
            groupedByDay[date].total++;
            if (build.status === 'completed') groupedByDay[date].completed++;
            if (build.status === 'failed') groupedByDay[date].failed++;
            if (build.status === 'processing') groupedByDay[date].processing++;
        });

        return Object.values(groupedByDay).sort((a, b) => {
            const [dayA, monthA] = a.date.split('/');
            const [dayB, monthB] = b.date.split('/');
            return new Date(2024, monthA - 1, dayA) - new Date(2024, monthB - 1, dayB);
        });
    }, [builds, timeRange]);

    const totalInPeriod = chartData.reduce((sum, day) => sum + day.total, 0);
    const avgPerDay = chartData.length > 0 ? (totalInPeriod / chartData.length).toFixed(1) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-violet-500" />
                                Tendências de Compilação
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {totalInPeriod} builds no período • Média de {avgPerDay} por dia
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={timeRange === '7d' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTimeRange('7d')}
                            >
                                7 dias
                            </Button>
                            <Button
                                variant={timeRange === '30d' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTimeRange('30d')}
                            >
                                30 dias
                            </Button>
                            <Button
                                variant={timeRange === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTimeRange('all')}
                            >
                                Todos
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis 
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCompleted)"
                                    name="Concluídos"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="failed"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorFailed)"
                                    name="Falhados"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    name="Total"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Nenhum dado disponível para o período selecionado</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}