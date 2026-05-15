import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatAI() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Olá! 👋 Sou seu assistente virtual. Posso ajudá-lo com dúvidas sobre compilação de projetos React, histórico de builds, gestão de conta e muito mais. Como posso ajudar?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const systemPrompt = `Você é um assistente virtual especializado em suporte técnico para o "React to HTML Compiler".

Informações sobre o aplicativo:
- É uma plataforma que compila projetos React em HTML estático
- Os usuários fazem upload de arquivos ZIP contendo projetos React
- A compilação é feita via GitHub Actions e leva 2-5 minutos
- Usuários podem ver histórico, estatísticas e recompilar projetos
- Dashboard mostra métricas: builds totais, concluídos, falhados, tempo médio
- Perfil permite editar dados pessoais, foto e excluir conta
- Filtros disponíveis: status (concluído/processando/falhado) e período de datas
- Suporte via FAQ, chat AI e tickets por email

Suas responsabilidades:
1. Responder dúvidas sobre funcionalidades do app
2. Guiar usuários em processos (upload, compilação, download)
3. Ajudar com troubleshooting de erros
4. Explicar recursos do dashboard e histórico
5. Orientar sobre gestão de conta

Estilo de comunicação:
- Seja amigável, claro e objetivo
- Use emojis moderadamente para tornar mais acessível
- Forneça respostas em português do Brasil
- Sugira ações práticas quando relevante
- Se não souber algo específico, seja honesto e sugira abrir um ticket

Pergunta do usuário: ${userMessage}

Forneça uma resposta útil e completa.`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: systemPrompt,
                add_context_from_internet: false
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            console.error('Erro ao consultar AI:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: '⚠️ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou abra um ticket de suporte.'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-violet-600" />
                    Assistente Virtual
                </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                                        message.role === 'user'
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {message.content}
                                    </p>
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                            </div>
                        </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Digite sua pergunta..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}