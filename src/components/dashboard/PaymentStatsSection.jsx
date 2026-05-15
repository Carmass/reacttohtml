import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { CreditCard, DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = { paid: '#10b981', open: '#f59e0b', draft: '#8b5cf6', uncollectible: '#ef4444', void: '#6b7280' };
const STATUS_LABELS = { paid: 'Pago', open: 'Em aberto', draft: 'Rascunho', uncollectible: 'Falha', void: 'Cancelado' };

export default function PaymentStatsSection({ invoices, users }) {
    const inv = invoices || [];
    const allUsers = users || [];

    const paid = inv.filter(i => i.status === 'paid');
    const open = inv.filter(i => i.status === 'open');
    const failed = inv.filter(i => i.status === 'uncollectible');

    const totalRevenue = paid.reduce((sum, i) => sum + (i.amount || 0), 0) / 100;
    const pendingRevenue = open.reduce((sum, i) => sum + (i.amount || 0), 0) / 100;

    const statusData = Object.entries(
        inv.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {})
    ).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value, color: STATUS_COLORS[name] || '#8b5cf6' }));

    // Revenue por mês
    const revenueByMonth = paid.reduce((acc, i) => {
        const month = new Date(i.paid_date || i.created_date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + (i.amount || 0) / 100;
        return acc;
    }, {});
    const revenueData = Object.entries(revenueByMonth).slice(-6).map(([month, total]) => ({ month, total: parseFloat(total.toFixed(2)) }));

    // Planos / assinaturas
    const planCounts = inv.reduce((acc, i) => {
        const plan = i.plan_name || 'Sem plano';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
    }, {});
    const planData = Object.entries(planCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Novos usuários por mês
    const usersByMonth = allUsers.reduce((acc, u) => {
        const month = new Date(u.created_date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});
    const usersData = Object.entries(usersByMonth).slice(-6).map(([month, count]) => ({ month, count }));

    const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Receita Total', value: `R$ ${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'green' },
                    { label: 'Pagamentos Feitos', value: paid.length, icon: CreditCard, color: 'blue' },
                    { label: 'Em Andamento', value: open.length, icon: TrendingUp, color: 'yellow' },
                    { label: 'Falhas', value: failed.length, icon: AlertCircle, color: 'red' },
                ].map((item) => {
                    const Icon = item.icon;
                    const colorMap = { green: 'bg-green-100 text-green-600', blue: 'bg-blue-100 text-blue-600', yellow: 'bg-yellow-100 text-yellow-600', red: 'bg-red-100 text-red-600' };
                    return (
                        <Card key={item.label}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[item.color]}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{item.value}</p>
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
                            <DollarSign className="w-4 h-4 text-green-500" />
                            Receita por Mês
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v) => [`R$ ${v}`, 'Receita']} />
                                    <Bar dataKey="total" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhuma receita registrada</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-500" />
                            Status dos Pagamentos
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
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhum pagamento registrado</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-violet-500" />
                            Assinaturas por Plano
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {planData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={planData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                        {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhuma assinatura registrada</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" />
                            Novos Usuários por Mês
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {usersData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={usersData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" name="Novos usuários" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhum dado disponível</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}