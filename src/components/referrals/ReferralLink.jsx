import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReferralLink({ referralLink, referralCode, isLoading }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

    const shareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Compile seus projetos React em HTML',
                    text: 'Use meu link e ganhe créditos grátis!',
                    url: referralLink
                });
            } catch (err) {
                console.error('Erro ao compartilhar:', err);
            }
        } else {
            copyToClipboard(referralLink);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-violet-200">
            <CardHeader>
                <CardTitle>Seu Link de Indicação</CardTitle>
                <CardDescription>
                    Compartilhe este link único e ganhe créditos quando seus amigos se cadastrarem
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Código */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Seu Código Único</label>
                    <div className="flex gap-2">
                        <Input
                            value={referralCode}
                            readOnly
                            className="font-mono text-lg font-bold text-violet-600 bg-violet-50"
                        />
                        <Button
                            onClick={() => copyToClipboard(referralCode)}
                            variant="outline"
                            className="gap-2"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                {/* Link */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Link de Indicação</label>
                    <div className="flex gap-2">
                        <Input
                            value={referralLink}
                            readOnly
                            className="font-mono text-sm"
                        />
                        <Button
                            onClick={() => copyToClipboard(referralLink)}
                            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copiado!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copiar
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Botão Compartilhar */}
                <Button
                    onClick={shareNative}
                    variant="outline"
                    className="w-full h-12 gap-2 border-2 border-violet-300 text-violet-700 hover:bg-violet-50"
                >
                    <Share2 className="w-5 h-5" />
                    Compartilhar em Redes Sociais
                </Button>

                {/* Dica */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                        💡 <strong>Dica:</strong> Compartilhe seu link no WhatsApp, Twitter, LinkedIn ou por email para maximizar suas indicações!
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}