import React, { useState, useEffect } from 'react';
import { X, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExitIntentPopup({ t }) {
    const [isVisible, setIsVisible] = useState(false);
    const [canShow, setCanShow] = useState(false);

    useEffect(() => {
        // Verificar se popup foi fechado recentemente
        const lastClosed = localStorage.getItem('exitPopupLastClosed');
        const oneHourInMs = 60 * 60 * 1000;
        
        if (!lastClosed || (Date.now() - parseInt(lastClosed)) > oneHourInMs) {
            setCanShow(true);
        }

        const handleMouseLeave = (e) => {
            // Detectar saída do mouse pela parte superior da página
            if (e.clientY <= 0 && canShow) {
                setIsVisible(true);
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [canShow]);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('exitPopupLastClosed', Date.now().toString());
        setCanShow(false);
    };

    const popupText = t.exitPopup || {
        title: "Wait! Don't leave yet! 🎉",
        subtitle: "Start converting your React projects to HTML in seconds!",
        benefit1: "✓ No VPS needed",
        benefit2: "✓ Deploy on any hosting",
        benefit3: "✓ SEO optimized",
        benefit4: "✓ Start free",
        cta: "Start Free Now",
        close: "No, thanks"
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 md:p-12 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Zap className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                {popupText.title}
                            </h2>
                            <p className="text-lg md:text-xl text-gray-600 mb-6">
                                {popupText.subtitle}
                            </p>

                            {/* Benefits */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left max-w-md mx-auto mb-8">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <span className="text-green-500 text-xl">{popupText.benefit1}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <span className="text-green-500 text-xl">{popupText.benefit2}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <span className="text-green-500 text-xl">{popupText.benefit3}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <span className="text-green-500 text-xl">{popupText.benefit4}</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to={createPageUrl('Compiler')} onClick={handleClose}>
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg h-14 px-8"
                                    >
                                        {popupText.cta}
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    onClick={handleClose}
                                    className="w-full sm:w-auto text-gray-600 hover:text-gray-800"
                                >
                                    {popupText.close}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}