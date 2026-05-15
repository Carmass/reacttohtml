import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function BlogBreadcrumb({ items = [] }) {
  // items: [{ label, href }]
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 py-3 px-4 max-w-4xl mx-auto">
      <Link to={createPageUrl('BlogHome')} className="flex items-center gap-1 hover:text-gray-900 transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span>Blog</span>
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          {item.href ? (
            <Link to={item.href} className="hover:text-gray-900 transition-colors truncate max-w-[200px]">{item.label}</Link>
          ) : (
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}