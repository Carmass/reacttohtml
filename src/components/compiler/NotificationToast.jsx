import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function NotificationToast() {
    useEffect(() => {
        const unsubscribe = base44.entities.BuildHistory.subscribe((event) => {
            if (event.type === 'update') {
                const build = event.data;
                
                if (build.status === 'completed') {
                    toast.success(`Build concluído: ${build.project_name}`, {
                        description: 'O projeto foi compilado com sucesso!',
                        icon: <CheckCircle className="w-5 h-5" />,
                        duration: 5000
                    });
                } else if (build.status === 'failed') {
                    toast.error(`Build falhou: ${build.project_name}`, {
                        description: build.error_message || 'Ocorreu um erro na compilação',
                        icon: <XCircle className="w-5 h-5" />,
                        duration: 7000
                    });
                }
            }
        });

        return unsubscribe;
    }, []);

    return null;
}