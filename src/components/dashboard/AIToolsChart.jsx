import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles } from 'lucide-react';

const COLORS = [
    '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#a855f7'
];

export default function AIToolsChart({ builds }) {
    // Contar builds por ferramenta AI
    const toolCounts = builds.reduce((acc, build) => {
        const tool = build.ai_tool || 'Não especificado';
        acc[tool] = (acc[tool] || 0) + 1;
        return acc;
    }, {});

    // Converter para array e ordenar por quantidade
    const data = Object.entries(toolCounts)
        .map(([name, count]) => ({
            name: name.split('(')[0].trim(), // Remover URL entre parênteses
            fullName: name,
            count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        Ferramentas AI Mais Usadas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma ferramenta registrada ainda</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    Ferramentas AI Mais Usadas
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                            <p className="font-semibold text-gray-900">
                                                {payload[0].payload.fullName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {payload[0].value} {payload[0].value === 1 ? 'build' : 'builds'}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                {/* Stats Summary */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-violet-50 rounded-lg">
                        <p className="text-2xl font-bold text-violet-600">{data.length}</p>
                        <p className="text-xs text-gray-600">Ferramentas</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{data[0]?.count || 0}</p>
                        <p className="text-xs text-gray-600">Mais Usada</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{builds.length}</p>
                        <p className="text-xs text-gray-600">Total Builds</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}