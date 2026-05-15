import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TicketForm() {
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        priority: 'medium',
        description: ''
    });
    const [status, setStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const user = await base44.auth.me();
            
            const emailBody = `
Nova Solicitação de Suporte

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMAÇÕES DO USUÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: ${user.full_name}
Email: ${user.email}
ID: ${user.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETALHES DO TICKET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assunto: ${formData.subject}
Categoria: ${formData.category}
Prioridade: ${formData.priority === 'high' ? '🔴 Alta' : formData.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formData.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Data/Hora: ${new Date().toLocaleString('pt-BR')}
            `.trim();

            await base44.integrations.Core.SendEmail({
                from_name: 'React Compiler - Suporte',
                to: user.email,
                subject: `[Ticket #${Date.now()}] ${formData.subject}`,
                body: emailBody
            });

            setStatus('success');
            setFormData({
                subject: '',
                category: '',
                priority: 'medium',
                description: ''
            });

            setTimeout(() => setStatus(null), 5000);
        } catch (error) {
            console.error('Erro ao enviar ticket:', error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Card>
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle>Abrir Ticket de Suporte</CardTitle>
                            <CardDescription>
                                Descreva seu problema e nossa equipe entrará em contato por email
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    <AnimatePresence>
                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-green-900">Ticket enviado com sucesso!</p>
                                    <p className="text-sm text-green-700">Você receberá um email de confirmação em breve.</p>
                                </div>
                            </motion.div>
                        )}

                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-red-900">Erro ao enviar ticket</p>
                                    <p className="text-sm text-red-700">Por favor, tente novamente ou use o chat de suporte.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Assunto *</Label>
                            <Input
                                id="subject"
                                placeholder="Ex: Erro ao compilar projeto React"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoria *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="compilation">Problema de Compilação</SelectItem>
                                        <SelectItem value="download">Problema com Download</SelectItem>
                                        <SelectItem value="account">Conta e Perfil</SelectItem>
                                        <SelectItem value="billing">Questão Financeira</SelectItem>
                                        <SelectItem value="feature">Solicitação de Recurso</SelectItem>
                                        <SelectItem value="other">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Prioridade *</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">🟢 Baixa</SelectItem>
                                        <SelectItem value="medium">🟡 Média</SelectItem>
                                        <SelectItem value="high">🔴 Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição do Problema *</Label>
                            <Textarea
                                id="description"
                                placeholder="Descreva detalhadamente o problema que você está enfrentando..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={8}
                                required
                            />
                            <p className="text-xs text-gray-500">
                                Inclua o máximo de detalhes possível: mensagens de erro, passos para reproduzir o problema, etc.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg font-semibold"
                        >
                            {isSubmitting ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Send className="w-5 h-5 mr-2" />
                                    </motion.div>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Enviar Ticket
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                            💡 <strong>Dica:</strong> Para problemas urgentes, use o Chat de Suporte na aba anterior para obter ajuda imediata.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}