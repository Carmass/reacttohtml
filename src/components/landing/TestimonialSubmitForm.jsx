import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function TestimonialSubmitForm() {
    const [formData, setFormData] = useState({
        text: '',
        name: '',
        role: '',
        company: '',
        rating: 5
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rating' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await base44.entities.Testimonial.create(formData);
            setSubmitStatus('success');
            setFormData({
                text: '',
                name: '',
                role: '',
                company: '',
                rating: 5
            });
            setTimeout(() => setSubmitStatus(null), 5000);
        } catch (error) {
            console.error('Erro ao enviar testemunho:', error);
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus(null), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl border border-gray-200 p-8 max-w-2xl mx-auto"
        >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Deixe seu Testemunho</h3>

            {submitStatus === 'success' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                >
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-green-800">Obrigado! Seu testemunho foi enviado para aprovação.</p>
                </motion.div>
            )}

            {submitStatus === 'error' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">Erro ao enviar testemunho. Tente novamente.</p>
                </motion.div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seu Testemunho *
                    </label>
                    <Textarea
                        name="text"
                        value={formData.text}
                        onChange={handleChange}
                        placeholder="Compartilhe sua experiência com o React to HTML..."
                        required
                        className="h-28"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome *
                        </label>
                        <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Seu nome"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cargo *
                        </label>
                        <Input
                            type="text"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            placeholder="Ex: Desenvolvedor Full Stack"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Empresa *
                    </label>
                    <Input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Sua empresa"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Classificação
                    </label>
                    <select
                        name="rating"
                        value={formData.rating}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                        <option value="4">⭐⭐⭐⭐ Muito Bom</option>
                        <option value="3">⭐⭐⭐ Bom</option>
                        <option value="2">⭐⭐ Satisfatório</option>
                        <option value="1">⭐ Insatisfatório</option>
                    </select>
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-lg"
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar Testemunho'}
                </Button>
            </div>
        </motion.form>
    );
}