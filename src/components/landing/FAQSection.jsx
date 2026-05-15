import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQSection({ t }) {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100" id="faq">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        {t.faq.title}
                    </h2>
                    <p className="text-xl text-gray-600">
                        {t.faq.subtitle}
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {t.faqItems.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 pr-4">
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-violet-500 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                            </button>
                            
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* SEO Rich Keywords Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-16 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-200"
                >
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                        {t.faq.seoTitle}
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        {t.faq.seoIntro}
                    </p>
                    <ul className="space-y-2 text-gray-700">
                        {t.seoKeywords.map((keyword, index) => (
                            <li key={index} className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                                <span><strong>{keyword}</strong></span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-gray-700 leading-relaxed mt-4 font-semibold">
                        {t.faq.seoOutro1}
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        {t.faq.seoOutro2}
                    </p>
                </motion.div>
            </div>
        </section>
    );
}