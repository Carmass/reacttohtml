import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, HelpCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FAQSection from '../components/support/FAQSection';
import ChatAI from '../components/support/ChatAI';
import TicketForm from '../components/support/TicketForm';
import UserMenu from '../components/common/UserMenu';

export default function Support() {
    const [activeTab, setActiveTab] = useState('faq');

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <HelpCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                    Central de Suporte
                                </h1>
                                <p className="text-sm text-gray-500">Encontre ajuda e suporte técnico</p>
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

            <div className="max-w-6xl mx-auto px-6 py-12">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-white rounded-xl shadow-sm">
                        <TabsTrigger 
                            value="faq" 
                            className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Perguntas Frequentes</span>
                            <span className="sm:hidden">FAQ</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="chat" 
                            className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Chat de Suporte</span>
                            <span className="sm:hidden">Chat</span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="ticket" 
                            className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                        >
                            <Mail className="w-4 h-4" />
                            <span className="hidden sm:inline">Abrir Ticket</span>
                            <span className="sm:hidden">Ticket</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="faq" className="mt-0">
                        <FAQSection />
                    </TabsContent>

                    <TabsContent value="chat" className="mt-0">
                        <ChatAI />
                    </TabsContent>

                    <TabsContent value="ticket" className="mt-0">
                        <TicketForm />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}