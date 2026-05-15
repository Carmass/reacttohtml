import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, X, Trash2, MessageSquare } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  useEffect(() => { loadComments(); }, []);

  const loadComments = async () => {
    setLoading(true);
    const data = await base44.entities.Comment.list('-created_date', 200);
    setComments(data);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Comment.update(id, { status });
    setComments(comments.map(c => c.id === id ? { ...c, status } : c));

    // Notify post author when comment is approved
    if (status === 'approved') {
      await base44.functions.invoke('notifyPostAuthorOfComment', { comment_id: id });
    }
  };

  const deleteComment = async (id) => {
    if (!confirm("Excluir este comentário?")) return;
    await base44.entities.Comment.delete(id);
    setComments(comments.filter(c => c.id !== id));
  };

  const filtered = comments.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = !search || c.author_name?.toLowerCase().includes(search.toLowerCase()) || c.content?.toLowerCase().includes(search.toLowerCase()) || c.post_title?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: comments.length,
    pending: comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    rejected: comments.filter(c => c.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl('AdminBlog')}><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-6 h-6" /> Moderação de Comentários</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {[['pending', 'Pendentes'], ['all', 'Todos'], ['approved', 'Aprovados'], ['rejected', 'Rejeitados']].map(([val, label]) => (
              <Button key={val} variant={filter === val ? 'default' : 'outline'} size="sm" onClick={() => setFilter(val)}>
                {label} {counts[val] > 0 && <span className="ml-1 bg-gray-200 text-gray-700 rounded-full px-1.5 text-xs">{counts[val]}</span>}
              </Button>
            ))}
          </div>
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs ml-auto" />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">Nenhum comentário encontrado.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(comment => (
              <div key={comment.id} className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-900">{comment.author_name}</span>
                      <span className="text-gray-400 text-sm">{comment.author_email}</span>
                      {comment.parent_id && <Badge variant="outline" className="text-xs">Resposta</Badge>}
                      <Badge className={
                        comment.status === 'approved' ? 'bg-green-100 text-green-800' :
                        comment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {comment.status === 'approved' ? 'Aprovado' : comment.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                      </Badge>
                    </div>
                    {comment.post_title && (
                      <p className="text-xs text-blue-600 mb-2">Post: {comment.post_title}</p>
                    )}
                    <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{format(new Date(comment.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {comment.status !== 'approved' && (
                      <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => updateStatus(comment.id, 'approved')}>
                        <Check className="w-3 h-3 mr-1" /> Aprovar
                      </Button>
                    )}
                    {comment.status !== 'rejected' && (
                      <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-300 hover:bg-yellow-50" onClick={() => updateStatus(comment.id, 'rejected')}>
                        <X className="w-3 h-3 mr-1" /> Rejeitar
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => deleteComment(comment.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}