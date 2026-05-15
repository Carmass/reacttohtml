import React from 'react';
import { Zap, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SolutionSection({ t }) {
    const features = [
        t.solution.feature1,
        t.solution.feature2,
        t.solution.feature3
    ];

    return (
        <section className="py-20 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full font-semibold mb-6">
                        <Zap className="w-5 h-5" />
                        {t.solution.badge}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        {t.solution.title}
                    </h2>
                    <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                        {t.solution.subtitle}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-violet-200"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{feature}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-8 text-white text-center">
                        <p className="text-2xl md:text-3xl font-bold mb-2">
                            {t.solution.cta}
                        </p>
                        <p className="text-violet-100 text-lg">
                            {t.solution.ctaSub}
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}