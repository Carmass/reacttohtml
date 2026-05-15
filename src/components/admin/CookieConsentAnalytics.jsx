import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Cookie, CheckCircle, XCircle, Settings, Globe, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = { accepted: '#10b981', rejected: '#ef4444', configured: '#f59e0b' };

export default function CookieConsentAnalytics() {
    const { data: consents = [], isLoading } = useQuery({
        queryKey: ['cookie-consents'],
        queryFn: () => base44.entities.CookieConsent.list('-created_date', 1000),
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    const total = consents.length;
    const accepted = consents.filter(c => c.action === 'accepted').length;
    const rejected = consents.filter(c => c.action === 'rejected').length;
    const configured = consents.filter(c => c.action === 'configured').length;
    const analyticsAccepted = consents.filter(c => c.analytics_cookies).length;
    const marketingAccepted = consents.filter(c => c.marketing_cookies).length;

    const pieData = [
        { name: 'Aceitaram', value: accepted, color: COLORS.accepted },
        { name: 'Rejeitaram', value: rejected, color: COLORS.rejected },
        { name: 'Configuraram', value: configured, color: COLORS.configured },
    ].filter(d => d.value > 0);

    // By day (last 14 days)
    const byDay = {};
    consents.forEach(c => {
        const day = format(new Date(c.created_date), 'dd/MM', { locale: ptBR });
        if (!byDay[day]) byDay[day] = { day, accepted: 0, rejected: 0, configured: 0 };
        byDay[day][c.action] = (byDay[day][c.action] || 0) + 1;
    });
    const dailyData = Object.values(byDay).slice(-14);

    // By page
    const byPage = {};
    consents.forEach(c => {
        const p = c.page || 'unknown';
        byPage[p] = (byPage[p] || 0) + 1;
    });
    const pageData = Object.entries(byPage).map(([name, value]) => ({ name, value }));

    // By language
    const byLang = {};
    consents.forEach(c => {
        const l = c.language || 'unknown';
        byLang[l] = (byLang[l] || 0) + 1;
    });
    const langData = Object.entries(byLang).map(([name, value]) => ({ name: name.toUpperCase(), value }));

    const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Cookie, label: 'Total de Visitas', value: total, color: 'bg-violet-100 text-violet-600' },
                    { icon: CheckCircle, label: 'Aceitaram', value: accepted, color: 'bg-green-100 text-green-600' },
                    { icon: XCircle, label: 'Rejeitaram', value: rejected, color: 'bg-red-100 text-red-600' },
                    { icon: TrendingUp, label: 'Taxa de Aceitação', value: `${acceptRate}%`, color: 'bg-blue-100 text-blue-600' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <Card key={label}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Cookie types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Cookies de Análise Aceitos</p>
                                <p className="text-2xl font-bold text-gray-900">{analyticsAccepted} <span className="text-sm text-gray-400">/ {total}</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Cookies de Marketing Aceitos</p>
                                <p className="text-2xl font-bold text-gray-900">{marketingAccepted} <span className="text-sm text-gray-400">/ {total}</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                {pieData.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Distribuição de Consentimentos</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* By language */}
                {langData.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Por Idioma</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={langData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Daily chart */}
            {dailyData.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Consentimentos por Dia (últimos 14 dias)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="accepted" name="Aceitos" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="rejected" name="Rejeitados" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="configured" name="Configurados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Recent records */}
            <Card>
                <CardHeader><CardTitle>Registros Recentes</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left">
                                    <th className="pb-3 text-gray-500 font-medium">Data</th>
                                    <th className="pb-3 text-gray-500 font-medium">Ação</th>
                                    <th className="pb-3 text-gray-500 font-medium">Página</th>
                                    <th className="pb-3 text-gray-500 font-medium">Idioma</th>
                                    <th className="pb-3 text-gray-500 font-medium">Análise</th>
                                    <th className="pb-3 text-gray-500 font-medium">Marketing</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {consents.slice(0, 20).map(c => (
                                    <tr key={c.id}>
                                        <td className="py-3 text-gray-600">{format(new Date(c.created_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                c.action === 'accepted' ? 'bg-green-100 text-green-700' :
                                                c.action === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {c.action === 'accepted' ? 'Aceito' : c.action === 'rejected' ? 'Rejeitado' : 'Configurado'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-gray-600">{c.page || '-'}</td>
                                        <td className="py-3 text-gray-600">{c.language?.toUpperCase() || '-'}</td>
                                        <td className="py-3">{c.analytics_cookies ? '✅' : '❌'}</td>
                                        <td className="py-3">{c.marketing_cookies ? '✅' : '❌'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}