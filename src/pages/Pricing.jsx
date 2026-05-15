import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, X, Zap, Code2, Sparkles, Info, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../components/landing/translations';
import LanguageSwitcher from '../components/landing/LanguageSwitcher';
import FloatingChatWidget from '../components/landing/FloatingChatWidget';
import { useLanguage } from '../components/common/useLanguage';
import CookieBanner from '../components/landing/CookieBanner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function Pricing() {
    const [language, changeLanguage] = useLanguage();
    const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const t = translations[language] || translations['en'];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const handlePlanAction = async (planName) => {
        // Planos pagos: redirecionar direto ao Stripe checkout
        if (planName === 'Creator' || planName === 'Pro' || planName === 'Business') {
            try {
                const response = await base44.functions.invoke('createPublicCheckoutSession', {
                    plan_name: planName
                });
                
                if (response.data.url) {
                    window.location.href = response.data.url;
                } else {
                    alert('Erro ao criar sessão de pagamento. Tente novamente.');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao processar pagamento. Tente novamente.');
            }
        } else {
            // Plano Starter: redirecionar para Compiler
            try {
                const isAuth = await base44.auth.isAuthenticated();
                if (!isAuth) {
                    base44.auth.redirectToLogin(createPageUrl('Compiler'));
                } else {
                    window.location.href = createPageUrl('Compiler');
                }
            } catch {
                base44.auth.redirectToLogin(createPageUrl('Compiler'));
            }
        }
    };

    const planDetails = {
        Starter: {
            compilations: '3',
            description: t.pricingPage?.starter?.description || 'Perfeito para começar e testar a plataforma sem compromisso.',
            features: t.pricingPage?.starter?.features || [
                '3 compilações diárias',
                'Conversão React → HTML',
                'Otimização automática',
                'Suporte por email',
                'Sem limite de projetos'
            ],
            notIncluded: t.pricingPage?.starter?.notIncluded || [
                'Deploy automático',
                'Suporte prioritário'
            ],
            idealFor: t.pricingPage?.starter?.idealFor || 'Ideal para: Testes, projetos pequenos, desenvolvedores iniciantes'
        },
        Creator: {
            compilations: '10',
            description: t.pricingPage?.creator?.description || 'Plano mais popular! Ideal para freelancers e pequenos projetos.',
            features: t.pricingPage?.creator?.features || [
                '10 compilações diárias',
                'Conversão React → HTML',
                'Otimização avançada',
                'Suporte por email',
                'Deploy FTP/SFTP integrado',
                'Projetos ilimitados',
                'Histórico de builds'
            ],
            notIncluded: t.pricingPage?.creator?.notIncluded || [
                'Suporte prioritário 24/7'
            ],
            idealFor: t.pricingPage?.creator?.idealFor || 'Ideal para: Freelancers, agências pequenas, projetos pessoais'
        },
        Pro: {
            compilations: '50',
            description: t.pricingPage?.pro?.description || 'Para profissionais que precisam de mais volume e recursos avançados.',
            features: t.pricingPage?.pro?.features || [
                '50 compilações diárias',
                'Tudo do Creator +',
                'Deploy automático após build',
                'Múltiplos destinos de deploy',
                'Otimização premium',
                'GitHub Pages integrado',
                'Suporte prioritário',
                'API de acesso'
            ],
            notIncluded: [],
            idealFor: t.pricingPage?.pro?.idealFor || 'Ideal para: Desenvolvedores profissionais, agências médias, SaaS'
        },
        Business: {
            compilations: '100',
            description: t.pricingPage?.business?.description || 'Máximo poder para empresas e times que precisam de alta demanda.',
            features: t.pricingPage?.business?.features || [
                '100 compilações diárias',
                'Tudo do Pro +',
                'Suporte dedicado 24/7',
                'SLA garantido',
                'Customizações avançadas',
                'Múltiplos usuários (time)',
                'Webhooks personalizados',
                'Consultoria técnica'
            ],
            notIncluded: [],
            idealFor: t.pricingPage?.business?.idealFor || 'Ideal para: Empresas, grandes agências, times de desenvolvimento'
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <a href="https://reacttohtml.com/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Code2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold">React to HTML</span>
                        </a>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-4">
                            <LanguageSwitcher currentLang={language} onLanguageChange={changeLanguage} />
                            <Link to={createPageUrl('Landing')}>
                                <Button variant="ghost" className="gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Home
                                </Button>
                            </Link>
                            <Link to={createPageUrl('Compiler')}>
                                <Button variant="ghost">{t.nav?.login || 'Login'}</Button>
                            </Link>
                            <Link to={createPageUrl('Compiler')}>
                                <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                    {t.nav?.startFree || '🚀 Start Free'}
                                </Button>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-3">
                            <LanguageSwitcher currentLang={language} onLanguageChange={changeLanguage} />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:hidden border-t border-gray-200 mt-4 pt-4 space-y-2"
                            >
                                <Link to={createPageUrl('Landing')} onClick={() => setMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Home
                                    </Button>
                                </Link>
                                <Link to={createPageUrl('Compiler')} onClick={() => setMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start">
                                        {t.nav?.login || 'Login'}
                                    </Button>
                                </Link>
                                <Link to={createPageUrl('Compiler')} onClick={() => setMenuOpen(false)}>
                                    <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                        {t.nav?.startFree || '🚀 Start Free'}
                                    </Button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Hero Banner */}
            <section className="py-16 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="inline-block">
                            <div className="bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-full px-6 py-2 inline-flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-violet-600" />
                                <span className="text-violet-700 font-semibold">{t.pricingPage?.badge || 'Planos Simples e Transparentes'}</span>
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                            {t.pricingPage?.title || 'Converta React em HTML'}<br />
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                {t.pricingPage?.titleHighlight || 'Hospede nos Seus Servidores'}
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            {t.pricingPage?.subtitle || 'Transforme seus projetos React em HTML estático e faça deploy em qualquer servidor FTP, cPanel ou hospedagem compartilhada. Sem VPS, sem Node.js, sem complicação.'}
                        </p>
                        
                        {/* Benefícios principais */}
                        <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                <span className="text-gray-700 font-medium">{t.pricingPage?.benefit1 || 'Sem VPS necessário'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                <span className="text-gray-700 font-medium">{t.pricingPage?.benefit2 || 'Deploy em segundos'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                <span className="text-gray-700 font-medium">{t.pricingPage?.benefit3 || 'Hospedagem barata'}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Plans Comparison */}
            <section className="pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {Object.entries(planDetails).map(([planName, details], index) => (
                            <motion.div
                                key={planName}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative bg-white rounded-2xl p-8 border-2 ${
                                    planName === 'Creator'
                                        ? 'border-violet-500 shadow-2xl scale-105 z-10'
                                        : 'border-gray-200 hover:border-violet-300 hover:shadow-lg'
                                } transition-all duration-300`}
                            >
                                {planName === 'Creator' && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
                                            <Zap className="w-4 h-4" />
                                            {t.plans?.mostPopular || 'Mais Popular'}
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{planName}</h3>
                                    <div className="text-5xl font-bold text-gray-900 mb-1">
                                        {details.compilations}
                                    </div>
                                    <div className="text-gray-600">{t.plans?.daily || 'compilações diárias'}</div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {details.features.slice(0, 4).map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => setSelectedPlanDetails({ name: planName, ...details })}
                                    variant="outline"
                                    className="w-full mb-3"
                                >
                                    <Info className="w-4 h-4 mr-2" />
                                    {t.pricingPage?.learnMore || 'Saiba Mais'}
                                </Button>

                                <Button
                                    onClick={() => handlePlanAction(planName)}
                                    className={`w-full ${
                                        planName === 'Creator'
                                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
                                            : ''
                                    }`}
                                    variant={planName === 'Creator' ? 'default' : 'outline'}
                                >
                                    {t.plans?.getStarted || 'Começar'}
                                </Button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Comparison Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200"
                    >
                        <div className="p-8 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-center">
                            <h2 className="text-3xl font-bold mb-2">{t.pricingPage?.comparisonTitle || 'Comparação Completa'}</h2>
                            <p className="text-violet-100">{t.pricingPage?.comparisonSubtitle || 'Veja todos os recursos lado a lado'}</p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t.pricingPage?.feature || 'Recurso'}</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Starter</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-violet-600 bg-violet-50">Creator</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Pro</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Business</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {[
                                        { feature: t.pricingPage?.dailyBuilds || 'Builds Diários', values: ['3', '10', '50', '100'] },
                                        { feature: t.pricingPage?.htmlConversion || 'Conversão HTML', values: [true, true, true, true] },
                                        { feature: t.pricingPage?.ftpDeploy || 'Deploy FTP/SFTP', values: [false, true, true, true] },
                                        { feature: t.pricingPage?.autoDeploy || 'Deploy Automático', values: [false, false, true, true] },
                                        { feature: t.pricingPage?.githubPages || 'GitHub Pages', values: [false, false, true, true] },
                                        { feature: t.pricingPage?.multiDest || 'Múltiplos Destinos', values: [false, false, true, true] },
                                        { feature: t.pricingPage?.prioritySupport || 'Suporte Prioritário', values: [false, false, true, true] },
                                        { feature: t.pricingPage?.sla || 'SLA Garantido', values: [false, false, false, true] },
                                        { feature: t.pricingPage?.teamUsers || 'Múltiplos Usuários', values: [false, false, false, true] },
                                    ].map((row, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.feature}</td>
                                            {row.values.map((value, vIdx) => (
                                                <td key={vIdx} className={`px-6 py-4 text-center ${vIdx === 1 ? 'bg-violet-50/50' : ''}`}>
                                                    {typeof value === 'boolean' ? (
                                                        value ? (
                                                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                                                        ) : (
                                                            <X className="w-6 h-6 text-gray-300 mx-auto" />
                                                        )
                                                    ) : (
                                                        <span className="text-sm font-semibold text-gray-900">{value}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Before Footer */}
            <section className="py-20 bg-gradient-to-br from-violet-500 to-purple-600">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        {t.finalCTA?.title || 'What are you waiting for?'}
                    </h2>
                    <p className="text-xl text-violet-100 mb-8">
                        {t.finalCTA?.subtitle || 'Publish your React project on your shared hosting right now!'}
                    </p>
                    <Link to={createPageUrl('Compiler')}>
                        <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 text-lg h-14 px-10 shadow-xl">
                            {t.finalCTA?.button || 'Start Free'}
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <Code2 className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold">React to HTML</span>
                            </div>
                            <p className="text-gray-400 text-sm">{t.footer?.description}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">{t.footer?.product}</h3>
                            <ul className="space-y-2">
                                <li><Link to={createPageUrl('Compiler')} className="text-gray-400 hover:text-white text-sm">{t.footer?.compiler}</Link></li>
                                <li><Link to={createPageUrl('Dashboard')} className="text-gray-400 hover:text-white text-sm">{t.footer?.dashboard}</Link></li>
                                <li><Link to={createPageUrl('Pricing')} className="text-gray-400 hover:text-white text-sm">{t.footer?.pricing}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">{t.footer?.resources}</h3>
                            <ul className="space-y-2">
                                <li><a href="#faq" className="text-gray-400 hover:text-white text-sm">{t.footer?.faq}</a></li>
                                <li><Link to={createPageUrl('Support')} className="text-gray-400 hover:text-white text-sm">{t.footer?.support}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">{t.footer?.company}</h3>
                            <ul className="space-y-2">
                                <li><Link to={createPageUrl('Profile')} className="text-gray-400 hover:text-white text-sm">{t.footer?.account}</Link></li>
                                <li><Link to={createPageUrl('Referrals')} className="text-gray-400 hover:text-white text-sm">{t.footer?.referral}</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
                        © 2024 React to HTML Compiler. {t.footer?.rights}
                    </div>
                </div>
            </footer>

            {/* Plan Details Dialog */}
            <Dialog open={!!selectedPlanDetails} onOpenChange={() => setSelectedPlanDetails(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    {selectedPlanDetails && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold">{selectedPlanDetails.name}</DialogTitle>
                                <DialogDescription className="text-lg">
                                    {selectedPlanDetails.description}
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
                                    <div className="text-center">
                                        <div className="text-6xl font-bold text-gray-900 mb-2">
                                            {selectedPlanDetails.compilations}
                                        </div>
                                        <div className="text-gray-600 text-lg">{t.plans?.daily || 'compilações diárias'}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                                        <Check className="w-6 h-6 text-green-500" />
                                        {t.pricingPage?.included || 'Incluído no Plano'}
                                    </h3>
                                    <ul className="space-y-3">
                                        {selectedPlanDetails.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {selectedPlanDetails.notIncluded.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                                            <X className="w-6 h-6 text-gray-400" />
                                            {t.pricingPage?.notIncluded || 'Não Incluído'}
                                        </h3>
                                        <ul className="space-y-3">
                                            {selectedPlanDetails.notIncluded.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-500">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-blue-900 font-semibold">
                                        {selectedPlanDetails.idealFor}
                                    </p>
                                </div>

                                <Button
                                    onClick={() => {
                                        setSelectedPlanDetails(null);
                                        handlePlanAction(selectedPlanDetails.name);
                                    }}
                                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 h-14 text-lg"
                                >
                                    {t.plans?.getStarted || 'Começar Agora'}
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Cookie Banner */}
            <CookieBanner language={language} page="pricing" />

            {/* Chat Widget */}
            <FloatingChatWidget language={language} />
        </div>
    );
}