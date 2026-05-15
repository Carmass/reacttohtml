import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FolderOpen, Share2, Users, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899'];

export default function ProjectStatsSection({ projects, collaborators }) {
    const projs = projects || [];
    const collabs = collaborators || [];

    const withGithub = projs.filter(p => p.github_repo).length;
    const withFtp = projs.filter(p => p.ftp_host).length;
    const withAutoDeploy = projs.filter(p => p.auto_deploy).length;
    const sharedProjects = [...new Set(collabs.map(c => c.project_id))].length;

    // Permission distribution
    const permCounts = collabs.reduce((acc, c) => { acc[c.permission] = (acc[c.permission] || 0) + 1; return acc; }, {});
    const permData = Object.entries(permCounts).map(([name, value]) => ({ name, value }));
    const PERM_LABELS = { view: 'Visualizar', download: 'Download', full: 'Acesso Total' };

    // AI tool usage in projects
    const aiToolCounts = projs.reduce((acc, p) => {
        const tool = p.selected_ai_tool ? p.selected_ai_tool.split('(')[0].trim() : 'Não especificado';
        acc[tool] = (acc[tool] || 0) + 1;
        return acc;
    }, {});
    const aiToolData = Object.entries(aiToolCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Projetos', value: projs.length, icon: FolderOpen, color: 'violet' },
                    { label: 'Com GitHub', value: withGithub, icon: Paperclip, color: 'blue' },
                    { label: 'Com Auto-Deploy', value: withAutoDeploy, icon: Share2, color: 'green' },
                    { label: 'Projetos Compartilhados', value: sharedProjects, icon: Users, color: 'yellow' },
                ].map((item) => {
                    const Icon = item.icon;
                    const colorMap = { violet: 'bg-violet-100 text-violet-600', blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', yellow: 'bg-yellow-100 text-yellow-600' };
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
                            <Share2 className="w-4 h-4 text-blue-500" />
                            Permissões de Compartilhamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {permData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={permData.map(d => ({ ...d, name: PERM_LABELS[d.name] || d.name }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Colaboradores" radius={[4, 4, 0, 0]}>
                                        {permData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhum compartilhamento registrado</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-violet-500" />
                            Ferramentas AI por Projeto
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {aiToolData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={aiToolData} layout="vertical" margin={{ left: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                                    <Tooltip />
                                    <Bar dataKey="count" name="Projetos" radius={[0, 4, 4, 0]}>
                                        {aiToolData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Nenhum projeto com ferramenta AI</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Lista de colaboradores */}
            {collabs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            Colaboradores ({collabs.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-500 text-xs">
                                        <th className="pb-2 font-medium">Colaborador</th>
                                        <th className="pb-2 font-medium">Projeto</th>
                                        <th className="pb-2 font-medium">Permissão</th>
                                        <th className="pb-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {collabs.slice(0, 8).map(c => (
                                        <tr key={c.id}>
                                            <td className="py-2 text-gray-700">{c.collaborator_email}</td>
                                            <td className="py-2 text-gray-500 text-xs">{c.project_name || c.project_id?.slice(0, 8)}</td>
                                            <td className="py-2">
                                                <Badge variant="outline" className="text-xs">{PERM_LABELS[c.permission] || c.permission}</Badge>
                                            </td>
                                            <td className="py-2">
                                                <Badge variant="outline" className={`text-xs ${c.status === 'active' ? 'border-green-300 text-green-700' : c.status === 'pending' ? 'border-yellow-300 text-yellow-700' : 'border-red-300 text-red-700'}`}>
                                                    {c.status === 'active' ? 'Ativo' : c.status === 'pending' ? 'Pendente' : 'Revogado'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}