import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Zap, LogIn, Menu, X } from 'lucide-react';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import SolutionSection from '../components/landing/SolutionSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import PlansSection from '../components/landing/PlansSection';
import FAQSection from '../components/landing/FAQSection';
import SocialProofSection from '../components/landing/SocialProofSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import LanguageSwitcher from '../components/landing/LanguageSwitcher';
import FloatingChatWidget from '../components/landing/FloatingChatWidget';
import ExitIntentPopup from '../components/landing/ExitIntentPopup';
import CookieBanner from '../components/landing/CookieBanner';
import { translations } from '../components/landing/translations';
import { useLanguage } from '../components/common/useLanguage';
import { base44 } from '@/api/base44Client';

export default function Landing() {
    const [language, changeLanguage] = useLanguage();
    const t = translations[language] || translations['en'];
    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Verificar autenticação para redirecionar usuários logados ao Dashboard
        const checkAuth = async () => {
            try {
                const isAuth = await base44.auth.isAuthenticated();
                setIsLoggedIn(isAuth);
                
                // Se logado, redireciona ao Compiler
                if (isAuth) {
                    window.location.href = createPageUrl('Compiler');
                }
            } catch {
                setIsLoggedIn(false);
            }
        };
        
        checkAuth();
    }, []);
    
    useEffect(() => {
        // SEO Meta Tags
        document.title = 'Convert React to HTML | Deploy to Shared Hosting, cPanel, FTP';
        
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 
                'Convert React apps to static HTML in seconds. Deploy to HostGator, Hostinger, cPanel, shared hosting. Works with Base44 and AI-generated projects.'
            );
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = 'Convert React apps to static HTML in seconds. Deploy to HostGator, Hostinger, cPanel, shared hosting. Works with Base44 and AI-generated projects.';
            document.head.appendChild(meta);
        }

        // Keywords meta
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            metaKeywords.setAttribute('content',
                'convert react to html, react to static html, export react app, deploy react to shared hosting, static site generator react, upload react to cpanel, react build to html'
            );
        } else {
            const meta = document.createElement('meta');
            meta.name = 'keywords';
            meta.content = 'convert react to html, react to static html, export react app, deploy react to shared hosting, static site generator react, upload react to cpanel, react build to html';
            document.head.appendChild(meta);
        }
    }, []);

    return (
        <div id="top" className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <a href="https://reacttohtml.com/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                React to HTML
                            </span>
                        </a>
                        
                        {/* Navigation Menu - Desktop */}
                         <nav className="hidden md:flex items-center gap-6">
                             <a href="#features" className="text-gray-600 hover:text-violet-600 transition-colors">
                                 {t.nav.features}
                             </a>
                             <a href="#how-it-works" className="text-gray-600 hover:text-violet-600 transition-colors">
                                 {t.nav.howItWorks}
                             </a>
                             <Link to={createPageUrl('Pricing') + '?t=' + Date.now()} className="text-gray-600 hover:text-violet-600 transition-colors">
                                 {t.nav.pricing}
                             </Link>
                             <a href="#faq" className="text-gray-600 hover:text-violet-600 transition-colors">
                                 {t.nav.faq}
                             </a>
                         </nav>

                         {/* Desktop Buttons */}
                         <div className="hidden md:flex items-center gap-3">
                             <LanguageSwitcher currentLang={language} onLanguageChange={changeLanguage} />
                             <Link to={createPageUrl('Compiler')}>
                                 <Button variant="ghost">
                                     <LogIn className="w-4 h-4 mr-2" />
                                     {t.nav.login}
                                 </Button>
                             </Link>
                             <Link to={createPageUrl('Compiler')}>
                                 <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                     {t.nav.startFree}
                                 </Button>
                             </Link>
                         </div>

                         {/* Mobile Menu Button */}
                         <div className="md:hidden flex items-center gap-2">
                             <LanguageSwitcher currentLang={language} onLanguageChange={changeLanguage} />
                             <Button
                                 variant="outline"
                                 size="icon"
                                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                 className="rounded-lg"
                             >
                                 {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                             </Button>
                         </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-gray-200 mt-4 pt-4 pb-4 space-y-3">
                            <a 
                                href="#features" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-gray-600 hover:text-violet-600 transition-colors py-2"
                            >
                                {t.nav.features}
                            </a>
                            <a 
                                href="#how-it-works"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-gray-600 hover:text-violet-600 transition-colors py-2"
                            >
                                {t.nav.howItWorks}
                            </a>
                            <Link 
                                to={createPageUrl('Pricing')}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-gray-600 hover:text-violet-600 transition-colors py-2"
                            >
                                {t.nav.pricing}
                            </Link>
                            <a 
                                href="#faq"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-gray-600 hover:text-violet-600 transition-colors py-2"
                            >
                                {t.nav.faq}
                            </a>
                            <div className="pt-3 border-t border-gray-200 space-y-2">
                                <Link to={createPageUrl('Compiler')} onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-center gap-2">
                                        <LogIn className="w-4 h-4" />
                                        {t.nav.login}
                                    </Button>
                                </Link>
                                <Link to={createPageUrl('Compiler')} onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                        {t.nav.startFree}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20">
                <HeroSection t={t} />
                <div id="features">
                    <ProblemSection t={t} />
                </div>
                <SolutionSection t={t} />
                <div id="how-it-works">
                    <HowItWorksSection t={t} />
                </div>
                <BenefitsSection t={t} />
                <SocialProofSection t={t} />
                <TestimonialsSection t={t} />
                <div id="pricing">
                    <PlansSection t={t} />
                </div>
                <FAQSection t={t} />
                
                {/* Final CTA */}
                <section className="py-20 bg-gradient-to-br from-violet-500 to-purple-600">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            {t.finalCTA?.title || 'O que você está esperando?'}
                        </h2>
                        <p className="text-xl text-violet-100 mb-8">
                            {t.finalCTA?.subtitle || 'Publique agora mesmo seu projeto React na sua hospedagem compartilhada!'}
                        </p>
                        <Link to={createPageUrl('Compiler')}>
                            <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 text-lg h-14 px-10 shadow-xl">
                                {t.finalCTA?.button || 'Comece Grátis'}
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Exit Intent Popup */}
            <ExitIntentPopup t={t} />
            
            {/* Cookie Banner */}
            <CookieBanner language={language} page="landing" />

            {/* Chat Widget */}
            <FloatingChatWidget language={language} />

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold">React to HTML</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                {t.footer.description}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">{t.footer.product}</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" onClick={(e) => { e.preventDefault(); base44.auth.redirectToLogin(createPageUrl('Compiler')); }} className="hover:text-white cursor-pointer">{t.footer.compiler}</a></li>
                                <li><a href="#" onClick={(e) => { e.preventDefault(); base44.auth.redirectToLogin(createPageUrl('Dashboard')); }} className="hover:text-white cursor-pointer">{t.footer.dashboard}</a></li>
                                <li><Link to={createPageUrl('Pricing')} className="hover:text-white">{t.footer.pricing}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">{t.footer.resources}</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#faq" className="hover:text-white">{t.footer.faq}</a></li>
                                <li><a href="#" onClick={(e) => { e.preventDefault(); base44.auth.redirectToLogin(createPageUrl('Support')); }} className="hover:text-white cursor-pointer">{t.footer.support}</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">{t.footer.company}</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" onClick={(e) => { e.preventDefault(); base44.auth.redirectToLogin(createPageUrl('Profile')); }} className="hover:text-white cursor-pointer">{t.footer.account}</a></li>
                                <li><a href="#" onClick={(e) => { e.preventDefault(); base44.auth.redirectToLogin(createPageUrl('Referrals')); }} className="hover:text-white cursor-pointer">{t.footer.referral}</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                        <p>© 2026 React to HTML. {t.footer.rights}.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}