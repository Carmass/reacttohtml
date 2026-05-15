import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { LayoutDashboard, Save, Palette, Eye } from 'lucide-react';

export default function DashboardCustomization() {
    const [settings, setSettings] = useState({
        app_name: 'React Compiler',
        logo_url: '',
        primary_color: '#8b5cf6',
        secondary_color: '#9333ea',
        show_stats: true,
        show_recent_builds: true,
        show_referrals: true,
        welcome_message: 'Bem-vindo ao React Compiler',
        footer_text: '© 2024 React Compiler. Todos os direitos reservados.',
        enable_dark_mode: false,
        builds_per_page: 10,
    });

    const handleSave = () => {
        // Aqui você salvaria as configurações
        alert('Configurações salvas com sucesso!');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5" />
                        Customização do Dashboard
                    </CardTitle>
                    <CardDescription>Personalize a aparência e comportamento do painel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Branding */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Identidade Visual
                            </h3>
                            
                            <div className="space-y-2">
                                <Label>Nome do Aplicativo</Label>
                                <Input
                                    value={settings.app_name}
                                    onChange={(e) => setSettings({...settings, app_name: e.target.value})}
                                    placeholder="React Compiler"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>URL do Logo</Label>
                                <Input
                                    value={settings.logo_url}
                                    onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-gray-500">Deixe vazio para usar o logo padrão</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cor Primária</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.primary_color}
                                            onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            value={settings.primary_color}
                                            onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                                            placeholder="#8b5cf6"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cor Secundária</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={settings.secondary_color}
                                            onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            value={settings.secondary_color}
                                            onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                                            placeholder="#9333ea"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Display Options */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Opções de Exibição
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Mostrar Estatísticas</Label>
                                        <p className="text-xs text-gray-500">Cards de estatísticas no topo</p>
                                    </div>
                                    <Switch
                                        checked={settings.show_stats}
                                        onCheckedChange={(checked) => setSettings({...settings, show_stats: checked})}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Mostrar Builds Recentes</Label>
                                        <p className="text-xs text-gray-500">Histórico de builds na página inicial</p>
                                    </div>
                                    <Switch
                                        checked={settings.show_recent_builds}
                                        onCheckedChange={(checked) => setSettings({...settings, show_recent_builds: checked})}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Mostrar Sistema de Indicações</Label>
                                        <p className="text-xs text-gray-500">Link para página de referrals</p>
                                    </div>
                                    <Switch
                                        checked={settings.show_referrals}
                                        onCheckedChange={(checked) => setSettings({...settings, show_referrals: checked})}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Modo Escuro</Label>
                                        <p className="text-xs text-gray-500">Ativar tema escuro</p>
                                    </div>
                                    <Switch
                                        checked={settings.enable_dark_mode}
                                        onCheckedChange={(checked) => setSettings({...settings, enable_dark_mode: checked})}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Builds por Página</Label>
                                    <Input
                                        type="number"
                                        value={settings.builds_per_page}
                                        onChange={(e) => setSettings({...settings, builds_per_page: parseInt(e.target.value)})}
                                        min="5"
                                        max="50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Customization */}
                    <div className="space-y-4 pt-6 border-t">
                        <h3 className="text-lg font-semibold">Textos Personalizados</h3>
                        
                        <div className="space-y-2">
                            <Label>Mensagem de Boas-vindas</Label>
                            <Input
                                value={settings.welcome_message}
                                onChange={(e) => setSettings({...settings, welcome_message: e.target.value})}
                                placeholder="Bem-vindo ao React Compiler"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Texto do Rodapé</Label>
                            <Input
                                value={settings.footer_text}
                                onChange={(e) => setSettings({...settings, footer_text: e.target.value})}
                                placeholder="© 2024 React Compiler"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-4 pt-6 border-t">
                        <h3 className="text-lg font-semibold">Prévia</h3>
                        <div 
                            className="p-6 rounded-lg border-2"
                            style={{
                                background: `linear-gradient(135deg, ${settings.primary_color}15 0%, ${settings.secondary_color}15 100%)`
                            }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div 
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                    style={{ background: settings.primary_color }}
                                >
                                    RC
                                </div>
                                <h2 className="text-xl font-bold">{settings.app_name}</h2>
                            </div>
                            <p className="text-gray-700 mb-4">{settings.welcome_message}</p>
                            <div className="flex gap-2">
                                <Button style={{ background: settings.primary_color }} className="text-white">
                                    Botão Primário
                                </Button>
                                <Button style={{ background: settings.secondary_color }} className="text-white">
                                    Botão Secundário
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t">
                        <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Configurações
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}