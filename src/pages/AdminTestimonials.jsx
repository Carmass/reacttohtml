import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, MessageSquare, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import UserMenu from '../components/common/UserMenu';

export default function AdminTestimonials() {
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        const checkAuth = async () => {
            const currentUser = await base44.auth.me();
            if (!currentUser || currentUser.role !== 'admin') {
                base44.auth.redirectToLogin();
            } else {
                setIsAdmin(true);
                setUser(currentUser);
            }
            setIsAuthChecking(false);
        };
        checkAuth();
    }, []);

    const { data: testimonials = [] } = useQuery({
        queryKey: ['testimonials'],
        queryFn: () => base44.entities.Testimonial.list('-created_date'),
        enabled: isAdmin,
        refetchInterval: 5000
    });

    const handleApprove = async (id) => {
        try {
            await base44.entities.Testimonial.update(id, { status: 'approved' });
            queryClient.invalidateQueries(['testimonials']);
        } catch (error) {
            console.error('Erro ao aprovar testemunho:', error);
        }
    };

    const handleReject = async (id, reason) => {
        const rejection_reason = prompt('Motivo da rejeição (opcional):');
        try {
            await base44.entities.Testimonial.update(id, {
                status: 'rejected',
                rejection_reason
            });
            queryClient.invalidateQueries(['testimonials']);
        } catch (error) {
            console.error('Erro ao rejeitar testemunho:', error);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza que deseja deletar este testemunho?')) {
            try {
                await base44.entities.Testimonial.delete(id);
                queryClient.invalidateQueries(['testimonials']);
            } catch (error) {
                console.error('Erro ao deletar testemunho:', error);
            }
        }
    };

    if (isAuthChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    const pendingCount = testimonials.filter(t => t.status === 'pending').length;
    const approvedCount = testimonials.filter(t => t.status === 'approved').length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Testemunhos</h1>
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

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Description */}
                <div className="mb-8">
                    <p className="text-gray-600">Aprove ou rejeite novos testemunhos para serem exibidos na landing page</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <p className="text-gray-600 text-sm mb-1">Total de Testemunhos</p>
                        <p className="text-3xl font-bold text-gray-900">{testimonials.length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-yellow-200 p-6">
                        <p className="text-yellow-700 text-sm mb-1">Pendentes de Aprovação</p>
                        <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-green-200 p-6">
                        <p className="text-green-700 text-sm mb-1">Aprovados</p>
                        <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                    </div>
                </div>

                {/* Testimonials List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {testimonials.map((testimonial) => (
                            <motion.div
                                key={testimonial.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`bg-white rounded-lg border p-6 ${
                                    testimonial.status === 'approved'
                                        ? 'border-green-200 bg-green-50'
                                        : testimonial.status === 'rejected'
                                        ? 'border-red-200 bg-red-50'
                                        : 'border-yellow-200 bg-yellow-50'
                                }`}
                            >
                                {/* Status Badge */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            testimonial.status === 'approved'
                                                ? 'bg-green-100 text-green-700'
                                                : testimonial.status === 'rejected'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {testimonial.status === 'approved' ? '✓ Aprovado' : 
                                             testimonial.status === 'rejected' ? '✗ Rejeitado' : 
                                             '⏳ Pendente'}
                                        </span>
                                        {testimonial.rating && (
                                            <span className="text-sm text-gray-600">
                                                {'⭐'.repeat(testimonial.rating)}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(testimonial.created_date).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="mb-4">
                                    <p className="text-gray-900 font-medium mb-2">"{testimonial.text}"</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="font-semibold text-gray-900">{testimonial.name}</span>
                                        <span>{testimonial.role}</span>
                                        <span className="text-gray-400">•</span>
                                        <span>{testimonial.company}</span>
                                    </div>
                                </div>

                                {/* Rejection Reason */}
                                {testimonial.rejection_reason && (
                                    <div className="mb-4 p-3 bg-red-100 rounded border border-red-300">
                                        <p className="text-sm text-red-800">
                                            <strong>Motivo da rejeição:</strong> {testimonial.rejection_reason}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                {testimonial.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleApprove(testimonial.id)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Aprovar
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(testimonial.id)}
                                            variant="outline"
                                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Rejeitar
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(testimonial.id)}
                                            variant="ghost"
                                            className="text-red-600 hover:bg-red-50"
                                            size="icon"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                                {testimonial.status !== 'pending' && (
                                    <Button
                                        onClick={() => handleDelete(testimonial.id)}
                                        variant="ghost"
                                        className="text-red-600 hover:bg-red-50"
                                        size="sm"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Deletar
                                    </Button>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {testimonials.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Nenhum testemunho enviado ainda</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}