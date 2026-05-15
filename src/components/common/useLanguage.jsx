import { useState, useEffect } from 'react';

// Map country codes to language codes
const COUNTRY_TO_LANG = {
    BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
    ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
    FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr',
    DE: 'de', AT: 'de',
    CN: 'zh', TW: 'zh', HK: 'zh',
    JP: 'ja',
};

async function detectCountry() {
    try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        const data = await res.json();
        return data.country_code || null;
    } catch {
        return null;
    }
}

export function useLanguage() {
    const [language, setLanguage] = useState(() => {
        // 1. Check localStorage first
        const saved = localStorage.getItem('rth_language');
        if (saved) return saved;
        // 2. Use browser language as initial guess
        const browserLang = navigator.language?.substring(0, 2);
        return ['pt', 'es', 'fr', 'de', 'zh', 'ja'].includes(browserLang) ? browserLang : 'en';
    });

    useEffect(() => {
        const savedLang = localStorage.getItem('rth_language');
        if (savedLang) return; // User already chose a language manually

        // Auto-detect by IP only once
        detectCountry().then(countryCode => {
            if (!countryCode) return;
            const lang = COUNTRY_TO_LANG[countryCode];
            if (lang) {
                setLanguage(lang);
            }
        });
    }, []);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem('rth_language', lang);
    };

    return [language, changeLanguage];
}