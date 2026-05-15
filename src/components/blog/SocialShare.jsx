import React from "react";
import { Share2 } from "lucide-react";
import { useLanguage } from "@/components/blog/i18nContext.jsx";

export default function SocialShare({ url, title }) {
  const { t } = useLanguage();
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const platforms = [
    { name: 'Twitter/X', color: 'bg-black hover:bg-gray-800', href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`, icon: '𝕏' },
    { name: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, icon: 'f' },
    { name: 'LinkedIn', color: 'bg-blue-700 hover:bg-blue-800', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, icon: 'in' },
    { name: 'WhatsApp', color: 'bg-green-500 hover:bg-green-600', href: `https://wa.me/?text=${encodedTitle}%20${encoded}`, icon: '💬' },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-gray-600 flex items-center gap-1"><Share2 className="w-4 h-4" /> {t('share')}:</span>
      {platforms.map(p => (
        <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer"
          className={`${p.color} text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors`}>
          {p.icon} {p.name}
        </a>
      ))}
    </div>
  );
}