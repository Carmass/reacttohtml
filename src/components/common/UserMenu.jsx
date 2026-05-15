import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    User, LogOut, Settings, Crown, CreditCard, HelpCircle,
    Zap, DollarSign, ShieldCheck, BookOpen, BarChart3,
    FolderOpen, Gift, Code2, Star,
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function UserMenu({ user }) {
    const isAdmin = user?.role === 'admin';
    const isOwner = user?.data?.is_owner;

    const getPermissionBadge = () => {
        if (isOwner) return <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs">Owner</Badge>;
        if (isAdmin) return <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs">Administrador</Badge>;
        return <Badge variant="outline" className="text-xs">{user?.subscription_plan || 'Free'}</Badge>;
    };

    const initials = (user?.full_name || user?.name || user?.email || 'U')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="flex items-center gap-2">
            <NotificationCenter user={user} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-violet-200 hover:border-violet-400">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64">
                    {/* Header do usuário */}
                    <DropdownMenuLabel className="pb-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.avatar_url} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1 min-w-0">
                                <p className="text-sm font-semibold truncate">
                                    {user?.full_name || user?.name || user?.email?.split('@')[0] || 'Usuário'}
                                </p>
                                {getPermissionBadge()}
                            </div>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    {/* Links para todos os usuários */}
                    <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Compiler')} className="cursor-pointer">
                            <Code2 className="w-4 h-4 mr-2 text-violet-500" />
                            Compilador
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Dashboard')} className="cursor-pointer">
                            <BarChart3 className="w-4 h-4 mr-2 text-violet-500" />
                            Dashboard
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Projects')} className="cursor-pointer">
                            <FolderOpen className="w-4 h-4 mr-2 text-violet-500" />
                            Meus Projetos
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Profile')} className="cursor-pointer">
                            <User className="w-4 h-4 mr-2 text-violet-500" />
                            Perfil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to={createPageUrl('PlanManagement')} className="cursor-pointer">
                            <Crown className="w-4 h-4 mr-2 text-violet-500" />
                            Planos & Upgrade
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Referrals')} className="cursor-pointer">
                            <Gift className="w-4 h-4 mr-2 text-violet-500" />
                            Indicações
                        </Link>
                    </DropdownMenuItem>

                    {/* Links exclusivos de admin/owner */}
                    {(isAdmin || isOwner) && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('Admin')} className="cursor-pointer">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Painel Admin
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('AdminSubscriptions')} className="cursor-pointer">
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Assinaturas
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('StripeSetup')} className="cursor-pointer">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Config. Stripe
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('AdminUserSupport')} className="cursor-pointer">
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    Suporte Usuários
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('AdminReferrals')} className="cursor-pointer">
                                    <Zap className="w-4 h-4 mr-2" />
                                    Indicações (Admin)
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('AdminPayments')} className="cursor-pointer">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Pagamentos
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('AdminTestimonials')} className="cursor-pointer">
                                    <User className="w-4 h-4 mr-2" />
                                    Testemunhos
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('SubmitTestimonial')} className="cursor-pointer">
                                    <Star className="w-4 h-4 mr-2" />
                                    Enviar Testemunho
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to={createPageUrl('AdminBlog')} className="cursor-pointer">
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Gerenciar Blog
                                </Link>
                            </DropdownMenuItem>
                        </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Support')} className="cursor-pointer">
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Suporte
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => base44.auth.logout()}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
