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
import NewsletterWidget from "@/components/blog/NewsletterWidget.jsx";
import { LanguageProvider, useLanguage } from "@/components/blog/i18nContext.jsx";

function BlogHomeContent() {
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { lang, changeLang, t } = useLanguage();
  // Cache: { [langCode]: translatedPostsArray }
  const translationCache = React.useRef({});
  const currentLangRef = React.useRef(lang);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    currentLangRef.current = lang;
    if (!allPosts.length) return;

    if (lang === 'pt') {
      setTranslating(false);
      setPosts(allPosts);
      return;
    }

    if (translationCache.current[lang]) {
      setPosts(translationCache.current[lang]);
      setTranslating(false);
      return;
    }

    translatePosts(allPosts, lang);
  }, [lang, allPosts]);

  const loadData = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      base44.entities.Post.filter({ status: 'published' }, '-published_date', 50),
      base44.entities.Category.list()
    ]);
    setAllPosts(p);
    setPosts(p);
    setCategories(c);
    setLoading(false);
  };

  const translatePosts = async (sourcePosts, targetLang) => {
    setTranslating(true);
    const langNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', ja: 'Japanese', zh: 'Chinese (Simplified)' };
    const langName = langNames[targetLang] || targetLang;
    const translated = await Promise.all(
      sourcePosts.map(async (post) => {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Translate only the following blog post title and excerpt to ${langName}. Return JSON with "title" and "excerpt" fields only.\n\nTitle: ${post.title}\nExcerpt: ${post.excerpt || ''}`,
          response_json_schema: { type: 'object', properties: { title: { type: 'string' }, excerpt: { type: 'string' } } }
        });
        return { ...post, title: res.title || post.title, excerpt: res.excerpt || post.excerpt };
      })
    );
    // Salvar no cache independente do idioma atual
    translationCache.current[targetLang] = translated;
    // Só aplicar se ainda for o idioma ativo
    if (currentLangRef.current === targetLang) {
      setPosts(translated);
      setTranslating(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchCategory = selectedCategory === 'all' || post.category_id === selectedCategory;
    return matchCategory;
  });

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  const estimateReadTime = (content) => {
    const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <BlogHeader
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
        {translating && <div className="text-center py-4 text-blue-500 text-sm">{t('loading_posts')}</div>}
        {loading ? (
          <div className="text-center py-16 text-gray-400">{t('loading_posts')}</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">{t('no_posts_in_category')}</div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Link to={createPageUrl(`BlogPost?slug=${featuredPost.slug}`)} className="block mb-10 group">
                <div className="grid md:grid-cols-2 gap-6 bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  {featuredPost.cover_image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={featuredPost.cover_image_url} alt={featuredPost.cover_image_alt || featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      <span className="text-5xl">📝</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col justify-center">
                    {featuredPost.category_name && (
                      <Link to={createPageUrl(`BlogCategory?id=${featuredPost.category_id}&name=${encodeURIComponent(featuredPost.category_name)}`)} onClick={e => e.stopPropagation()}>
                        <Badge className="w-fit mb-2 bg-blue-100 text-blue-800 border-0 hover:bg-blue-200 cursor-pointer">{featuredPost.category_name}</Badge>
                      </Link>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">{featuredPost.title}</h2>
                    <p className="text-gray-500 mb-4 line-clamp-3">{featuredPost.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      {featuredPost.published_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(featuredPost.published_date), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{estimateReadTime(featuredPost.content)} {t('min_read')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Other Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {otherPosts.map(post => (
                <Link key={post.id} to={createPageUrl(`BlogPost?slug=${post.slug}`)} className="group block bg-white rounded-xl border hover:shadow-lg transition-all overflow-hidden">
                  {post.cover_image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <span className="text-3xl">📄</span>
                    </div>
                  )}
                  <div className="p-4">
                    {post.category_name && (
                      <Link to={createPageUrl(`BlogCategory?id=${post.category_id}&name=${encodeURIComponent(post.category_name)}`)} onClick={e => e.stopPropagation()}>
                        <Badge className="mb-2 text-xs bg-blue-50 text-blue-700 border-0 hover:bg-blue-100 cursor-pointer">{post.category_name}</Badge>
                      </Link>
                    )}
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {post.published_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(post.published_date), 'dd/MM/yyyy', { locale: ptBR })}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{estimateReadTime(post.content)} {t('min_read')}</span>
                    </div>
                    {post.tag_names?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {post.tag_names.slice(0, 3).map((tag, i) => (
                          <Link key={i} to={createPageUrl(`BlogTag?name=${encodeURIComponent(tag)}`)} onClick={e => e.stopPropagation()}
                            className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors">
                            {tag}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Newsletter */}
        {!loading && <div className="max-w-lg mx-auto mt-12 mb-4"><NewsletterWidget /></div>}
      </main>

      <BlogFooter categories={categories} lang={lang} />
    </div>
  );
}

export default function BlogHome() {
  return (
    <LanguageProvider>
      <BlogHomeContent />
    </LanguageProvider>
  );
}