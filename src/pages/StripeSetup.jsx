import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, ArrowLeft, User, LogOut, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function StripeSetup() {
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: plans = [] } = useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            return await base44.entities.Plan.filter({}, 'price');
        }
    });

    const [priceIds, setPriceIds] = useState({});

    const handleSave = async (planId, priceId) => {
        // Validar se é um Price ID válido
        if (!priceId || !priceId.startsWith('price_')) {
            alert('❌ ID inválido!\n\nVocê deve usar um PRICE ID (começa com price_), não um Product ID (prod_).\n\nVá em Products → Clique no produto → Copie o Price ID da tabela de preços.');
            return;
        }

        setIsSaving(true);
        try {
            await base44.entities.Plan.update(planId, {
                stripe_price_id: priceId
            });
            queryClient.invalidateQueries(['plans']);
            alert('✅ Price ID configurado com sucesso!');
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao atualizar. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const isAdmin = user?.role === 'admin' || user?.data?.is_owner;
    
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                        <p className="text-gray-600 mb-4">Apenas administradores podem acessar esta página.</p>
                        <Link to={createPageUrl('Compiler')}>
                            <Button>Voltar para Home</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                    Configuração Stripe
                                </h1>
                                <p className="text-sm text-gray-500">Configure os Price IDs dos planos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to={createPageUrl('Compiler')}>
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <User className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link to={createPageUrl('Profile')} className="cursor-pointer">
                                            <User className="w-4 h-4 mr-2" />
                                            Perfil
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={() => base44.auth.logout()}
                                        className="cursor-pointer text-red-600"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sair
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
                {/* Instructions */}
                <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-cyan-50/50">
                    <CardHeader>
                        <CardTitle>Como Configurar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Acesse o Stripe Dashboard</h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Faça login em <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                            dashboard.stripe.com <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </p>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                                        <p className="text-sm font-semibold text-red-900 mb-1">🔴 CRÍTICO: Modo Test vs Live</p>
                                        <p className="text-sm text-red-800 mb-2">
                                            Você DEVE usar o mesmo modo (Test ou Live) tanto para:
                                        </p>
                                        <ul className="text-sm text-red-800 space-y-1 ml-4">
                                            <li>• A chave STRIPE_SECRET_KEY (configurada nas variáveis de ambiente)</li>
                                            <li>• Os Price IDs criados no Stripe Dashboard</li>
                                        </ul>
                                        <div className="mt-3 space-y-2">
                                            <p className="text-sm text-red-900 font-semibold">Para modo TEST:</p>
                                            <ul className="text-xs text-red-800 ml-4">
                                                <li>• Ative "Test mode" (toggle no topo do dashboard)</li>
                                                <li>• Use a chave que começa com <code className="bg-white px-1 rounded">sk_test_...</code></li>
                                                <li>• Crie produtos/preços no modo TEST</li>
                                            </ul>
                                        </div>
                                        <div className="mt-2 space-y-2">
                                            <p className="text-sm text-red-900 font-semibold">Para modo LIVE (produção):</p>
                                            <ul className="text-xs text-red-800 ml-4">
                                                <li>• Desative "Test mode"</li>
                                                <li>• Use a chave que começa com <code className="bg-white px-1 rounded">sk_live_...</code></li>
                                                <li>• Crie produtos/preços no modo LIVE</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Crie os Produtos e Preços</h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Vá em <strong>Products</strong> → <strong>Add Product</strong> e crie um produto para cada plano pago
                                    </p>
                                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                        <li>Creator: $3.99/mês</li>
                                        <li>Pro: $9.99/mês</li>
                                        <li>Business: $14.99/mês</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Copie os Price IDs (NÃO o Product ID!)</h3>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            <strong>IMPORTANTE:</strong> Você precisa do <strong>PRICE ID</strong>, não do Product ID!
                                        </p>
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <p className="text-sm font-semibold text-amber-900 mb-1">⚠️ Atenção:</p>
                                            <ul className="text-sm text-amber-800 space-y-1">
                                                <li>✅ <strong>CORRETO:</strong> <code className="bg-white px-1 rounded">price_xxxxxxxxxxxxx</code> (começa com <strong>price_</strong>)</li>
                                                <li>❌ <strong>ERRADO:</strong> <code className="bg-white px-1 rounded">prod_xxxxxxxxxxxxx</code> (começa com prod_)</li>
                                            </ul>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Para encontrar: Clique no produto → Na seção "Pricing" → Copie o ID que aparece na coluna "API ID" da tabela de preços
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                                    4
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Configure o Webhook</h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Em <strong>Developers</strong> → <strong>Webhooks</strong> → <strong>Add Endpoint</strong>
                                    </p>
                                    <div className="bg-gray-900 text-white p-3 rounded-lg text-xs font-mono mb-2">
                                        {window.location.origin}/api/functions/stripeWebhook
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Selecione os eventos: <code className="bg-gray-100 px-1 rounded text-gray-900">invoice.paid</code>, <code className="bg-gray-100 px-1 rounded text-gray-900">invoice.payment_failed</code>, <code className="bg-gray-100 px-1 rounded text-gray-900">customer.subscription.updated</code>, <code className="bg-gray-100 px-1 rounded text-gray-900">customer.subscription.deleted</code>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Plans Configuration */}
                <div className="space-y-6">
                    {/* Free Plan (informativo) */}
                    {plans.filter(p => p.price === 0).length > 0 && (
                        <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {plans.find(p => p.price === 0)?.name}
                                            <Badge className="bg-slate-500 hover:bg-slate-600">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Sem Configuração
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Grátis - {plans.find(p => p.price === 0)?.daily_limit} compilações/dia
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">
                                    ℹ️ O plano free não requer configuração no Stripe, pois não envolve pagamento. Os usuários acessam automaticamente após se registrarem.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Paid Plans */}
                    {plans.filter(p => p.price > 0).map((plan) => {
                        const isConfigured = plan.stripe_price_id && !plan.stripe_price_id.includes('PLACEHOLDER');
                        
                        return (
                            <Card key={plan.id} className={isConfigured ? 'border-green-200' : 'border-amber-200'}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {plan.name}
                                                {isConfigured && (
                                                    <Badge className="bg-green-500 hover:bg-green-600">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Configurado
                                                    </Badge>
                                                )}
                                                {!isConfigured && (
                                                    <Badge className="bg-amber-500 hover:bg-amber-600">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Não Configurado
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                ${plan.price}/mês - {plan.daily_limit} compilações/dia
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Stripe Price ID (começa com "price_")</Label>
                                            <div className="flex gap-2 mt-2">
                                                <Input
                                                    placeholder="price_xxxxxxxxxxxxx"
                                                    defaultValue={isConfigured ? plan.stripe_price_id : ''}
                                                    onChange={(e) => setPriceIds({ ...priceIds, [plan.id]: e.target.value })}
                                                    className={`font-mono text-sm ${priceIds[plan.id] && !priceIds[plan.id].startsWith('price_') ? 'border-red-500' : ''}`}
                                                />
                                                <Button
                                                    onClick={() => handleSave(plan.id, priceIds[plan.id] || plan.stripe_price_id)}
                                                    disabled={isSaving}
                                                >
                                                    Salvar
                                                </Button>
                                            </div>
                                            {priceIds[plan.id] && !priceIds[plan.id].startsWith('price_') && (
                                                <p className="text-xs text-red-600 mt-1">
                                                    ❌ Deve começar com "price_" (você está usando um Product ID!)
                                                </p>
                                            )}
                                        </div>
                                        {isConfigured && (
                                            <div className="text-sm text-green-600 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Este plano está pronto para receber assinaturas
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}