import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuildProgress({ status, progress }) {
    if (!status) return null;

    const statusConfig = {
        uploading: {
            icon: Loader2,
            text: 'Enviando projeto...',
            color: 'text-blue-500',
            spin: true
        },
        processing: {
            icon: Loader2,
            text: 'Compilando para HTML estático...',
            color: 'text-violet-500',
            spin: true
        },
        completed: {
            icon: CheckCircle,
            text: 'Compilação concluída!',
            color: 'text-green-500',
            spin: false
        },
        failed: {
            icon: AlertCircle,
            text: 'Erro na compilação',
            color: 'text-red-500',
            spin: false
        }
    };

    const config = statusConfig[status] || statusConfig.processing;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    status === 'completed' ? 'bg-green-100' : 
                    status === 'failed' ? 'bg-red-100' : 'bg-violet-100'
                )}>
                    <Icon className={cn(config.color, "w-6 h-6", config.spin && "animate-spin")} />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800">{config.text}</h3>
                    {progress && (
                        <p className="text-sm text-gray-500">{progress}%</p>
                    )}
                </div>
            </div>

            {status === 'processing' && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress || 0}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            )}
        </motion.div>
    );
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}