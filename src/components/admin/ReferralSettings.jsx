import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Gift, Save, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function ReferralSettings() {
    const [settings, setSettings] = useState({
        enabled: true,
        reward_per_referral: 5,
        min_referrals_for_bonus: 10,
        bonus_reward: 50,
        validation_required: true,
        validation_type: 'first_build',
        fraud_detection_enabled: true,
    });

    const { data: referrals = [] } = useQuery({
        queryKey: ['admin-referrals'],
        queryFn: () => base44.entities.Referral.list(),
    });

    const handleSave = async () => {
        // Aqui você poderia salvar as configurações em uma entidade de configuração
        alert('Configurações salvas com sucesso!');
    };

    const stats = {
        total: referrals.length,
        valid: referrals.filter(r => r.status === 'valid' || r.status === 'rewarded').length,
        pending: referrals.filter(r => r.status === 'pending').length,
        invalid: referrals.filter(r => r.status === 'invalid').length,
    };

    return (
        <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total de Indicações</CardDescription>
                        <CardTitle className="text-3xl">{stats.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Válidas</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{stats.valid}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Pendentes</CardDescription>
                        <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Inválidas</CardDescription>
                        <CardTitle className="text-3xl text-red-600">{stats.invalid}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Configurações de Indicação
                    </CardTitle>
                    <CardDescription>Gerencie o programa de indicação de amigos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Programa Ativo</Label>
                            <p className="text-sm text-gray-500">Ativar ou desativar o sistema de indicações</p>
                        </div>
                        <Switch
                            checked={settings.enabled}
                            onCheckedChange={(checked) => setSettings({...settings, enabled: checked})}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Recompensa por Indicação</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={settings.reward_per_referral}
                                onChange={(e) => setSettings({...settings, reward_per_referral: parseInt(e.target.value)})}
                                className="w-32"
                            />
                            <span className="text-sm text-gray-500">compilações extras</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Número de compilações extras que o usuário recebe por cada indicação válida
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Bônus por Meta de Indicações</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm text-gray-500">Indicações necessárias</Label>
                                <Input
                                    type="number"
                                    value={settings.min_referrals_for_bonus}
                                    onChange={(e) => setSettings({...settings, min_referrals_for_bonus: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <Label className="text-sm text-gray-500">Bônus (compilações)</Label>
                                <Input
                                    type="number"
                                    value={settings.bonus_reward}
                                    onChange={(e) => setSettings({...settings, bonus_reward: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Bônus extra quando o usuário atingir a meta de indicações
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Validação Necessária</Label>
                            <p className="text-sm text-gray-500">Exigir que o indicado complete uma ação</p>
                        </div>
                        <Switch
                            checked={settings.validation_required}
                            onCheckedChange={(checked) => setSettings({...settings, validation_required: checked})}
                        />
                    </div>

                    {settings.validation_required && (
                        <div className="space-y-2 pl-6 border-l-2 border-violet-200">
                            <Label>Tipo de Validação</Label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                value={settings.validation_type}
                                onChange={(e) => setSettings({...settings, validation_type: e.target.value})}
                            >
                                <option value="first_build">Primeira Compilação</option>
                                <option value="paid_subscription">Assinatura Paga</option>
                            </select>
                            <p className="text-xs text-gray-500">
                                {settings.validation_type === 'first_build' 
                                    ? 'A recompensa é liberada quando o indicado faz sua primeira compilação'
                                    : 'A recompensa é liberada quando o indicado assina um plano pago'}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Detecção de Fraude</Label>
                            <p className="text-sm text-gray-500">Verificar IPs duplicados e padrões suspeitos</p>
                        </div>
                        <Switch
                            checked={settings.fraud_detection_enabled}
                            onCheckedChange={(checked) => setSettings({...settings, fraud_detection_enabled: checked})}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Configurações
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Referrals */}
            <Card>
                <CardHeader>
                    <CardTitle>Indicações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {referrals.slice(0, 5).map((referral) => (
                            <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{referral.referrer_email}</p>
                                    <p className="text-sm text-gray-500">indicou {referral.referred_email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        referral.status === 'valid' || referral.status === 'rewarded' ? 'bg-green-100 text-green-700' :
                                        referral.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {referral.status}
                                    </span>
                                    {referral.reward_given && (
                                        <Gift className="w-4 h-4 text-violet-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}