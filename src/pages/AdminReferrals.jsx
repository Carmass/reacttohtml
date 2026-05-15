import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Shield, TrendingUp, Users, AlertTriangle, ArrowLeft, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminReferrals() {
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: allReferrals = [] } = useQuery({
        queryKey: ['admin-referrals'],
        queryFn: async () => {
            return await base44.entities.Referral.filter({}, '-created_date', 1000);
        },
        enabled: user?.role === 'admin'
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            return await base44.entities.User.filter({}, '-created_date', 1000);
        },
        enabled: user?.role === 'admin'
    });

    if (user?.role !== 'admin') {
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

    const stats = {
        totalReferrals: allReferrals.length,
        validReferrals: allReferrals.filter(r => r.status === 'rewarded' || r.status === 'valid').length,
        fraudSuspect: allReferrals.filter(r => r.fraud_score > 70).length,
        totalCreditsGiven: allReferrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0),
        conversionRate: allReferrals.length > 0 
            ? ((allReferrals.filter(r => r.status === 'rewarded').length / allReferrals.length) * 100).toFixed(1)
            : 0
    };

    // Top referrers
    const referrerStats = {};
    allReferrals.forEach(ref => {
        if (!referrerStats[ref.referrer_email]) {
            referrerStats[ref.referrer_email] = { count: 0, credits: 0 };
        }
        referrerStats[ref.referrer_email].count++;
        referrerStats[ref.referrer_email].credits += ref.reward_amount || 0;
    });

    const topReferrers = Object.entries(referrerStats)
        .map(([email, data]) => ({ email, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                                    Admin - Sistema de Indicações
                                </h1>
                                <p className="text-sm text-gray-500">Painel de controle e monitoramento</p>
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

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total de Indicações</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalReferrals}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Validadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{stats.validReferrals}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conversão</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{stats.conversionRate}%</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Créditos Distribuídos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-600">{stats.totalCreditsGiven}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Suspeitas de Fraude</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">{stats.fraudSuspect}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Referrers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Top 10 Usuários que Mais Indicam
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Posição</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right">Indicações</TableHead>
                                        <TableHead className="text-right">Créditos Ganhos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topReferrers.map((referrer, index) => (
                                        <TableRow key={referrer.email}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                                        index === 0 ? 'bg-yellow-500' :
                                                        index === 1 ? 'bg-gray-400' :
                                                        index === 2 ? 'bg-orange-600' :
                                                        'bg-gray-300 text-gray-700'
                                                    }`}>
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{referrer.email}</TableCell>
                                            <TableCell className="text-right font-semibold">{referrer.count}</TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                +{referrer.credits}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Fraud Logs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Logs de Fraude
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Data</TableHead>
                                        <TableHead>Indicador</TableHead>
                                        <TableHead>Indicado</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Motivos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allReferrals
                                        .filter(r => r.fraud_score > 50)
                                        .slice(0, 20)
                                        .map((referral) => (
                                            <TableRow key={referral.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    {format(new Date(referral.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell className="font-medium">{referral.referrer_email}</TableCell>
                                                <TableCell>{referral.referred_email}</TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        referral.fraud_score > 80 ? 'bg-red-600' :
                                                        referral.fraud_score > 60 ? 'bg-orange-500' :
                                                        'bg-yellow-500'
                                                    }>
                                                        {referral.fraud_score}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-gray-600">
                                                        {referral.fraud_reasons?.join(', ') || 'N/A'}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Todas as Indicações */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Todas as Indicações ({allReferrals.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border border-gray-200 overflow-hidden max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Data</TableHead>
                                        <TableHead>Indicador</TableHead>
                                        <TableHead>Indicado</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Validação</TableHead>
                                        <TableHead className="text-right">Créditos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allReferrals.map((referral) => (
                                        <TableRow key={referral.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                {format(new Date(referral.created_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell className="font-medium">{referral.referrer_email}</TableCell>
                                            <TableCell>{referral.referred_email}</TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    referral.status === 'rewarded' ? 'bg-green-500' :
                                                    referral.status === 'valid' ? 'bg-blue-500' :
                                                    referral.status === 'pending' ? 'bg-amber-500' :
                                                    'bg-gray-500'
                                                }>
                                                    {referral.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {referral.validation_type === 'first_build' && '✅ Build'}
                                                {referral.validation_type === 'paid_subscription' && '💎 Pago'}
                                                {!referral.validation_type && '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {referral.reward_given ? (
                                                    <span className="text-green-600">+{referral.reward_amount}</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}