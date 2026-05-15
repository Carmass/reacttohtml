import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, Send, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendResult, setSendResult] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    const subs = await base44.entities.NewsletterSubscriber.list('-created_date', 500);
    setSubscribers(subs);
    setLoading(false);
  };

  const deleteSubscriber = async (id) => {
    if (!confirm("Remover assinante?")) return;
    await base44.entities.NewsletterSubscriber.delete(id);
    setSubscribers(subs => subs.filter(s => s.id !== id));
  };

  const toggleStatus = async (sub) => {
    const newStatus = sub.status === 'active' ? 'unsubscribed' : 'active';
    await base44.entities.NewsletterSubscriber.update(sub.id, { status: newStatus });
    setSubscribers(subs => subs.map(s => s.id === sub.id ? { ...s, status: newStatus } : s));
  };

  const sendNewsletter = async () => {
    if (!subject || !body) return;
    if (!confirm(`Enviar email para todos os assinantes ativos?`)) return;
    setSending(true);
    setSendResult(null);
    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    let sent = 0, failed = 0;
    for (const sub of activeSubscribers) {
      try {
        await base44.integrations.Core.SendEmail({
          to: sub.email,
          subject,
          body: body.replace(/\n/g, '<br>') + `<br><br><hr><small>Para cancelar a assinatura, <a href="#">clique aqui</a>.</small>`
        });
        sent++;
      } catch (e) {
        failed++;
      }
    }
    setSendResult({ sent, failed, total: activeSubscribers.length });
    setSending(false);
  };

  const filtered = subscribers.filter(s => {
    const matchSearch = !search || s.email.toLowerCase().includes(search.toLowerCase()) || s.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = subscribers.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{subscribers.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-gray-500 mt-1">Ativos</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{subscribers.length - activeCount}</div>
          <div className="text-sm text-gray-500 mt-1">Cancelados</div>
        </div>
      </div>

      {/* Send newsletter */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Send className="w-4 h-4" /> Disparar Email para Assinantes</h2>
        <p className="text-sm text-gray-500">Será enviado para <strong>{activeCount} assinantes ativos</strong>.</p>
        <Input placeholder="Assunto do email" value={subject} onChange={e => setSubject(e.target.value)} />
        <Textarea placeholder="Corpo do email (texto simples)..." value={body} onChange={e => setBody(e.target.value)} rows={5} />
        {sendResult && (
          <div className={`text-sm p-3 rounded-lg ${sendResult.failed === 0 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
            ✅ Enviados: {sendResult.sent} | ❌ Falhas: {sendResult.failed} de {sendResult.total}
          </div>
        )}
        <Button onClick={sendNewsletter} disabled={sending || !subject || !body || activeCount === 0} className="bg-blue-600 hover:bg-blue-700">
          {sending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</> : <><Send className="w-4 h-4 mr-2" />Enviar Newsletter</>}
        </Button>
      </div>

      {/* Subscribers list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex gap-3 items-center flex-wrap">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mr-auto"><Users className="w-4 h-4" /> Assinantes</h2>
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          <div className="flex gap-2">
            {['all', 'active', 'unsubscribed'].map(s => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Cancelados'}
              </Button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum assinante encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Email</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden md:table-cell">Nome</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden md:table-cell">Data</th>
                <th className="text-right p-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{sub.email}</td>
                  <td className="p-3 text-gray-500 hidden md:table-cell">{sub.name || '-'}</td>
                  <td className="p-3">
                    <button onClick={() => toggleStatus(sub)}>
                      <Badge className={sub.status === 'active' ? 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200' : 'bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200'}>
                        {sub.status === 'active' ? 'Ativo' : 'Cancelado'}
                      </Badge>
                    </button>
                  </td>
                  <td className="p-3 text-gray-400 hidden md:table-cell">{sub.created_date ? format(new Date(sub.created_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteSubscriber(sub.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}