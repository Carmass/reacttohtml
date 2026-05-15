import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, X, Check, Wand2 } from "lucide-react";

const ACTIONS = [
  { key: "formal", label: "Tom Formal" },
  { key: "informal", label: "Tom Informal" },
  { key: "professional", label: "Tom Profissional" },
  { key: "expand", label: "Expandir Texto" },
  { key: "summarize", label: "Resumir Texto" },
  { key: "clarity", label: "Melhorar Clareza" },
];

export default function TextRefinementPopup({ selectedText, onReplace, onClose, aiProvider }) {
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);

  const handleAction = async (action) => {
    setLoading(action);
    setResult(null);
    const res = await base44.functions.invoke('blogAiTools', {
      action: 'refine_text',
      content: selectedText,
      refine_action: action,
      ai_provider: aiProvider
    });
    setResult(res.data?.refined_text || '');
    setLoading(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Wand2 className="w-4 h-4 text-purple-600" />
            Refinar Texto com IA
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 max-h-24 overflow-auto border">
            <p className="font-medium text-gray-500 text-xs mb-1">Texto selecionado:</p>
            {selectedText}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ACTIONS.map(a => (
              <button key={a.key} onClick={() => handleAction(a.key)} disabled={!!loading}
                className="px-3 py-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                {loading === a.key ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {a.label}
              </button>
            ))}
          </div>
          {result !== null && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Resultado:</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-gray-700 max-h-36 overflow-auto">
                {result}
              </div>
              <Button onClick={() => onReplace(result)} className="w-full bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" /> Substituir Texto
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}