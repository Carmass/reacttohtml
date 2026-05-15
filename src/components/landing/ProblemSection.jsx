import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProblemSection({ t }) {
    const aiTools = [
        'Base44',
        'VibeCode tools',
        'AI coding platforms',
        'ChatGPT-generated apps',
        'React templates'
    ];

    const hostingProviders = [
        'HostGator',
        'Hostinger',
        'GoDaddy',
        'Shared Hosting (cPanel)',
        'FTP servers'
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
                        {t.problem.title}
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Left: Built with */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200"
                    >
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            {t.problem.subtitle1}
                        </h3>
                        <ul className="space-y-3">
                            {aiTools.map((tool, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 font-medium">{tool}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Right: Try to upload */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-8 border border-red-200"
                    >
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            {t.problem.subtitle2}
                        </h3>
                        <ul className="space-y-3">
                            {hostingProviders.map((provider, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                        <X className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-700 font-medium">{provider}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* The Problem */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 md:p-12 border-2 border-amber-200"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.problem.errorTitle}</h3>
                            <p className="text-xl text-gray-700 mb-6 font-semibold">{t.problem.errorWhy}</p>
                            <div className="space-y-3 text-lg text-gray-700">
                                <p>{t.problem.errorDesc}</p>
                                <ul className="space-y-2 ml-6">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold">×</span>
                                        <span>Node.js runtime</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold">×</span>
                                        <span>Routing handling configuration</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500 font-bold">×</span>
                                        <span>Server-side setup</span>
                                    </li>
                                </ul>
                                <p className="mt-6 font-bold text-gray-900">
                                    {t.problem.errorConclusion}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}