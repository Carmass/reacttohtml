import React from 'react';
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
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReferralHistory({ referrals }) {
    const getStatusBadge = (status, fraudScore) => {
        if (fraudScore > 70) {
            return (
                <Badge className="bg-red-500 hover:bg-red-600 gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Suspeita de Fraude
                </Badge>
            );
        }

        const config = {
            pending: { 
                label: 'Aguardando', 
                icon: Clock,
                className: 'bg-amber-500 hover:bg-amber-600' 
            },
            valid: { 
                label: 'Validado', 
                icon: CheckCircle,
                className: 'bg-blue-500 hover:bg-blue-600' 
            },
            rewarded: { 
                label: 'Recompensado', 
                icon: CheckCircle,
                className: 'bg-green-500 hover:bg-green-600' 
            },
            invalid: { 
                label: 'Inválido', 
                icon: XCircle,
                className: 'bg-gray-500 hover:bg-gray-600' 
            }
        };

        const { label, icon: Icon, className } = config[status] || config.pending;
        
        return (
            <Badge className={`${className} gap-1`}>
                <Icon className="w-3 h-3" />
                {label}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Indicações</CardTitle>
            </CardHeader>
            <CardContent>
                {referrals.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Nenhuma indicação ainda</h3>
                        <p className="text-gray-600 mb-6">Comece compartilhando seu link de indicação!</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Email Indicado</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Validação</TableHead>
                                    <TableHead className="text-right">Créditos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {referrals.map((referral) => (
                                    <TableRow key={referral.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {referral.referred_email}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-600">
                                                {format(new Date(referral.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(referral.status, referral.fraud_score)}
                                        </TableCell>
                                        <TableCell>
                                            {referral.validation_type === 'first_build' && '✅ Primeiro Build'}
                                            {referral.validation_type === 'paid_subscription' && '💎 Plano Pago'}
                                            {!referral.validation_type && (
                                                <span className="text-gray-400 text-sm">Aguardando</span>
                                            )}
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
                )}
            </CardContent>
        </Card>
    );
}