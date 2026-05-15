import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Tag, BookOpen, Eye } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentSection from "@/components/blog/CommentSection";
import RelatedPosts from "@/components/blog/RelatedPosts";
import SocialShare from "@/components/blog/SocialShare";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb.jsx";
import BlogFooter from "@/components/blog/BlogFooter.jsx";
import BlogHeader from "@/components/blog/BlogHeader.jsx";
import { LanguageProvider, useLanguage } from "@/components/blog/i18nContext.jsx";
import PostSchemaOrg from "@/components/blog/PostSchemaOrg.jsx";
import hljs from "highlight.js";

function PostSEO({ post }) {
  useEffect(() => {
    if (!post) return;
    const title = post.meta_title || post.title;
    const desc = post.meta_description || post.excerpt || '';
    const img = post.cover_image_url || '';
    const url = window.location.href;

    document.title = title;
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('description', desc);
    setMeta('og:title', title, true);
    setMeta('og:description', desc, true);
    setMeta('og:url', url, true);
    setMeta('og:type', 'article', true);
    if (img) setMeta('og:image', img, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    if (img) setMeta('twitter:image', img);
    if (post.keywords?.length) setMeta('keywords', post.keywords.join(', '));

    return () => { document.title = 'Blog'; };
  }, [post]);
  return null;
}

function BlogPostContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const [post, setPost] = useState(null);
  const [originalPost, setOriginalPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [translatedCategories, setTranslatedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [readMode, setReadMode] = useState(false);
  const { t, lang, changeLang } = useLanguage();
  const navigate = useNavigate();
  const translationCache = React.useRef({});
  const currentLangRef = React.useRef(lang);

  useEffect(() => {
    if (slug) {
      loadPost();
    } else {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!originalPost) return;
    currentLangRef.current = lang;

    if (lang === 'pt') {
      setTranslating(false);
      setPost(originalPost);
      return;
    }

    if (translationCache.current[lang]) {
      setPost(translationCache.current[lang]);
      setTranslating(false);
      return;
    }

    translatePost(originalPost, lang);
  }, [lang, originalPost]);

  const loadPost = async () => {
    setLoading(true);
    const [posts, cats] = await Promise.all([
      base44.entities.Post.filter({ slug, status: 'published' }),
      base44.entities.Category.list()
    ]);
    if (posts[0]) {
      setPost(posts[0]);
      setOriginalPost(posts[0]);
      base44.entities.Post.update(posts[0].id, { views: (posts[0].views || 0) + 1 });
    }
    setCategories(cats);
    setTranslatedCategories(cats);
    setLoading(false);
  };

  useEffect(() => {
    if (categories.length === 0) return;
    if (lang === 'pt') {
      setTranslatedCategories(categories);
    } else {
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
      setTranslatedCategories(cats.map((c, i) => ({ ...c, name: res.names[i] })));
    }
  };

  const translatePost = async (sourcePost, targetLang) => {
    setTranslating(true);
    const langNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese (Simplified)' };
    const langName = langNames[targetLang] || targetLang;
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate the following blog post title, excerpt, category name, and HTML content to ${langName}. Keep all HTML tags intact, only translate text. Return JSON with "title", "excerpt", "category_name", and "content" fields.\n\nTitle: ${sourcePost.title}\nExcerpt: ${sourcePost.excerpt || ''}\nCategory: ${sourcePost.category_name || ''}\nContent: ${sourcePost.content || ''}`,
      response_json_schema: { type: 'object', properties: { title: { type: 'string' }, excerpt: { type: 'string' }, category_name: { type: 'string' }, content: { type: 'string' } } }
    });
    const translated = { ...sourcePost, title: res.title || sourcePost.title, excerpt: res.excerpt || sourcePost.excerpt, category_name: res.category_name || sourcePost.category_name, content: res.content || sourcePost.content };
    // Salvar no cache independente do idioma atual
    translationCache.current[targetLang] = translated;
    // Só aplicar se ainda for o idioma ativo
    if (currentLangRef.current === targetLang) {
      setPost(translated);
      setTranslating(false);
    }
  };

  const estimateReadTime = (content) => {
    const words = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  if (loading && slug) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t('loading_posts')}</div>;
  if (!post) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 gap-4">
      <p>Post não encontrado.</p>
      <Link to={createPageUrl('BlogHome')}><Button variant="outline">{t('back_to_blog')}</Button></Link>
    </div>
  );

  const postUrl = window.location.href;

  return (
    <div className={readMode ? "bg-white" : "min-h-screen bg-white flex flex-col"}>
      {translating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-500 animate-pulse" />
      )}
      <PostSEO post={post} />
      <PostSchemaOrg post={post} />
      {!readMode && (
        <>
          <BlogHeader
            categories={translatedCategories}
            selectedCategory="none"
            onSelectCategory={(catId) => {
              if (catId === 'all') {
                navigate(createPageUrl('BlogHome'));
              } else {
                const cat = categories.find(c => c.id === catId);
                navigate(createPageUrl(`BlogCategory?id=${catId}${cat ? `&name=${encodeURIComponent(cat.name)}` : ''}`));
              }
            }}
          />
          <div className="border-b bg-white">
            <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
              <BlogBreadcrumb items={[
                ...(originalPost?.category_name ? [{ label: post.category_name || originalPost.category_name, href: createPageUrl(`BlogCategory?id=${originalPost.category_id}&name=${encodeURIComponent(originalPost.category_name)}`) }] : []),
                { label: post.title }
              ]} />
              <Button variant="ghost" size="sm" onClick={() => setReadMode(true)} className="text-gray-500 flex-shrink-0">
                <BookOpen className="w-4 h-4 mr-1" /> {t('reading_mode')}
              </Button>
            </div>
          </div>
        </>
      )}

      {readMode && (
        <div className="fixed top-4 right-4 z-50">
          <Button size="sm" variant="outline" onClick={() => setReadMode(false)} className="shadow-lg bg-white">
            <Eye className="w-3 h-3 mr-1" /> {t('exit_reading_mode')}
          </Button>
        </div>
      )}

      <article className={`${readMode ? 'max-w-2xl mx-auto px-6 py-16' : 'max-w-4xl mx-auto px-4 py-8'}`}>
        {post.cover_image_url && !readMode && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video">
            <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <header className="mb-8">
          {!readMode && post.category_name && (
            <Badge className="mb-3 bg-blue-100 text-blue-800">{post.category_name}</Badge>
          )}
          <h1 className={`font-bold text-gray-900 mb-4 leading-tight ${readMode ? 'text-3xl' : 'text-4xl'}`}>{post.title}</h1>
          {post.excerpt && <p className="text-gray-500 text-lg mb-4 leading-relaxed">{post.excerpt}</p>}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-4 border-b">
            {post.author_name && (
              <Link to={createPageUrl(`BlogAuthor?name=${encodeURIComponent(post.author_name)}&email=${encodeURIComponent(post.author_email || '')}`)}
                className="text-gray-700 font-medium hover:text-blue-600 transition-colors">
                {post.author_name}
              </Link>
            )}
            {post.published_date && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(post.published_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            )}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{estimateReadTime(post.content)} {t('min_read')}</span>
            {post.views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>}
          </div>
        </header>

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css" />
        <style>{`
          .blog-content pre {
            background: #282c34;
            border-radius: 8px;
            margin: 1.5rem 0;
            overflow-x: auto;
          }
          .blog-content pre code, .blog-content pre.ql-syntax {
            display: block;
            border-radius: 8px;
            padding: 20px;
            font-size: 14px;
            line-height: 1.7;
            overflow-x: auto;
            font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
            background: #282c34;
            color: #abb2bf;
          }
          .blog-content :not(pre) > code {
            background-color: #f3f4f6;
            color: #e83e8c;
            border-radius: 4px;
            padding: 2px 6px;
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 0.9em;
          }
        `}</style>
        <div
          ref={el => {
            if (!el) return;
            // Handle standard <pre><code> blocks
            el.querySelectorAll('pre code').forEach(block => {
              if (!block.dataset.highlighted) {
                hljs.highlightElement(block);
                block.dataset.highlighted = 'yes';
              }
            });
            // Handle Quill's <pre class="ql-syntax"> blocks (no inner <code>)
            el.querySelectorAll('pre.ql-syntax').forEach(block => {
              if (!block.dataset.highlighted) {
                const code = document.createElement('code');
                code.textContent = block.textContent;
                block.textContent = '';
                block.appendChild(code);
                hljs.highlightElement(code);
                block.dataset.highlighted = 'yes';
              }
            });
          }}
          className="prose prose-gray max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {!readMode && post.tag_names?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t items-center">
            <Tag className="w-4 h-4 text-gray-400" />
            {post.tag_names.map((tg, i) => (
              <Link key={i} to={createPageUrl(`BlogTag?name=${encodeURIComponent(tg)}`)}
                className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
                {tg}
              </Link>
            ))}
          </div>
        )}

        {!readMode && (
          <div className="mt-8 pt-4 border-t">
            <SocialShare url={postUrl} title={post.title} />
          </div>
        )}

        {!readMode && (
          <RelatedPosts currentPostId={post.id} categoryId={post.category_id} tagIds={post.tag_ids} />
        )}

        {!readMode && <CommentSection postId={post.id} />}
      </article>
      {!readMode && <BlogFooter categories={translatedCategories} />}
    </div>
  );
}

export default function BlogPost() {
  return (
    <LanguageProvider>
      <BlogPostContent />
    </LanguageProvider>
  );
}