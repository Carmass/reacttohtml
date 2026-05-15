import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, ChevronRight, ChevronDown } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import BlogLanguageSwitcher from "@/components/blog/BlogLanguageSwitcher.jsx";
import { useLanguage } from "@/components/blog/i18nContext.jsx";
import { base44 } from "@/api/base44Client";

// Custom Blog Logo
function BlogLogo() {
  return (
    <Link to={createPageUrl('BlogHome')} className="flex items-center gap-2 group">
      <div className="relative">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="36" rx="8" fill="#0f172a"/>
          <ellipse cx="13" cy="18" rx="5" ry="2.5" stroke="#61DAFB" strokeWidth="1.2" fill="none"/>
          <ellipse cx="13" cy="18" rx="5" ry="2.5" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(60 13 18)"/>
          <ellipse cx="13" cy="18" rx="5" ry="2.5" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(-60 13 18)"/>
          <circle cx="13" cy="18" r="1.2" fill="#61DAFB"/>
          <path d="M20 18 L22 18" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M21 16 L23 18 L21 20" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="25" y="14" width="5" height="1.5" rx="0.75" fill="#e2e8f0"/>
          <rect x="25" y="17" width="5" height="1.5" rx="0.75" fill="#e2e8f0"/>
          <rect x="25" y="20" width="3.5" height="1.5" rx="0.75" fill="#e2e8f0"/>
        </svg>
        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[7px] font-bold px-1 rounded leading-tight">BLOG</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-sm font-black text-gray-900 tracking-tight">React<span className="text-blue-500">toHTML</span></span>
        <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Blog</span>
      </div>
    </Link>
  );
}

const MAX_VISIBLE_CATS = 6;

export default function BlogHeader({ categories, selectedCategory, onSelectCategory, lang: langProp, changeLang: changeLangProp }) {
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMoreCats, setShowMoreCats] = useState(false);
  const navigate = useNavigate();
  const { t, lang: ctxLang, changeLang: ctxChangeLang } = useLanguage();
  const lang = langProp !== undefined ? langProp : ctxLang;
  const changeLang = changeLangProp !== undefined ? changeLangProp : ctxChangeLang;

  const [translatedCats, setTranslatedCats] = useState(categories);

  useEffect(() => {
    setTranslatedCats(categories);
    if (lang !== 'pt' && categories.length > 0) {
      translateCategories(categories, lang);
    }
  }, [lang, categories]);

  const translateCategories = async (cats, targetLang) => {
    const langNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese (Simplified)' };
    const langName = langNames[targetLang] || targetLang;
    const names = cats.map(c => c.name);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following category names to ${langName}. Return a JSON object with a "names" array in the same order.\n\nNames: ${JSON.stringify(names)}`,
      response_json_schema: { type: 'object', properties: { names: { type: 'array', items: { type: 'string' } } } }
    });
    if (res?.names?.length === cats.length) {
      setTranslatedCats(cats.map((c, i) => ({ ...c, name: res.names[i] })));
    }
  };

  const visibleCats = translatedCats.slice(0, MAX_VISIBLE_CATS);
  const hiddenCats = translatedCats.slice(MAX_VISIBLE_CATS);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(createPageUrl(`BlogSearch?q=${encodeURIComponent(search.trim())}`));
      setMobileOpen(false);
    }
  };

  const handleSearchSubmit = () => {
    if (search.trim()) {
      navigate(createPageUrl(`BlogSearch?q=${encodeURIComponent(search.trim())}`));
      setMobileOpen(false);
    }
  };

  return (
    <header className="border-b bg-white sticky top-0 z-20 shadow-sm">
      {/* Main header row */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <BlogLogo />

        {/* Desktop search */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('search_posts')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9"
            />
          </div>
          <Link to={createPageUrl('BlogSearch')} className="text-sm text-blue-600 hover:underline whitespace-nowrap">{t('advanced_search')}</Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Language switcher - desktop */}
          <div className="hidden md:block">
            <BlogLanguageSwitcher lang={lang} onChange={changeLang} />
          </div>
          {/* Login & Buy - desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm">{t('login')}</Button>
            </Link>
            <Link to={createPageUrl('Landing')}>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">{t('convert_cta')}</Button>
            </Link>
          </div>
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 pb-4 space-y-3">
          {/* Search */}
          <div className="pt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('search_posts')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                className="pl-9"
              />
            </div>
            <Button size="sm" onClick={handleSearchSubmit} variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          {/* Categories in mobile */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('categories')}</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { onSelectCategory('all'); setMobileOpen(false); }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {t('all_posts')}
                <ChevronRight className="w-4 h-4" />
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { onSelectCategory(cat.id); setMobileOpen(false); }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {cat.name}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          {/* Language switcher mobile */}
          <div className="border-t pt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500">{t('language')}:</span>
            <BlogLanguageSwitcher lang={lang} onChange={changeLang} />
          </div>
          {/* Login & Buy - mobile */}
          <div className="border-t pt-3 flex gap-2">
            <Link to="/login" className="flex-1">
              <Button variant="outline" className="w-full">{t('login')}</Button>
            </Link>
            <Link to={createPageUrl('Landing')} className="flex-1">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full">{t('converter')}</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Desktop categories */}
      <div className="hidden md:block border-t">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-1.5">
          <button
            onClick={() => onSelectCategory('all')}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-sm transition-colors font-medium flex-shrink-0 ${selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            {t('all')}
          </button>
          {visibleCats.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-sm transition-colors font-medium flex-shrink-0 ${selectedCategory === cat.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              {cat.name}
            </button>
          ))}
          {hiddenCats.length > 0 && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMoreCats(!showMoreCats)}
                className={`flex items-center gap-1 whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors ${hiddenCats.some(c => c.id === selectedCategory) ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                {t('more')} <ChevronDown className="w-3 h-3" />
              </button>
              {showMoreCats && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-lg z-50 py-1 min-w-[200px]">
                  {hiddenCats.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { onSelectCategory(cat.id); setShowMoreCats(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedCategory === cat.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}