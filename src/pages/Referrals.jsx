import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Gift, ArrowLeft, User, LogOut, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ReferralStats from '../components/referrals/ReferralStats';
import ReferralLink from '../components/referrals/ReferralLink';
import ReferralHistory from '../components/referrals/ReferralHistory';
import ReferralProgress from '../components/referrals/ReferralProgress';
import SocialShareButtons from '../components/referrals/SocialShareButtons';
import UserMenu from '../components/common/UserMenu';

export default function Referrals() {
    const [referralCode, setReferralCode] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: referrals = [] } = useQuery({
        queryKey: ['referrals', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            return await base44.entities.Referral.filter({ referrer_user_id: user.id }, '-created_date');
        },
        enabled: !!user?.id
    });

    useEffect(() => {
        loadReferralCode();
    }, [user]);

    const loadReferralCode = async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const response = await base44.functions.invoke('generateReferralCode', {});
            setReferralCode(response.data.referral_code);
            setReferralLink(response.data.referral_link);
        } catch (error) {
            console.error('Erro ao carregar código:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const validReferrals = referrals.filter(r => r.status === 'valid' || r.status === 'rewarded');
    const stats = {
        total: referrals.length,
        pending: referrals.filter(r => r.status === 'pending').length,
        valid: validReferrals.length,
        credits: user?.data?.referral_credits ?? user?.referral_credits ?? 0,
        totalEarned: referrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0)
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Gift className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    Programa de Indicações
                                </h1>
                                <p className="text-sm text-gray-500">Indique amigos e ganhe créditos grátis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to={createPageUrl('Compiler')}>
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Button>
                            </Link>
                            <UserMenu user={user} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
                {/* Como Funciona */}
                <Card className="border-2 border-violet-100 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-violet-600" />
                            Como Funciona
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-violet-500 text-white flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                                    1
                                </div>
                                <h3 className="font-semibold mb-2">Compartilhe seu link</h3>
                                <p className="text-sm text-gray-600">Envie seu link único para amigos e nas redes sociais</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                                    2
                                </div>
                                <h3 className="font-semibold mb-2">Eles se cadastram</h3>
                                <p className="text-sm text-gray-600">Quando se cadastram pelo seu link, você ganha créditos</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                                    3
                                </div>
                                <h3 className="font-semibold mb-2">Ganhe recompensas</h3>
                                <p className="text-sm text-gray-600">+3 créditos por build ou +10 se assinar plano pago</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <ReferralStats stats={stats} user={user} />

                {/* Progresso e Níveis */}
                <ReferralProgress totalValid={stats.valid} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Link de Indicação */}
                    <ReferralLink 
                        referralLink={referralLink} 
                        referralCode={referralCode}
                        isLoading={isLoading}
                    />

                    {/* Compartilhar em Redes Sociais */}
                    <SocialShareButtons 
                        referralLink={referralLink}
                        referralCode={referralCode}
                    />
                </div>

                {/* Histórico */}
                <ReferralHistory referrals={referrals} />
            </div>
        </div>
    );
}