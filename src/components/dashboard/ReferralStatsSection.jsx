import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Gift, Users, Coins, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = { pending: '#f59e0b', valid: '#3b82f6', rewarded: '#10b981', invalid: '#ef4444' };
const STATUS_LABELS = { pending: 'Pendente', valid: 'Válido', rewarded: 'Recompensado', invalid: 'Inválido' };

export default function ReferralStatsSection({ referrals, user }) {
    const refs = referrals || [];

    const pending = refs.filter(r => r.status === 'pending').length;
    const valid = refs.filter(r => r.status === 'valid').length;
    const rewarded = refs.filter(r => r.status === 'rewarded').length;
    const totalCredits = refs.filter(r => r.status === 'rewarded').reduce((sum, r) => sum + (r.reward_amount || 0), 0);

    const statusData = Object.entries(
        refs.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {})
    ).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value, color: STATUS_COLORS[name] || '#8b5cf6' }));

    // Agrupa por mês
    const byMonth = refs.reduce((acc, r) => {
        const month = new Date(r.created_date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});
    const monthData = Object.entries(byMonth).slice(-6).map(([month, count]) => ({ month, count }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Indicações', value: refs.length, icon: Gift, color: 'violet' },
                    { label: 'Pendentes', value: pending, icon: Clock, color: 'yellow' },
                    { label: 'Recompensadas', value: rewarded, icon: Users, color: 'green' },
                    { label: 'Créditos Gerados', value: totalCredits, icon: Coins, color: 'blue' },
                ].map((item) => {
                    const Icon = item.icon;
                    const colorMap = { violet: 'bg-violet-100 text-violet-600', yellow: 'bg-yellow-100 text-yellow-600', green: 'bg-green-100 text-green-600', blue: 'bg-blue-100 text-blue-600' };
                    return (
                        <Card key={item.label}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[item.color]}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                                        <p className="text-xs text-gray-500">{item.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Gift className="w-4 h-4 text-violet-500" />
                            Status das Indicações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhuma indicação registrada</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            Indicações por Mês
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={monthData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Indicações" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhum dado disponível</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Lista de convidados */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        Lista de Convidados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {refs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-500 text-xs">
                                        <th className="pb-2 font-medium">Email Convidado</th>
                                        <th className="pb-2 font-medium">Status</th>
                                        <th className="pb-2 font-medium">Créditos</th>
                                        <th className="pb-2 font-medium">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {refs.slice(0, 10).map(r => (
                                        <tr key={r.id}>
                                            <td className="py-2 text-gray-700">{r.referred_email}</td>
                                            <td className="py-2">
                                                <Badge variant="outline" className={`text-xs ${r.status === 'rewarded' ? 'border-green-300 text-green-700' : r.status === 'pending' ? 'border-yellow-300 text-yellow-700' : r.status === 'valid' ? 'border-blue-300 text-blue-700' : 'border-red-300 text-red-700'}`}>
                                                    {STATUS_LABELS[r.status] || r.status}
                                                </Badge>
                                            </td>
                                            <td className="py-2 text-gray-700">{r.reward_amount || 0}</td>
                                            <td className="py-2 text-gray-400 text-xs">{new Date(r.created_date).toLocaleDateString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {refs.length > 10 && <p className="text-xs text-gray-400 mt-2">Mostrando 10 de {refs.length} indicações</p>}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400 text-sm">Nenhum convidado ainda</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}