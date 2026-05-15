import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Clock } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BlogHeader from "@/components/blog/BlogHeader.jsx";
import BlogFooter from "@/components/blog/BlogFooter.jsx";
import { useBlogLanguage } from "@/components/blog/BlogLanguageSwitcher.jsx";
import { LanguageProvider, useLanguage } from "@/components/blog/i18nContext.jsx";

function BlogSearchContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [allPosts, setAllPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang, changeLang } = useBlogLanguage();
  const { t } = useLanguage();

  useEffect(() => {
    Promise.all([
      base44.entities.Post.filter({ status: 'published' }, '-published_date', 200),
      base44.entities.Category.list()
    ]).then(([p, c]) => {
      setAllPosts(p);
      setCategories(c);
      setLoading(false);
    });
  }, []);

  const results = query.trim().length < 2 ? [] : allPosts.filter(post => {
    const q = query.toLowerCase();
    const inTitle = post.title?.toLowerCase().includes(q);
    const inExcerpt = post.excerpt?.toLowerCase().includes(q);
    const inContent = post.content?.replace(/<[^>]*>/g, '').toLowerCase().includes(q);
    const inTags = post.tag_names?.some(tg => tg.toLowerCase().includes(q));
    const inCategory = post.category_name?.toLowerCase().includes(q);
    return inTitle || inExcerpt || inContent || inTags || inCategory;
  });

  const highlightText = (text, q) => {
    if (!q || !text) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  };

  const estimateReadTime = (content) => {
    const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <BlogHeader
        categories={categories}
        selectedCategory="all"
        onSelectCategory={() => {}}
        lang={lang}
        changeLang={changeLang}
      />

      <div className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              autoFocus
              placeholder={t('search_placeholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 w-full flex-1">
        {loading ? (
          <div className="text-center py-16 text-gray-400">{t('loading_posts')}</div>
        ) : query.trim().length < 2 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('search_placeholder')}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-1">{t('no_search_results')} "{query}"</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">{results.length} {t('search_results_count')} <strong>"{query}"</strong></p>
            <div className="space-y-4">
              {results.map(post => (
                <Link key={post.id} to={createPageUrl(`BlogPost?slug=${post.slug}`)} className="group flex gap-4 p-4 border rounded-xl hover:shadow-md transition-all">
                  {post.cover_image_url && (
                    <div className="w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <img src={post.cover_image_url} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.category_name && <Badge className="text-xs bg-blue-100 text-blue-800">{post.category_name}</Badge>}
                    </div>
                    <h3
                      className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1"
                      dangerouslySetInnerHTML={{ __html: highlightText(post.title, query) }}
                    />
                    <p
                      className="text-sm text-gray-500 line-clamp-2 mb-2"
                      dangerouslySetInnerHTML={{ __html: highlightText(post.excerpt, query) }}
                    />
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {post.published_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(post.published_date), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{estimateReadTime(post.content)} {t('min_read')}</span>
                      {post.tag_names?.filter(tg => tg.toLowerCase().includes(query.toLowerCase())).map((tg, i) => (
                        <span key={i} className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">{tg}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
      <BlogFooter categories={categories} />
    </div>
  );
}

export default function BlogSearch() {
  return (
    <LanguageProvider>
      <BlogSearchContent />
    </LanguageProvider>
  );
}