import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Sparkles, Share2, AlignLeft, Type, Copy, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AiToolsPanel({ form, aiProvider, notify, onApplyTitle }) {
  const [loading, setLoading] = useState(null);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [socialPosts, setSocialPosts] = useState(null);
  const [readabilityResult, setReadabilityResult] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleSuggestTitles = async () => {
    if (!form.title && !form.content) {
      notify('Escreva um título ou conteúdo antes.', 'info');
      return;
    }
    setLoading('titles');
    const res = await base44.functions.invoke('blogAiTools', {
      action: 'suggest_titles',
      title: form.title,
      content: form.content,
      ai_provider: aiProvider
    });
    setTitleSuggestions(res.data?.titles || []);
    setLoading(null);
  };

  const handleGenerateSocialPosts = async () => {
    if (!form.content && !form.title) {
      notify('Escreva o conteúdo antes de gerar posts para redes sociais.', 'info');
      return;
    }
    setLoading('social');
    const res = await base44.functions.invoke('blogAiTools', {
      action: 'generate_social_posts',
      title: form.title,
      content: form.content,
      excerpt: form.excerpt,
      ai_provider: aiProvider
    });
    setSocialPosts(res.data);
    setLoading(null);
  };

  const handleReadability = async () => {
    if (!form.content) {
      notify('Escreva o conteúdo antes de analisar a legibilidade.', 'info');
      return;
    }
    setLoading('readability');
    const res = await base44.functions.invoke('blogAiTools', {
      action: 'analyze_readability',
      content: form.content,
      title: form.title,
      ai_provider: aiProvider
    });
    setReadabilityResult(res.data);
    setLoading(null);
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-purple-800 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> Ferramentas de IA
      </p>

      <Tabs defaultValue="titles">
        <TabsList className="w-full text-xs h-8 bg-white/70">
          <TabsTrigger value="titles" className="text-xs flex-1"><Type className="w-3 h-3 mr-1" />Títulos</TabsTrigger>
          <TabsTrigger value="social" className="text-xs flex-1"><Share2 className="w-3 h-3 mr-1" />Social</TabsTrigger>
          <TabsTrigger value="readability" className="text-xs flex-1"><AlignLeft className="w-3 h-3 mr-1" />Leitura</TabsTrigger>
        </TabsList>

        {/* Titles Tab */}
        <TabsContent value="titles" className="space-y-2 mt-2">
          <Button size="sm" onClick={handleSuggestTitles} disabled={loading === 'titles'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-8">
            {loading === 'titles' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
            Sugerir títulos alternativos
          </Button>
          {titleSuggestions.length > 0 && (
            <div className="space-y-1">
              {titleSuggestions.map((t, i) => (
                <div key={i} className="flex items-start gap-1">
                  <button onClick={() => onApplyTitle(t)}
                    className="flex-1 text-left text-xs p-2 bg-white rounded border hover:border-purple-400 hover:bg-purple-50 transition-colors">
                    {t}
                  </button>
                  <button onClick={() => copyToClipboard(t, `title-${i}`)} className="p-2 text-gray-400 hover:text-gray-600">
                    {copiedIdx === `title-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-2 mt-2">
          <Button size="sm" onClick={handleGenerateSocialPosts} disabled={loading === 'social'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-8">
            {loading === 'social' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Share2 className="w-3 h-3 mr-1" />}
            Gerar posts para redes sociais
          </Button>
          {socialPosts && (
            <div className="space-y-2">
              {[
                { key: 'twitter', label: 'Twitter/X', color: 'bg-sky-50 border-sky-200' },
                { key: 'linkedin', label: 'LinkedIn', color: 'bg-blue-50 border-blue-200' },
                { key: 'instagram', label: 'Instagram', color: 'bg-pink-50 border-pink-200' },
              ].map(({ key, label, color }) => socialPosts[key] && (
                <div key={key} className={`rounded-lg p-2 border ${color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                    <button onClick={() => copyToClipboard(socialPosts[key], key)} className="text-gray-400 hover:text-gray-600">
                      {copiedIdx === key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{socialPosts[key]}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Readability Tab */}
        <TabsContent value="readability" className="space-y-2 mt-2">
          <Button size="sm" onClick={handleReadability} disabled={loading === 'readability'}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-8">
            {loading === 'readability' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <AlignLeft className="w-3 h-3 mr-1" />}
            Analisar legibilidade
          </Button>
          {readabilityResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-white rounded-lg p-2 border">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  readabilityResult.score >= 70 ? 'bg-green-100 text-green-700' :
                  readabilityResult.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  {readabilityResult.score}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">{readabilityResult.level}</p>
                  <p className="text-xs text-gray-500">{readabilityResult.summary}</p>
                </div>
              </div>
              {readabilityResult.suggestions?.length > 0 && (
                <ul className="space-y-1">
                  {readabilityResult.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-gray-600 bg-white p-2 rounded border flex items-start gap-1">
                      <span className="text-amber-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}