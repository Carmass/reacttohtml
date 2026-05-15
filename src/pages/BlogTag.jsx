import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BlogHeader from "@/components/blog/BlogHeader.jsx";
import BlogFooter from "@/components/blog/BlogFooter.jsx";
import { useBlogLanguage } from "@/components/blog/BlogLanguageSwitcher.jsx";
import { LanguageProvider, useLanguage } from "@/components/blog/i18nContext.jsx";

function BlogTagContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const tagSlug = urlParams.get('slug');
  const tagName = urlParams.get('name');

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang, changeLang } = useBlogLanguage();
  const { t } = useLanguage();

  useEffect(() => {
    if (tagSlug || tagName) loadPosts();
  }, [tagSlug, tagName]);

  const loadPosts = async () => {
    setLoading(true);
    const [allPosts, cats] = await Promise.all([
      base44.entities.Post.filter({ status: 'published' }, '-published_date', 100),
      base44.entities.Category.list()
    ]);
    const byName = allPosts.filter(p =>
      p.tag_names?.some(tg => tg.toLowerCase() === (tagName || '').toLowerCase())
    );
    setPosts(byName);
    setCategories(cats);
    setLoading(false);
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

      <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">#{tagName || tagSlug}</h1>
          <p className="text-gray-500">{loading ? '...' : `${posts.length} posts`}</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">{t('loading_posts')}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">{t('no_posts_with_tag')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link key={post.id} to={createPageUrl(`BlogPost?slug=${post.slug}`)} className="group block bg-white rounded-xl border hover:shadow-lg transition-all overflow-hidden">
                {post.cover_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img src={post.cover_image_url} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4">
                  {post.category_name && <Badge className="mb-2 text-xs bg-gray-100 text-gray-600">{post.category_name}</Badge>}
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {post.published_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(post.published_date), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{estimateReadTime(post.content)} {t('min_read')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BlogFooter categories={categories} />
    </div>
  );
}

export default function BlogTag() {
  return (
    <LanguageProvider>
      <BlogTagContent />
    </LanguageProvider>
  );
}