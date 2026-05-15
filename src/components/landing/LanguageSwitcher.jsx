import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher({ currentLang, onLanguageChange }) {
    const languages = [
        { code: 'en', flag: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e836dc244b6f7119a7c6d/2cbf40cea_Estados-Unidos.jpg', name: 'English' },
        { code: 'pt', flag: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e836dc244b6f7119a7c6d/32e28b356_Brasil.jpg', name: 'Português' },
        { code: 'es', flag: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e836dc244b6f7119a7c6d/03622bcdc_Espanha.jpg', name: 'Español' },
        { code: 'fr', flag: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e836dc244b6f7119a7c6d/0479c732b_Frana.jpg', name: 'Français' },
        { code: 'de', flag: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e836dc244b6f7119a7c6d/f09868011_Alemanha.jpg', name: 'Deutsch' },
        { code: 'zh', flag: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e836dc244b6f7119a7c6d/bb6ce51f1_China.jpg', name: '中文' },
        { code: 'ja', flag: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e836dc244b6f7119a7c6d/ab1f7b2d0_Japo.jpg', name: '日本語' }
    ];

    const current = languages.find(l => l.code === currentLang) || languages.find(l => l.code === 'en') || languages[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <img src={current.flag} alt={current.code} className="w-5 h-4 object-cover rounded" />
                    <ChevronDown className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => onLanguageChange(lang.code)}
                        className="cursor-pointer flex items-center gap-3 py-2"
                    >
                        <img src={lang.flag} alt={lang.code} className="w-5 h-4 object-cover rounded" />
                        <span className="font-medium">{lang.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}