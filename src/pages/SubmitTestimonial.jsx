import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft } from 'lucide-react';
import TestimonialSubmitForm from '../components/landing/TestimonialSubmitForm';

export default function SubmitTestimonial() {
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    useEffect(() => {
        // Redirect to home after a delay to allow page to load
        setIsAuthChecking(false);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to={createPageUrl('Landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                React to HTML
                            </span>
                        </Link>
                        
                        <Link to={createPageUrl('Landing')}>
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-16 px-6">
                <div className="max-w-2xl mx-auto">
                    <TestimonialSubmitForm />
                </div>
            </main>
        </div>
    );
}