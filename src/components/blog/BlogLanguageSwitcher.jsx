import { useState } from "react";
import { BLOG_LANGS } from "@/components/blog/i18nContext.jsx";

const IP_TO_LANG = {
  BR: "pt", PT: "pt", AO: "pt", MZ: "pt",
  US: "en", GB: "en", AU: "en", CA: "en",
  ES: "es", MX: "es", AR: "es", CO: "es",
  FR: "fr", BE: "fr", CH: "fr",
  DE: "de", AT: "de",
  JP: "ja",
  CN: "zh", TW: "zh", HK: "zh",
};

// Keep useBlogLanguage for backwards compatibility with pages that import it directly
export function useBlogLanguage() {
  const [lang, setLang] = useState(() => localStorage.getItem('blog_lang') || 'en');

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('blog_lang', code);
  };

  return { lang, changeLang };
}

export default function BlogLanguageSwitcher({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const current = BLOG_LANGS.find(l => l.code === lang) || BLOG_LANGS.find(l => l.code === 'en');

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-sm text-gray-600 bg-white transition-colors">
        <img src={current.flag} alt={current.label} className="w-5 h-4 object-cover rounded" />
        <span className="font-medium">{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border rounded-xl shadow-lg z-50 py-1 min-w-[160px]">
          {BLOG_LANGS.map(l => (
            <button key={l.code} onClick={() => { onChange(l.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3
                ${lang === l.code ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
              <img src={l.flag} alt={l.label} className="w-5 h-4 object-cover rounded flex-shrink-0" />
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}