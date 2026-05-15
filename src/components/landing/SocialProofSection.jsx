import React from 'react';
import { Users, TrendingUp, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SocialProofSection({ t }) {
    const icons = [Users, TrendingUp, Globe];
    const colors = [
        'from-blue-500 to-cyan-500',
        'from-violet-500 to-purple-500',
        'from-green-500 to-emerald-500'
    ];
    
    const stats = [
        { value: t.socialProof.stat1, label: t.socialProof.stat1Label },
        { value: t.socialProof.stat2, label: t.socialProof.stat2Label },
        { value: t.socialProof.stat3, label: t.socialProof.stat3Label }
    ];

    return (
        <section className="py-20 bg-gradient-to-br from-violet-600 to-purple-700 text-white">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        {t.socialProof.title}
                    </h2>
                    <p className="text-xl text-violet-100">
                        {t.socialProof.subtitle}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {stats.map((stat, index) => {
                        const Icon = icons[index];
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 hover:bg-white/20 transition-all duration-300"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[index]} flex items-center justify-center mx-auto mb-4`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                                <div className="text-violet-100 text-lg">{stat.label}</div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}