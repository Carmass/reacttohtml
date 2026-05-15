import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection({ t }) {
    return (
        <section className="relative bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 -mt-14 pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            {t.hero.headline.split(/(em Segundos|in Seconds|en Segundos|en Quelques Secondes)/i)[0]}
                            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                {t.hero.headline.match(/em Segundos|in Seconds|en Segundos|en Quelques Secondes/i)?.[0] || ''}
                            </span>
                            {t.hero.headline.split(/(em Segundos|in Seconds|en Segundos|en Quelques Secondes)/i)[2] || ''}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                            {t.hero.subheadline}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to={createPageUrl('Compiler')} className="w-full sm:w-auto">
                                <Button size="lg" className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg h-14 px-8">
                                    {t.hero.cta1}
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <a href="#how-it-works" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="w-full h-14 px-8">
                                    <Play className="w-5 h-5 mr-2" />
                                    {t.hero.cta2}
                                </Button>
                            </a>
                        </div>
                        
                        {/* Trust badges */}
                        <div className="mt-12 flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-600 font-medium">{t.hero.badge1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-600 font-medium">{t.hero.badge2}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                            {/* Code preview mockup */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-4 border-b">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="space-y-2 font-mono text-sm">
                                    <div className="text-purple-600">// Your React App ⚛️</div>
                                    <div className="text-gray-400">npm run build</div>
                                    <div className="h-8 flex items-center">
                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse mr-2"></div>
                                        <span className="text-gray-600">Converting to HTML...</span>
                                    </div>
                                    <div className="text-green-600">✓ Compiled successfully!</div>
                                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-200">
                                        <div className="text-violet-700 font-semibold">index.html</div>
                                        <div className="text-violet-600 text-xs mt-1">Ready for upload 🚀</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Floating elements */}
                        <div className="absolute -top-6 -right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold">
                            ✓ SEO Friendly
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold">
                            ⚡ Super Fast
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}