import React from 'react';
import { Sparkles, Server, Zap, Search, DollarSign, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BenefitsSection({ t }) {
    const icons = [Sparkles, Server, Zap, Search, DollarSign, CheckCircle];
    const colors = [
        'from-purple-500 to-pink-500',
        'from-blue-500 to-cyan-500',
        'from-amber-500 to-orange-500',
        'from-green-500 to-emerald-500',
        'from-violet-500 to-purple-500',
        'from-red-500 to-rose-500'
    ];

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        {t.benefits.title}
                    </h2>
                    <p className="text-xl text-gray-600">
                        {t.benefits.subtitle}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {t.benefits.items.map((benefit, index) => {
                        const Icon = icons[index];
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[index]} flex items-center justify-center mb-4`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="text-green-500">✅</span>
                                    {benefit.title}
                                </h3>
                                <p className="text-gray-600">
                                    {benefit.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}