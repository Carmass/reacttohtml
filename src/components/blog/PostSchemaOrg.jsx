import { useEffect } from "react";

export default function PostSchemaOrg({ post }) {
  useEffect(() => {
    if (!post) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt || post.meta_description || "",
      "image": post.cover_image_url ? [post.cover_image_url] : undefined,
      "datePublished": post.published_date || post.created_date,
      "dateModified": post.updated_date || post.published_date || post.created_date,
      "author": {
        "@type": "Person",
        "name": post.author_name || "Autor"
      },
      "publisher": {
        "@type": "Organization",
        "name": "React to HTML Blog",
        "logo": {
          "@type": "ImageObject",
          "url": `${window.location.origin}/logo.png`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.href
      },
      "keywords": post.keywords?.join(", ") || post.tag_names?.join(", ") || "",
      "articleSection": post.category_name || "",
      "wordCount": post.content ? post.content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0,
      "timeRequired": `PT${post.read_time || 5}M`
    };

    // Remove undefined fields
    Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);

    let el = document.querySelector('script[type="application/ld+json"]#blog-post-schema');
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "blog-post-schema";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.querySelector('script[type="application/ld+json"]#blog-post-schema');
      if (existing) existing.remove();
    };
  }, [post]);

  return null;
}