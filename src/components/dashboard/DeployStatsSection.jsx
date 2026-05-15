import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UploadCloud, CheckCircle2, XCircle, Server } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#06b6d4'];

const HOSTING_KEYWORDS = [
    { name: 'Hostgator', keys: ['hostgator'] },
    { name: 'Hostinger', keys: ['hostinger'] },
    { name: 'GoDaddy', keys: ['godaddy', 'secureserver'] },
    { name: 'Locaweb', keys: ['locaweb'] },
    { name: 'KingHost', keys: ['kinghost'] },
    { name: 'UOL Host', keys: ['uolhost'] },
    { name: 'Amazon/AWS', keys: ['aws', 'amazon', 'amazonaws'] },
    { name: 'DigitalOcean', keys: ['digitalocean'] },
    { name: 'Netlify', keys: ['netlify'] },
    { name: 'Vercel', keys: ['vercel'] },
];

function detectHosting(host) {
    if (!host) return 'Outros';
    const lower = host.toLowerCase();
    for (const h of HOSTING_KEYWORDS) {
        if (h.keys.some(k => lower.includes(k))) return h.name;
    }
    return 'Outros';
}

export default function DeployStatsSection({ deployments }) {
    const deploys = deployments || [];

    const successCount = deploys.filter(d => d.status === 'success').length;
    const failedCount = deploys.filter(d => d.status === 'failed').length;
    const pushingCount = deploys.filter(d => d.status === 'pushing').length;
    const queuedCount = deploys.filter(d => d.status === 'queued').length;

    const statusData = [
        { name: 'Sucesso', value: successCount, color: '#10b981' },
        { name: 'Falha', value: failedCount, color: '#ef4444' },
        { name: 'Em andamento', value: pushingCount, color: '#f59e0b' },
        { name: 'Na fila', value: queuedCount, color: '#8b5cf6' },
    ].filter(d => d.value > 0);

    // Hosting distribution
    const hostingCounts = {};
    deploys.forEach(d => {
        const hosting = detectHosting(d.repository_name || d.repository_url || '');
        hostingCounts[hosting] = (hostingCounts[hosting] || 0) + 1;
    });
    const hostingData = Object.entries(hostingCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Deploys', value: deploys.length, icon: UploadCloud, color: 'violet' },
                    { label: 'Bem-sucedidos', value: successCount, icon: CheckCircle2, color: 'green' },
                    { label: 'Falhas', value: failedCount, icon: XCircle, color: 'red' },
                    { label: 'Taxa de Sucesso', value: deploys.length > 0 ? `${((successCount / deploys.length) * 100).toFixed(1)}%` : '0%', icon: Server, color: 'blue' },
                ].map((item) => {
                    const Icon = item.icon;
                    const colorMap = { violet: 'bg-violet-100 text-violet-600', green: 'bg-green-100 text-green-600', red: 'bg-red-100 text-red-600', blue: 'bg-blue-100 text-blue-600' };
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
                            <UploadCloud className="w-4 h-4 text-violet-500" />
                            Status dos Deploys
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhum deploy registrado</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Server className="w-4 h-4 text-blue-500" />
                            Deploys por Hospedagem
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {hostingData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={hostingData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Deploys" radius={[0, 4, 4, 0]}>
                                        {hostingData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhum dado de hospedagem disponível</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}