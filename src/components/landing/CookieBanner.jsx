import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie, Settings, X, Check } from 'lucide-react';
import { base44 } from '@/api/client';

const STORAGE_KEY = 'rth_cookie_consent';

const TEXTS = {
    pt: {
        title: 'Usamos Cookies 🍪',
        desc: 'Utilizamos cookies para melhorar sua experiência, analisar o tráfego e personalizar conteúdo.',
        accept: 'Aceitar Todos',
        reject: 'Rejeitar',
        configure: 'Configurar',
        analytics: 'Cookies de Análise',
        marketing: 'Cookies de Marketing',
        functional: 'Cookies Funcionais (obrigatório)',
        save: 'Salvar Preferências',
    },
    en: {
        title: 'We use Cookies 🍪',
        desc: 'We use cookies to improve your experience, analyze traffic and personalize content.',
        accept: 'Accept All',
        reject: 'Reject',
        configure: 'Configure',
        analytics: 'Analytics Cookies',
        marketing: 'Marketing Cookies',
        functional: 'Functional Cookies (required)',
        save: 'Save Preferences',
    },
    es: {
        title: 'Usamos Cookies 🍪',
        desc: 'Usamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido.',
        accept: 'Aceptar Todos',
        reject: 'Rechazar',
        configure: 'Configurar',
        analytics: 'Cookies de Análisis',
        marketing: 'Cookies de Marketing',
        functional: 'Cookies Funcionales (requerido)',
        save: 'Guardar Preferencias',
    },
    fr: {
        title: 'Nous utilisons des Cookies 🍪',
        desc: 'Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.',
        accept: 'Accepter Tout',
        reject: 'Rejeter',
        configure: 'Configurer',
        analytics: 'Cookies Analytiques',
        marketing: 'Cookies Marketing',
        functional: 'Cookies Fonctionnels (requis)',
        save: 'Sauvegarder',
    },
    de: {
        title: 'Wir verwenden Cookies 🍪',
        desc: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, den Datenverkehr zu analysieren und Inhalte zu personalisieren.',
        accept: 'Alle Akzeptieren',
        reject: 'Ablehnen',
        configure: 'Konfigurieren',
        analytics: 'Analytische Cookies',
        marketing: 'Marketing Cookies',
        functional: 'Funktionale Cookies (erforderlich)',
        save: 'Präferenzen Speichern',
    },
};

function getTexts(lang) {
    return TEXTS[lang] || TEXTS['en'];
}

export default function CookieBanner({ language = 'en', page = 'landing' }) {
    const [visible, setVisible] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    const t = getTexts(language);

    useEffect(() => {
        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing) return;
        const timer = setTimeout(() => setVisible(true), 10000);
        return () => clearTimeout(timer);
    }, []);

    const saveConsent = async (action, analyticsVal, marketingVal) => {
        const consentData = {
            action,
            analytics_cookies: analyticsVal,
            marketing_cookies: marketingVal,
            functional_cookies: true,
            page,
            language,
            user_agent: navigator.userAgent,
            visitor_id: btoa(navigator.userAgent + navigator.language + screen.width + screen.height).substring(0, 32),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ action, analytics: analyticsVal, marketing: marketingVal, date: new Date().toISOString() }));
        setVisible(false);
        setShowConfig(false);
        // Save to DB (non-blocking)
        base44.entities.CookieConsent.create(consentData).catch(() => {});
    };

    const handleAccept = () => saveConsent('accepted', true, true);
    const handleReject = () => saveConsent('rejected', false, false);
    const handleSaveConfig = () => saveConsent('configured', analytics, marketing);

    if (!visible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="fixed bottom-6 left-6 z-50 max-w-sm w-full"
            >
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-3 flex items-center gap-2">
                        <Cookie className="w-5 h-5 text-white" />
                        <span className="text-white font-bold text-sm">{t.title}</span>
                    </div>
                    <div className="p-5">
                        {!showConfig ? (
                            <>
                                <p className="text-sm text-gray-600 mb-4">{t.desc}</p>
                                <div className="flex flex-col gap-2">
                                    <Button onClick={handleAccept} className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 gap-2">
                                        <Check className="w-4 h-4" />{t.accept}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button onClick={handleReject} variant="outline" className="flex-1 gap-2">
                                            <X className="w-4 h-4" />{t.reject}
                                        </Button>
                                        <Button onClick={() => setShowConfig(true)} variant="outline" className="flex-1 gap-2">
                                            <Settings className="w-4 h-4" />{t.configure}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-3 mb-4">
                                    <label className="flex items-center gap-3 cursor-not-allowed opacity-70">
                                        <input type="checkbox" checked disabled className="w-4 h-4 accent-violet-600" />
                                        <span className="text-sm text-gray-700">{t.functional}</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="w-4 h-4 accent-violet-600" />
                                        <span className="text-sm text-gray-700">{t.analytics}</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="w-4 h-4 accent-violet-600" />
                                        <span className="text-sm text-gray-700">{t.marketing}</span>
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => setShowConfig(false)} variant="ghost" size="sm">← Voltar</Button>
                                    <Button onClick={handleSaveConfig} className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                        {t.save}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}