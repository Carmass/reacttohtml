import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function DeploymentNotification({ deployment, onClose }) {
    useEffect(() => {
        if (['success', 'completed', 'failed'].includes(deployment?.status)) {
            const timer = setTimeout(onClose, 10000);
            return () => clearTimeout(timer);
        }
    }, [deployment?.status, onClose]);

    if (!deployment) return null;

    const isSuccess = deployment.status === 'success' || deployment.status === 'completed';
    const isFailed = deployment.status === 'failed';
    const isPushing = deployment.status === 'pushing';
    const isLoading = deployment.status === 'uploading' || isPushing;

    return (
        <div className={`fixed bottom-6 right-6 max-w-md rounded-lg shadow-lg p-4 ${
            isSuccess ? 'bg-green-50 border border-green-200' :
            isFailed ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
        } animate-in slide-in-from-bottom-4`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                    {isLoading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
                    {isSuccess && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {isFailed && <AlertCircle className="w-5 h-5 text-red-600" />}
                </div>
                <div className="flex-1">
                    <p className={`font-semibold ${
                        isSuccess ? 'text-green-900' :
                        isFailed ? 'text-red-900' :
                        'text-blue-900'
                    }`}>
                        {isPushing ? '🚀 Enviando arquivos via FTP...' :
                         isLoading ? 'Deployment em Progresso' :
                         isSuccess ? '✅ Deployment Bem-sucedido!' :
                         '❌ Erro no Deployment'}
                    </p>
                    {isLoading && (
                        <p className="text-sm text-blue-700 mt-1">
                            {isPushing ? 'Transferindo arquivos para o servidor...' : `Enviando ${deployment.files_uploaded || 0} arquivo(s)...`}
                        </p>
                    )}
                    {isSuccess && (
                        <div className="text-sm text-green-700 mt-1 space-y-1">
                            <p>✓ {deployment.commit_message || `${deployment.files_uploaded || '?'} arquivo(s) enviado(s)`}</p>
                            {(deployment.repository_url || deployment.deployment_url) && (
                                <a 
                                    href={deployment.repository_url || deployment.deployment_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-green-600 underline hover:text-green-700"
                                >
                                    Acessar projeto →
                                </a>
                            )}
                        </div>
                    )}
                    {isFailed && (
                        <div className="text-sm text-red-700 mt-1">
                            <p className="font-medium">Motivo do erro:</p>
                            <p className="mt-0.5 break-words">{deployment.error_message || 'Ocorreu um erro durante o deployment'}</p>
                        </div>
                    )}
                </div>
                {(isSuccess || isFailed) && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}