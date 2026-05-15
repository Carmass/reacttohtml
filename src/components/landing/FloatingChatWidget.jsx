import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const PLANS_INFO = `
PLANOS DISPONÍVEIS:
1. STARTER: 3 compilações diárias - R$ 9,90/mês
2. CREATOR: 10 compilações diárias - R$ 29,90/mês (MAIS POPULAR)
3. PRO: 50 compilações diárias - R$ 79,90/mês
4. BUSINESS: 100 compilações diárias - R$ 199,90/mês

RECURSOS:
- Suporte por email em todos os planos
- Compilação rápida de React para HTML
- Compatível com qualquer hospedagem
- SEO otimizado

Você pode usar os planos para converter seus projetos React em HTML estático e fazer deploy em qualquer servidor de hospedagem tradicional.
`;

const LANG_GREETINGS = {
    pt: 'Olá! 👋 Sou a Sara, atendente de vendas e suporte da React to HTML. Estou aqui para responder todas as suas dúvidas sobre a plataforma, explicar nossos planos e ajudá-lo a escolher a melhor opção. Como posso ajudá-lo?',
    en: 'Hi! 👋 I\'m Sara, your React to HTML sales and support assistant. I\'m here to answer all your questions about the platform, explain our plans and help you choose the best option. How can I help you?',
    es: '¡Hola! 👋 Soy Sara, asistente de ventas y soporte de React to HTML. Estoy aquí para responder todas tus preguntas sobre la plataforma, explicar nuestros planes y ayudarte a elegir la mejor opción. ¿En qué puedo ayudarte?',
    fr: 'Bonjour ! 👋 Je suis Sara, votre assistante commerciale et support de React to HTML. Je suis ici pour répondre à toutes vos questions sur la plateforme, expliquer nos plans et vous aider à choisir la meilleure option. Comment puis-je vous aider ?',
    de: 'Hallo! 👋 Ich bin Sara, Ihre Vertriebs- und Supportassistentin bei React to HTML. Ich bin hier, um alle Ihre Fragen zur Plattform zu beantworten, unsere Pläne zu erklären und Ihnen zu helfen, die beste Option zu wählen. Wie kann ich Ihnen helfen?',
    zh: '你好！👋 我是 Sara，React to HTML 的销售和支持助手。我在这里回答您关于平台的所有问题，解释我们的计划并帮助您选择最佳选项。我能帮助您什么？',
    ja: 'こんにちは！👋 Sara です。React to HTML のセールス＆サポートアシスタントです。プラットフォームに関するご質問、プランの説明、最適なオプションの選択をお手伝いします。どのようにお手伝いできますか？',
};

export default function FloatingChatWidget({ language = 'en' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentLang, setCurrentLang] = useState(language);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // When language changes, update the greeting message if already initialized
    useEffect(() => {
        if (language !== currentLang) {
            setCurrentLang(language);
            // Update the initial greeting to match the new language
            setMessages(prev => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                updated[0] = {
                    role: 'assistant',
                    content: LANG_GREETINGS[language] || LANG_GREETINGS['en']
                };
                return updated;
            });
        }
    }, [language]);

    const initializeChat = () => {
        if (!isInitialized) {
            setMessages([{
                role: 'assistant',
                content: LANG_GREETINGS[language] || LANG_GREETINGS['en']
            }]);
            setIsInitialized(true);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput('');
        
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage
        }]);

        setIsLoading(true);

        const langInstructions = {
            pt: 'Responda sempre em Português',
            en: 'Always respond in English',
            es: 'Responde siempre en Español',
            fr: 'Répondez toujours en Français',
            de: 'Antworten Sie immer auf Deutsch',
            zh: '始终用中文回答',
            ja: '常に日本語で返答してください',
        };

        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `You are Sara, a professional, friendly sales and support assistant specialized in the React to HTML Compiler platform.

${PLANS_INFO}

Your goals:
1. Help customers with platform questions
2. Explain available plans clearly and persuasively
3. Facilitate sales of plans
4. Be polite, helpful and professional
5. ${langInstructions[language] || langInstructions['en']}

Customer message: "${userMessage}"

Respond concisely, in a friendly and professional manner. If the customer asks about prices or wants to buy a plan, mention the values and suggest clicking the checkout button on the site.`,
                add_context_from_internet: false
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response || 'Desculpe, não consegui processar sua mensagem. Por favor, tente novamente.'
            }]);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Botão Flutuante */}
            <motion.button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) initializeChat();
                }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-6 h-6" />
                )}
            </motion.button>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-40 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-4">
                            <div className="flex items-center gap-3">
                                <img 
                                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                                    alt="Sara" 
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white"
                                />
                                <div>
                                    <h3 className="font-bold text-lg">Sara</h3>
                                    <p className="text-sm text-gray-100">
                                        {language === 'pt' ? 'Vendas e Suporte' :
                                         language === 'es' ? 'Ventas y Soporte' :
                                         language === 'fr' ? 'Ventes et Support' :
                                         language === 'de' ? 'Vertrieb & Support' :
                                         language === 'zh' ? '销售与支持' :
                                         language === 'ja' ? '営業・サポート' :
                                         'Sales & Support'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div 
                            className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96"
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#a78bfa #f3f4f6'
                            }}
                        >
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${
                                        message.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    <div
                                        className={`max-w-xs px-4 py-2 rounded-lg ${
                                            message.role === 'user'
                                                ? 'bg-violet-500 text-white rounded-br-none'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <p className="text-sm text-gray-600">
                                    {language === 'pt' ? 'Sara está respondendo...' :
                                     language === 'es' ? 'Sara está respondiendo...' :
                                     language === 'fr' ? 'Sara répond...' :
                                     language === 'de' ? 'Sara antwortet...' :
                                     language === 'zh' ? 'Sara 正在回复...' :
                                     language === 'ja' ? 'Sara が返信中...' :
                                     'Sara is replying...'}
                                </p>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-gray-200 p-4 flex gap-2">
                            <input
                                type="text"
                                placeholder={
                                    language === 'pt' ? 'Digite sua pergunta...' :
                                    language === 'es' ? 'Escribe tu pregunta...' :
                                    language === 'fr' ? 'Écrivez votre question...' :
                                    language === 'de' ? 'Geben Sie Ihre Frage ein...' :
                                    language === 'zh' ? '输入您的问题...' :
                                    language === 'ja' ? 'ご質問を入力してください...' :
                                    'Type your question...'
                                }
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSendMessage();
                                }}
                                disabled={isLoading}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500 text-sm disabled:bg-gray-100"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isLoading}
                                className="bg-violet-500 hover:bg-violet-600 text-white px-3"
                                size="icon"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}