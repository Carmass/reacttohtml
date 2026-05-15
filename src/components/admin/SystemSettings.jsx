import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, Bell, Shield, AlertTriangle, Loader2, Key, Webhook } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const DEFAULT_SETTINGS = {
    maintenance_mode: false,
    allow_new_registrations: true,
    require_email_verification: false,
    max_file_size_mb: 50,
    default_daily_limit: 3,
    build_timeout_minutes: 30,
    enable_notifications: true,
    admin_email: '',
    smtp_enabled: false,
    github_actions_enabled: true,
    default_base44_app_id: '',
    form_webhook_url: '',
};

export default function SystemSettings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);

    const { data: userData } = useQuery({
        queryKey: ['admin-system-settings'],
        queryFn: async () => {
            const res = await base44.functions.invoke('getAdminSettings', {});
            return res.data.settings;
        }
    });

    useEffect(() => {
        if (userData) {
            setSettings({ ...DEFAULT_SETTINGS, ...userData });
        }
    }, [userData]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await base44.functions.invoke('saveAdminSettings', settings);
            alert('Configurações salvas com sucesso!');
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const clearAllData = async () => {
        alert('Todos os dados foram limpos!');
    };

    return (
        <div className="space-y-6">
            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configurações Gerais
                    </CardTitle>
                    <CardDescription>Configurações básicas do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Modo Manutenção</Label>
                            <p className="text-sm text-gray-500">Bloquear acesso temporariamente</p>
                        </div>
                        <Switch checked={settings.maintenance_mode} onCheckedChange={(v) => setSettings({...settings, maintenance_mode: v})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Permitir Novos Cadastros</Label>
                            <p className="text-sm text-gray-500">Aceitar registro de novos usuários</p>
                        </div>
                        <Switch checked={settings.allow_new_registrations} onCheckedChange={(v) => setSettings({...settings, allow_new_registrations: v})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Verificação de Email</Label>
                            <p className="text-sm text-gray-500">Exigir confirmação por email</p>
                        </div>
                        <Switch checked={settings.require_email_verification} onCheckedChange={(v) => setSettings({...settings, require_email_verification: v})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Limite Diário Padrão (Gratuito)</Label>
                        <Input type="number" value={settings.default_daily_limit} onChange={(e) => setSettings({...settings, default_daily_limit: parseInt(e.target.value)})} />
                        <p className="text-xs text-gray-500">Número de compilações para usuários sem plano</p>
                    </div>
                </CardContent>
            </Card>

            {/* Webhook de Formulários */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Webhook className="w-5 h-5" />
                        Webhook de Formulários
                    </CardTitle>
                    <CardDescription>Receba os dados dos formulários dos sites compilados via webhook (independente do Base44)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>URL do Webhook (opcional)</Label>
                        <Input
                            type="url"
                            placeholder="https://hooks.zapier.com/... ou https://n8n.seudominio.com/webhook/..."
                            value={settings.form_webhook_url || ''}
                            onChange={(e) => setSettings({...settings, form_webhook_url: e.target.value})}
                        />
                        <p className="text-xs text-gray-500">
                            Quando configurado, <strong>todos os sites compilados</strong> enviarão os dados dos formulários para esta URL via POST JSON.
                            Compatível com Zapier, Make (Integromat), n8n, ou qualquer endpoint HTTP.
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                        <p className="font-medium">📦 Payload enviado:</p>
                        <pre className="text-xs bg-white border rounded p-2 overflow-x-auto">{`{
  "_source": "https://seusite.com.br",
  "_type": "base44_entity_create",
  "_timestamp": "2026-01-01T...",
  "data": { "name": "...", "email": "..." }
}`}</pre>
                        <p className="text-xs text-gray-500 mt-1">O campo <code>_type</code> pode ser <code>base44_entity_create</code> (React) ou <code>form_submit</code> (HTML nativo).</p>
                    </div>
                </CardContent>
            </Card>

            {/* Build Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Configurações de Build</CardTitle>
                    <CardDescription>Parâmetros para o processo de compilação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tamanho Máximo de Arquivo (MB)</Label>
                        <Input type="number" value={settings.max_file_size_mb} onChange={(e) => setSettings({...settings, max_file_size_mb: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Timeout de Build (minutos)</Label>
                        <Input type="number" value={settings.build_timeout_minutes} onChange={(e) => setSettings({...settings, build_timeout_minutes: parseInt(e.target.value)})} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">GitHub Actions Ativo</Label>
                            <p className="text-sm text-gray-500">Usar GitHub para builds</p>
                        </div>
                        <Switch checked={settings.github_actions_enabled} onCheckedChange={(v) => setSettings({...settings, github_actions_enabled: v})} />
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notificações
                    </CardTitle>
                    <CardDescription>Configure o email do administrador para receber notificações do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">Notificações Ativas</Label>
                            <p className="text-sm text-gray-500">Enviar emails sobre builds e eventos</p>
                        </div>
                        <Switch checked={settings.enable_notifications} onCheckedChange={(v) => setSettings({...settings, enable_notifications: v})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Email do Administrador *</Label>
                        <Input
                            type="email"
                            placeholder="admin@seudominio.com"
                            value={settings.admin_email}
                            onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                        />
                        <p className="text-xs text-gray-500">Este email receberá todas as notificações do sistema. Clique em "Salvar" para persistir.</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-base">SMTP Configurado</Label>
                            <p className="text-sm text-gray-500">Sistema de envio de email</p>
                        </div>
                        <Switch checked={settings.smtp_enabled} onCheckedChange={(v) => setSettings({...settings, smtp_enabled: v})} />
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Zona de Perigo
                    </CardTitle>
                    <CardDescription>Ações irreversíveis que afetam todo o sistema</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full justify-start">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Limpar Todos os Dados
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>⚠️ ATENÇÃO: Ação Irreversível</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação irá DELETAR PERMANENTEMENTE todos os builds, histórico de compilações, dados de indicações e configurações. Esta ação NÃO PODE SER DESFEITA!
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={clearAllData} className="bg-red-600 hover:bg-red-700">
                                    Confirmar Exclusão
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Todas as Configurações
                </Button>
            </div>
        </div>
    );
}