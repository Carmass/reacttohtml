import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLanguage } from "@/components/blog/i18nContext.jsx";

export default function RelatedPosts({ currentPostId, categoryId, tagIds }) {
  const { t, lang } = useLanguage();
  const [related, setRelated] = useState([]);
  const [translatedRelated, setTranslatedRelated] = useState([]);

  useEffect(() => { loadRelated(); }, [currentPostId]);

  useEffect(() => {
    if (related.length === 0) return;
    if (lang === 'pt') {
      setTranslatedRelated(related);
    } else {
      translateTitles(related, lang);
    }
  }, [lang, related]);

  const translateTitles = async (posts, targetLang) => {
    const langNames = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese (Simplified)' };
    const langName = langNames[targetLang] || targetLang;
    const titles = posts.map(p => p.title);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate these blog post titles to ${langName}. Return JSON with a "titles" array in the same order.\n\nTitles: ${JSON.stringify(titles)}`,
      response_json_schema: { type: 'object', properties: { titles: { type: 'array', items: { type: 'string' } } } }
    });
    if (res?.titles?.length === posts.length) {
      setTranslatedRelated(posts.map((p, i) => ({ ...p, title: res.titles[i] })));
    }
  };

  const loadRelated = async () => {
    const all = await base44.entities.Post.filter({ status: 'published' }, '-published_date', 20);
    const scored = all
      .filter(p => p.id !== currentPostId)
      .map(p => {
        let score = 0;
        if (categoryId && p.category_id === categoryId) score += 2;
        if (tagIds?.length && p.tag_ids?.some(t => tagIds.includes(t))) score += 1;
        return { ...p, score };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    const result = scored.length > 0 ? scored : all.filter(p => p.id !== currentPostId).slice(0, 3);
    setRelated(result);
    setTranslatedRelated(result);
  };

  if (related.length === 0) return null;

  return (
    <section className="mt-10 pt-8 border-t">
      <h2 className="text-xl font-bold text-gray-900 mb-5">{t('related_posts')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {translatedRelated.map(post => (
          <Link key={post.id} to={createPageUrl(`BlogPost?slug=${post.slug}`)} className="group block border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            {post.cover_image_url && (
              <div className="aspect-video overflow-hidden">
                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">{post.title}</h3>
              {post.published_date && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(post.published_date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}