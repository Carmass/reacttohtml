import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlansSection({ t }) {
    const mostPopularText = t.plans.mostPopular || 'Most Popular';

    const plans = [
        {
            name: 'Starter',
            compilations: '3',
            popular: false,
            info: t.pricingPage?.starter
        },
        {
            name: 'Creator',
            compilations: '10',
            popular: true,
            info: t.pricingPage?.creator
        },
        {
            name: 'Pro',
            compilations: '50',
            popular: false,
            info: t.pricingPage?.pro
        },
        {
            name: 'Business',
            compilations: '100',
            popular: false,
            info: t.pricingPage?.business
        }
    ];

    const handlePlanAction = async (planName) => {
        if (planName === 'Creator' || planName === 'Pro' || planName === 'Business') {
            const isAuth = await base44.auth.isAuthenticated().catch(() => false);
            if (!isAuth) {
                sessionStorage.setItem('pendingPlan', planName);
                base44.auth.redirectToLogin(createPageUrl('Pricing'));
                return;
            }
            try {
                const response = await base44.functions.invoke('createPublicCheckoutSession', {
                    plan_name: planName
                });
                if (response.data?.url) {
                    window.location.href = response.data.url;
                } else {
                    alert('Erro ao criar sessão de pagamento. Tente novamente.');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao processar pagamento. Tente novamente.');
            }
        } else {
            const isAuth = await base44.auth.isAuthenticated().catch(() => false);
            if (!isAuth) {
                base44.auth.redirectToLogin(createPageUrl('Compiler'));
            } else {
                window.location.href = createPageUrl('Compiler');
            }
        }
    };



    return (
        <section className="py-20 bg-white" id="plans">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        {t.plans.title}
                    </h2>
                    <p className="text-xl text-gray-600">
                        {t.plans.subtitle}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative bg-white rounded-2xl p-6 border-2 ${
                                plan.popular 
                                    ? 'border-violet-500 shadow-xl scale-105' 
                                    : 'border-gray-200 hover:border-violet-300'
                            } transition-all duration-300`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
                                        <Zap className="w-4 h-4" />
                                        {mostPopularText}
                                    </span>
                                </div>
                            )}
                            
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <div className="text-4xl font-bold text-gray-900 mb-1">
                                    {plan.compilations}
                                </div>
                                <div className="text-gray-600">{t.plans.daily}</div>
                            </div>

                            <button
                                onClick={() => handlePlanAction(plan.name)}
                                className={`w-full h-10 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
                                    plan.popular 
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700' 
                                        : 'border border-gray-200 text-gray-700 bg-white hover:bg-gradient-to-r hover:from-violet-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                                }`}
                            >
                                {t.plans.getStarted}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* All plans include */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200"
                >
                    <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                        {t.plans.allInclude}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {t.planFeatures.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-gray-700">{feature}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-12"
                >
                    <Link to={createPageUrl('Compiler')}>
                        <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg h-14 px-8">
                            {t.plans.ctaMain}
                        </Button>
                    </Link>
                    <p className="text-gray-600 mt-4">{t.plans.ctaSub}</p>
                </motion.div>
            </div>

        </section>
    );
}