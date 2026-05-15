import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Plus, Edit, Trash2, DollarSign, Zap, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function PlanManagement() {
    const [editingPlan, setEditingPlan] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const queryClient = useQueryClient();

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['admin-plans'],
        queryFn: () => base44.entities.Plan.list(),
    });

    const createPlanMutation = useMutation({
        mutationFn: (data) => base44.entities.Plan.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-plans']);
            setShowDialog(false);
            setEditingPlan(null);
            alert('Plano criado com sucesso!');
        },
    });

    const updatePlanMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Plan.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-plans']);
            setShowDialog(false);
            setEditingPlan(null);
            alert('Plano atualizado com sucesso!');
        },
    });

    const deletePlanMutation = useMutation({
        mutationFn: (id) => base44.entities.Plan.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-plans']);
            alert('Plano removido com sucesso!');
        },
    });

    const handleSave = (formData) => {
        if (editingPlan) {
            updatePlanMutation.mutate({ id: editingPlan.id, data: formData });
        } else {
            createPlanMutation.mutate(formData);
        }
    };

    const openDialog = (plan = null) => {
        setEditingPlan(plan);
        setShowDialog(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Gerenciar Planos
                            </CardTitle>
                            <CardDescription>Configure os planos de assinatura disponíveis</CardDescription>
                        </div>
                        <Dialog open={showDialog} onOpenChange={setShowDialog}>
                            <DialogTrigger asChild>
                                <Button onClick={() => openDialog()} className="bg-violet-600 hover:bg-violet-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Novo Plano
                                </Button>
                            </DialogTrigger>
                            <PlanDialog
                                plan={editingPlan}
                                onSave={handleSave}
                                onCancel={() => {
                                    setShowDialog(false);
                                    setEditingPlan(null);
                                }}
                                isSaving={createPlanMutation.isPending || updatePlanMutation.isPending}
                            />
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <Card key={plan.id} className={`relative ${!plan.active ? 'opacity-60' : ''}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span className="text-3xl font-bold">
                                                    {plan.currency === 'brl' ? 'R$' : '$'}{plan.price}
                                                </span>
                                                <span className="text-gray-500 text-sm">/mês</span>
                                            </div>
                                        </div>
                                        <Badge variant={plan.active ? 'default' : 'secondary'}>
                                            {plan.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Zap className="w-4 h-4 text-violet-500" />
                                        <span>{plan.daily_limit} compilações/dia</span>
                                    </div>
                                    {plan.features && plan.features.length > 0 && (
                                        <ul className="space-y-2">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-violet-500 mt-0.5">✓</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="pt-4 flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDialog(plan)}
                                            className="flex-1"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('Deseja realmente remover este plano?')) {
                                                    deletePlanMutation.mutate(plan.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function PlanDialog({ plan, onSave, onCancel, isSaving }) {
    const [formData, setFormData] = useState(plan || {
        name: '',
        price: 0,
        currency: 'usd',
        daily_limit: 10,
        stripe_price_id: '',
        active: true,
        features: []
    });

    const [featureInput, setFeatureInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setFormData({
                ...formData,
                features: [...(formData.features || []), featureInput.trim()]
            });
            setFeatureInput('');
        }
    };

    const removeFeature = (idx) => {
        setFormData({
            ...formData,
            features: formData.features.filter((_, i) => i !== idx)
        });
    };

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle>{plan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
                    <DialogDescription>
                        Configure os detalhes do plano de assinatura
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Plano</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Ex: Básico"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Preço Mensal</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                                placeholder="9.90"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Moeda</Label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                value={formData.currency}
                                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                            >
                                <option value="usd">USD ($)</option>
                                <option value="brl">BRL (R$)</option>
                                <option value="eur">EUR (€)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Limite Diário</Label>
                            <Input
                                type="number"
                                value={formData.daily_limit}
                                onChange={(e) => setFormData({...formData, daily_limit: parseInt(e.target.value)})}
                                placeholder="10"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Stripe Price ID</Label>
                        <Input
                            value={formData.stripe_price_id}
                            onChange={(e) => setFormData({...formData, stripe_price_id: e.target.value})}
                            placeholder="price_xxxxxxxxxxxxx"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Features do Plano</Label>
                        <div className="flex gap-2">
                            <Input
                                value={featureInput}
                                onChange={(e) => setFeatureInput(e.target.value)}
                                placeholder="Digite uma feature"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                            />
                            <Button type="button" onClick={addFeature}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        {formData.features && formData.features.length > 0 && (
                            <ul className="space-y-2 mt-2">
                                {formData.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                        <span className="text-sm">{feature}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFeature(idx)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="active">Plano Ativo</Label>
                        <Switch
                            id="active"
                            checked={formData.active}
                            onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}