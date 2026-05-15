import React from 'react';
import { Upload, Zap, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowItWorksSection({ t }) {
    const steps = [
        {
            number: '1',
            icon: Upload,
            title: t.howItWorks.step1Title,
            description: t.howItWorks.step1Desc,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            number: '2',
            icon: Zap,
            title: t.howItWorks.step2Title,
            description: t.howItWorks.step2Desc,
            color: 'from-violet-500 to-purple-500'
        },
        {
            number: '3',
            icon: Rocket,
            title: t.howItWorks.step3Title,
            description: t.howItWorks.step3Desc,
            color: 'from-green-500 to-emerald-500'
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        {t.howItWorks.title}
                    </h2>
                    <p className="text-xl text-gray-600">
                        {t.howItWorks.subtitle}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="relative"
                            >
                                <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-violet-300 transition-all duration-300 hover:shadow-xl h-full">
                                    {/* Step number badge */}
                                    <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                        {step.number}
                                    </div>
                                    
                                    {/* Icon */}
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6`}>
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Arrow connector (except last) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <svg className="w-8 h-8 text-violet-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}