import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    Loader2, CheckCircle, AlertCircle, Clock, 
    Upload, Cog, Package, FileCheck, ChevronDown, ChevronUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import BuildLogsViewer from './BuildLogsViewer';

const BUILD_STEPS = [
    { 
        id: 'upload', 
        label: 'Upload do Arquivo', 
        icon: Upload,
        description: 'Enviando projeto para o servidor'
    },
    { 
        id: 'validation', 
        label: 'Validação', 
        icon: FileCheck,
        description: 'Verificando estrutura do projeto'
    },
    { 
        id: 'install', 
        label: 'Instalação', 
        icon: Package,
        description: 'Instalando dependências npm'
    },
    { 
        id: 'build', 
        label: 'Compilação', 
        icon: Cog,
        description: 'Compilando para HTML estático'
    },
    { 
        id: 'optimize', 
        label: 'Otimização', 
        icon: Loader2,
        description: 'Otimizando assets e arquivos'
    }
];

export default function BuildProgressDetailed({ status, progress, buildId, buildSteps, logs }) {
    const [expandedLogs, setExpandedLogs] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        if (status === 'processing') {
            const interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [status, startTime]);

    const getStepStatus = (stepId) => {
        if (!buildSteps) return 'pending';
        return buildSteps[stepId] || 'pending';
    };

    const getStepIcon = (stepId) => {
        const stepStatus = getStepStatus(stepId);
        const step = BUILD_STEPS.find(s => s.id === stepId);
        const Icon = step?.icon || Clock;

        if (stepStatus === 'completed') return CheckCircle;
        if (stepStatus === 'failed') return AlertCircle;
        if (stepStatus === 'running') return Icon;
        return Clock;
    };

    const getStepColor = (stepId) => {
        const stepStatus = getStepStatus(stepId);
        if (stepStatus === 'completed') return 'text-green-600';
        if (stepStatus === 'failed') return 'text-red-600';
        if (stepStatus === 'running') return 'text-violet-600';
        return 'text-gray-400';
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const completedSteps = BUILD_STEPS.filter(s => getStepStatus(s.id) === 'completed').length;
    const totalSteps = BUILD_STEPS.length;
    const stepProgress = (completedSteps / totalSteps) * 100;

    if (!status) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className={`w-5 h-5 ${status === 'processing' ? 'animate-spin text-violet-600' : 'text-gray-400'}`} />
                            Progresso da Compilação
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            {status === 'processing' && (
                                <Badge className="bg-violet-100 text-violet-800 gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(elapsedTime)}
                                </Badge>
                            )}
                            <Badge className="bg-blue-100 text-blue-800">
                                {completedSteps}/{totalSteps} etapas
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Overall Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Progresso Geral</span>
                            <span className="text-gray-900 font-bold">{Math.round(stepProgress)}%</span>
                        </div>
                        <Progress value={stepProgress} className="h-3" />
                    </div>

                    {/* Build Steps */}
                    <div className="space-y-3">
                        {BUILD_STEPS.map((step, index) => {
                            const StepIcon = getStepIcon(step.id);
                            const stepStatus = getStepStatus(step.id);
                            const isActive = stepStatus === 'running';
                            const isCompleted = stepStatus === 'completed';
                            const isFailed = stepStatus === 'failed';

                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                        isActive 
                                            ? 'bg-violet-50 border-violet-300 shadow-sm' 
                                            : isCompleted
                                                ? 'bg-green-50 border-green-200'
                                                : isFailed
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        isCompleted 
                                            ? 'bg-green-500' 
                                            : isFailed
                                                ? 'bg-red-500'
                                                : isActive
                                                    ? 'bg-violet-500'
                                                    : 'bg-gray-300'
                                    }`}>
                                        <StepIcon className={`w-5 h-5 text-white ${isActive && StepIcon === step.icon ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="font-semibold text-gray-900">{step.label}</h4>
                                            {isActive && (
                                                <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                                            )}
                                            {isCompleted && (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            )}
                                            {isFailed && (
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Build Logs */}
                    {logs && logs.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setExpandedLogs(!expandedLogs)}
                                className="w-full flex items-center justify-between text-sm font-semibold"
                            >
                                <span>Logs da Compilação</span>
                                {expandedLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            
                            <AnimatePresence>
                                {expandedLogs && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-3"
                                    >
                                        <BuildLogsViewer logs={logs} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Status Summary */}
                    {status === 'completed' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
                        >
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-900">Compilação Concluída!</p>
                                <p className="text-sm text-green-700">
                                    Tempo total: {formatTime(elapsedTime)}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {status === 'failed' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
                        >
                            <AlertCircle className="w-6 h-6 text-red-600" />
                            <div>
                                <p className="font-semibold text-red-900">Compilação Falhou</p>
                                <p className="text-sm text-red-700">Verifique os logs para mais detalhes</p>
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}