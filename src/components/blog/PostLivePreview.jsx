import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

export default function PostLivePreview({ post, onClose }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.querySelectorAll('pre code').forEach(block => {
      if (!block.dataset.highlighted) {
        hljs.highlightElement(block);
        block.dataset.highlighted = 'yes';
      }
    });
    contentRef.current.querySelectorAll('pre.ql-syntax').forEach(block => {
      if (!block.dataset.highlighted) {
        const code = document.createElement('code');
        code.textContent = block.textContent;
        block.textContent = '';
        block.appendChild(code);
        hljs.highlightElement(code);
        block.dataset.highlighted = 'yes';
      }
    });
  }, [post.content]);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Pré-visualização ao vivo</span>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Não salvo</span>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="w-4 h-4 mr-1" /> Fechar
        </Button>
      </div>

      <article className="max-w-3xl mx-auto px-4 py-10">
        {post.cover_image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video">
            <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{post.title || 'Título do post'}</h1>
        {post.excerpt && <p className="text-gray-500 text-lg mb-6 leading-relaxed">{post.excerpt}</p>}
        <div className="border-t border-b py-3 mb-8 flex gap-4 text-sm text-gray-400">
          {post.category_name && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{post.category_name}</span>}
          {post.tag_names?.map((t, i) => <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">#{t}</span>)}
        </div>

        <style>{`
          .preview-content h1, .preview-content h2, .preview-content h3 { font-weight: 700; margin: 1.5rem 0 0.75rem; color: #111; }
          .preview-content h2 { font-size: 1.5rem; }
          .preview-content h3 { font-size: 1.25rem; }
          .preview-content p { margin-bottom: 1rem; line-height: 1.75; color: #374151; }
          .preview-content ul, .preview-content ol { margin: 1rem 0 1rem 1.5rem; }
          .preview-content li { margin-bottom: 0.5rem; line-height: 1.6; }
          .preview-content a { color: #2563eb; text-decoration: underline; }
          .preview-content pre { background: #282c34; border-radius: 8px; margin: 1.5rem 0; overflow-x: auto; }
          .preview-content pre code, .preview-content pre.ql-syntax { display: block; padding: 20px; font-size: 14px; line-height: 1.7; font-family: 'Fira Code', monospace; background: #282c34; color: #abb2bf; }
          .preview-content :not(pre) > code { background: #f3f4f6; color: #e83e8c; border-radius: 4px; padding: 2px 6px; font-size: 0.9em; }
          .preview-content img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
          .preview-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; color: #6b7280; margin: 1rem 0; }
        `}</style>

        <div
          ref={contentRef}
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: post.content || '<p style="color:#9ca3af">Comece a escrever o conteúdo do post...</p>' }}
        />
      </article>
    </div>
  );
}