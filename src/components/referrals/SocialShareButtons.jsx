import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Check } from 'lucide-react';

export default function SocialShareButtons({ referralLink, referralCode }) {
    const [copied, setCopied] = useState('');

    const shareText = `🚀 Compile seus projetos React em HTML estático gratuitamente!\n\nUse meu código ${referralCode} e ganhe créditos extras no cadastro.\n\nExperimente agora: ${referralLink}`;

    const socialPlatforms = [
        {
            name: 'WhatsApp',
            icon: '💬',
            url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
            color: 'bg-green-500 hover:bg-green-600'
        },
        {
            name: 'Twitter',
            icon: '𝕏',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
            color: 'bg-black hover:bg-gray-900'
        },
        {
            name: 'LinkedIn',
            icon: '💼',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
            color: 'bg-blue-600 hover:bg-blue-700'
        },
        {
            name: 'Facebook',
            icon: '👍',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
            color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            name: 'Telegram',
            icon: '✈️',
            url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
            color: 'bg-sky-500 hover:bg-sky-600'
        },
        {
            name: 'Email',
            icon: '📧',
            url: `mailto:?subject=${encodeURIComponent('Compile projetos React grátis')}&body=${encodeURIComponent(shareText)}`,
            color: 'bg-gray-600 hover:bg-gray-700'
        }
    ];

    const copyShareText = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied('text');
            setTimeout(() => setCopied(''), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Compartilhar em Redes Sociais
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Texto para copiar */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{shareText}</p>
                    <Button
                        onClick={copyShareText}
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                    >
                        {copied === 'text' ? (
                            <>
                                <Check className="w-4 h-4 text-green-600" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                📋 Copiar Texto
                            </>
                        )}
                    </Button>
                </div>

                {/* Botões de compartilhamento */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {socialPlatforms.map((platform) => (
                        <Button
                            key={platform.name}
                            onClick={() => window.open(platform.url, '_blank', 'width=600,height=400')}
                            className={`${platform.color} text-white gap-2 h-12`}
                        >
                            <span className="text-xl">{platform.icon}</span>
                            <span className="hidden sm:inline">{platform.name}</span>
                        </Button>
                    ))}
                </div>

                {/* Dica */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900">
                        💡 <strong>Dica:</strong> Compartilhe em grupos do WhatsApp, stories do Instagram e posts no LinkedIn para alcançar mais pessoas!
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}