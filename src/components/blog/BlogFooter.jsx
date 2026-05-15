import React from "react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Rss, Twitter, Linkedin, Github, Code2 } from "lucide-react";
import { useLanguage } from "@/components/blog/i18nContext.jsx";

export default function BlogFooter({ categories = [] }) {
  const year = new Date().getFullYear();
  const { t, lang } = useLanguage();

  return (
    <footer className="border-t bg-gray-950 text-gray-400 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gray-800 rounded-lg p-2">
                <Code2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">ReacttoHTML<span className="text-blue-400"> Blog</span></p>
                <p className="text-xs text-gray-500">{t('articles_subtitle')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('footer_description')}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">{t('categories')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl('BlogHome')} className="text-sm hover:text-white transition-colors">
                  {t('all_posts')}
                </Link>
              </li>
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link
                    to={createPageUrl(`BlogCategory?id=${cat.id}&name=${encodeURIComponent(cat.name)}`)}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">{t('links')}</h3>
            <ul className="space-y-2">
              <li><Link to={createPageUrl('BlogHome')} className="text-sm hover:text-white transition-colors">Blog</Link></li>
              <li><Link to={createPageUrl('BlogSearch')} className="text-sm hover:text-white transition-colors">{t('search')}</Link></li>
              <li><a href="/sitemap.xml" className="text-sm hover:text-white transition-colors flex items-center gap-1.5"><Rss className="w-3.5 h-3.5" /> {t('rss_sitemap')}</a></li>
            </ul>
            <div className="flex gap-3 mt-5">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                <Twitter className="w-3.5 h-3.5 text-gray-400" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                <Linkedin className="w-3.5 h-3.5 text-gray-400" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                <Github className="w-3.5 h-3.5 text-gray-400" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-600">© {year} ReacttoHTML Blog. {t('all_rights_reserved')}</p>
          <p className="text-xs text-gray-600">{t('developed_by')} <a href="https://reacttohtml.com" className="hover:text-gray-400 transition-colors">React to Html</a></p>
        </div>
      </div>
    </footer>
  );
}