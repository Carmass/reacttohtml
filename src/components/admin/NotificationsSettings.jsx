import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Save, Loader2 } from 'lucide-react';

const NOTIFICATION_EVENTS = [
    { key: 'build_success', label: 'Build concluído com sucesso', category: 'Builds' },
    { key: 'build_failed', label: 'Build com falha', category: 'Builds' },
    { key: 'new_user', label: 'Novo usuário cadastrado', category: 'Usuários' },
    { key: 'account_cancelled', label: 'Conta cancelada', category: 'Usuários' },
    { key: 'storage_limit', label: 'Limite de armazenamento', category: 'Sistema' },
    { key: 'referral_registered', label: 'Indicação cadastrada com sucesso', category: 'Indicações' },
    { key: 'referral_plan_signed', label: 'Indicado assinou um plano', category: 'Indicações' },
    { key: 'referral_reward', label: 'Bonificação por indicação recebida', category: 'Indicações' },
    { key: 'project_created', label: 'Novo projeto criado', category: 'Projetos' },
    { key: 'project_deleted', label: 'Projeto excluído', category: 'Projetos' },
    { key: 'project_file_attached', label: 'Arquivo associado ao projeto', category: 'Projetos' },
    { key: 'deploy_success', label: 'Deploy concluído com sucesso', category: 'Deploy' },
    { key: 'deploy_failed', label: 'Deploy com falha', category: 'Deploy' },
    { key: 'payment_success', label: 'Pagamento efetuado com sucesso', category: 'Pagamentos' },
    { key: 'payment_failed', label: 'Falha no pagamento', category: 'Pagamentos' },
    { key: 'plan_subscribed', label: 'Pedido de assinatura de plano', category: 'Pagamentos' },
    { key: 'plan_cancelled', label: 'Cancelamento de plano', category: 'Pagamentos' },
    { key: 'support_ticket', label: 'Ticket de suporte enviado', category: 'Suporte' },
    { key: 'support_human_request', label: 'Pedido de atendimento humano', category: 'Suporte' },
];

const CATEGORIES = [...new Set(NOTIFICATION_EVENTS.map(e => e.category))];

const DEFAULT_ENABLED = Object.fromEntries(NOTIFICATION_EVENTS.map(e => [e.key, true]));

export default function NotificationsSettings() {
    const [enabled, setEnabled] = useState(DEFAULT_ENABLED);
    const [isSaving, setIsSaving] = useState(false);

    const { data: userData } = useQuery({
        queryKey: ['admin-notification-settings'],
        queryFn: async () => {
            const res = await base44.functions.invoke('getAdminSettings', {});
            return res.data.settings;
        }
    });

    useEffect(() => {
        if (userData?.notification_events) {
            setEnabled({ ...DEFAULT_ENABLED, ...userData.notification_events });
        }
    }, [userData]);

    const handleToggle = (key) => {
        setEnabled(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleToggleCategory = (category, value) => {
        const keys = NOTIFICATION_EVENTS.filter(e => e.category === category).map(e => e.key);
        setEnabled(prev => {
            const next = { ...prev };
            keys.forEach(k => next[k] = value);
            return next;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Mesclar com as configurações existentes
            const currentRes = await base44.functions.invoke('getAdminSettings', {});
            const current = currentRes.data.settings || {};
            await base44.functions.invoke('saveAdminSettings', {
                ...current,
                notification_events: enabled
            });
            alert('Configurações de notificações salvas!');
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const enabledCount = Object.values(enabled).filter(Boolean).length;

    return (
        <div className="space-y-6">
            <Card className="border-violet-200 bg-violet-50">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                        <Bell className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-violet-800">Central de Notificações</p>
                            <p className="text-sm text-violet-700 mt-1">
                                Controle quais eventos geram notificações in-app e emails para o administrador.
                                Configure o email na aba <strong>Sistema</strong>.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{enabledCount} de {NOTIFICATION_EVENTS.length} notificações ativas</p>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEnabled(Object.fromEntries(NOTIFICATION_EVENTS.map(e => [e.key, true])))}>
                        Ativar Todas
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEnabled(Object.fromEntries(NOTIFICATION_EVENTS.map(e => [e.key, false])))}>
                        Desativar Todas
                    </Button>
                </div>
            </div>

            {CATEGORIES.map(category => {
                const events = NOTIFICATION_EVENTS.filter(e => e.category === category);
                const allOn = events.every(e => enabled[e.key]);
                const someOn = events.some(e => enabled[e.key]);

                return (
                    <Card key={category}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{category}</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant={allOn ? 'default' : someOn ? 'secondary' : 'outline'} className="text-xs">
                                        {events.filter(e => enabled[e.key]).length}/{events.length}
                                    </Badge>
                                    <Switch
                                        checked={allOn}
                                        onCheckedChange={(v) => handleToggleCategory(category, v)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {events.map(event => (
                                <div key={event.key} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                                    <label className="text-sm text-gray-700 cursor-pointer" onClick={() => handleToggle(event.key)}>
                                        {event.label}
                                    </label>
                                    <Switch
                                        checked={!!enabled[event.key]}
                                        onCheckedChange={() => handleToggle(event.key)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Configurações
                </Button>
            </div>
        </div>
    );
}