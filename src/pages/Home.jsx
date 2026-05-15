import React, { useEffect } from 'react';
import { base44 } from '@/api/client';
import { createPageUrl } from '@/utils';

export default function Home() {
    useEffect(() => {
        const redirectUser = async () => {
            try {
                const isAuth = await base44.auth.isAuthenticated();
                if (isAuth) {
                    // Usuário autenticado → Compiler
                    window.location.href = createPageUrl('Compiler');
                } else {
                    // Usuário público → Landing
                    window.location.href = createPageUrl('Landing');
                }
            } catch {
                // Erro → Landing (page pública)
                window.location.href = createPageUrl('Landing');
            }
        };
        
        redirectUser();
    }, []);

    return <div />;
}