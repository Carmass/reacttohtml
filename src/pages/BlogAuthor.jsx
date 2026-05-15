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

function BlogAuthorContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const authorEmail = urlParams.get('email');
  const authorName = urlParams.get('name');

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang, changeLang } = useBlogLanguage();
  const { t } = useLanguage();

  useEffect(() => {
    if (authorEmail || authorName) loadPosts();
  }, [authorEmail, authorName]);

  const loadPosts = async () => {
    setLoading(true);
    const [allPosts, cats] = await Promise.all([
      base44.entities.Post.filter({ status: 'published' }, '-published_date', 100),
      base44.entities.Category.list()
    ]);
    const filtered = allPosts.filter(p =>
      (authorEmail && p.author_email === authorEmail) ||
      (authorName && p.author_name === authorName)
    );
    setPosts(filtered);
    setCategories(cats);
    setLoading(false);
  };

  const estimateReadTime = (content) => {
    const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  const displayName = authorName || authorEmail?.split('@')[0] || 'Autor';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
        <div className="flex items-center gap-6 mb-10 p-6 bg-gray-50 rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            {authorEmail && <p className="text-gray-500 text-sm mt-1">{authorEmail}</p>}
            <p className="text-gray-500 text-sm mt-2">
              {loading ? '...' : `${posts.length} posts`}
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('author_posts_title')} {displayName}</h2>

        {loading ? (
          <div className="text-center py-16 text-gray-400">{t('loading_posts')}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">{t('no_posts_by_author')}</div>
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

export default function BlogAuthor() {
  return (
    <LanguageProvider>
      <BlogAuthorContent />
    </LanguageProvider>
  );
}