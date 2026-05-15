import { useState } from 'react';
import { C } from '../lib/tokens.js';
import { callEdgeFunction } from '../lib/supabase.js';

const FAQ_CATEGORIES = [
  {
    title: 'Compilação',
    items: [
      { q: 'O que é o React to HTML Compiler?', a: 'É uma plataforma que converte seus projetos React (gerados por ferramentas de IA como Base44, Lovable, Bolt e v0) em HTML estático, pronto para hospedar em qualquer servidor web.' },
      { q: 'Quais tipos de arquivo posso fazer upload?', a: 'Aceitamos .zip (projeto completo), .jsx, .tsx e .js. Projetos exportados do Base44, Lovable, Bolt e v0 funcionam nativamente.' },
      { q: 'Quanto tempo leva para compilar um projeto?', a: 'Geralmente entre 2 e 5 minutos, dependendo do tamanho do projeto e do tempo de setup das dependências no GitHub Actions.' },
      { q: 'O que acontece se minha compilação falhar?', a: 'Você receberá uma mensagem de erro com os detalhes. As causas mais comuns são dependências incompatíveis, imports não resolvidos ou sintaxe JSX com erros. Verifique os logs de build para detalhes.' },
      { q: 'Posso recompilar um projeto anterior?', a: 'Sim! Use o botão de recompilar no Histórico de Compilações para fazer upload de uma versão atualizada do projeto.' },
    ],
  },
  {
    title: 'Arquivo e Download',
    items: [
      { q: 'Como faço download do arquivo compilado?', a: 'Após a compilação, um botão "Baixar" ficará disponível no Histórico de Compilações. O arquivo é um ZIP contendo o HTML estático completo.' },
      { q: 'Quanto tempo os arquivos ficam armazenados?', a: 'Os arquivos ficam disponíveis por 30 dias no plano Free. Planos pagos têm armazenamento ilimitado.' },
      { q: 'Posso visualizar o arquivo original que enviei?', a: 'O arquivo original fica armazenado durante o processo de compilação e pode ser acessado pelo link na tabela de histórico.' },
      { q: 'Qual o tamanho máximo de arquivo permitido?', a: 'Plano Free: 10MB. Starter: 50MB. Pro e Business: 200MB.' },
    ],
  },
  {
    title: 'Conta e Perfil',
    items: [
      { q: 'Como altero minhas informações pessoais?', a: 'Acesse "Meu Perfil" no menu do usuário (canto superior direito) e edite suas informações. Clique em "Salvar Alterações" para confirmar.' },
      { q: 'Posso alterar minha foto de perfil?', a: 'Sim! Na página de Perfil, clique em "Alterar Foto" e envie uma imagem de até 2MB nos formatos JPG, PNG ou WebP.' },
      { q: 'Como faço para cancelar minha conta?', a: 'Na página de Perfil, na seção "Zona de Perigo", você pode solicitar a exclusão da conta. Esta ação é irreversível.' },
      { q: 'Posso usar a conta em múltiplos dispositivos?', a: 'Sim! Sua conta pode ser acessada de qualquer dispositivo. As sessões são gerenciadas automaticamente.' },
    ],
  },
  {
    title: 'Dashboard e Histórico',
    items: [
      { q: 'O que significa o "Score de Fraude" nas indicações?', a: 'É uma pontuação automática que avalia a qualidade da indicação. Quanto menor, melhor. Indicações com score alto podem ser invalidadas.' },
      { q: 'Como filtro meus builds no histórico?', a: 'Use os filtros de Status e Ferramenta de IA na parte superior da tabela do Histórico de Compilações no Dashboard.' },
      { q: 'Como excluir um build do histórico?', a: 'Clique no ícone de lixeira (🗑) ao lado do build que deseja excluir. Esta ação é permanente.' },
    ],
  },
  {
    title: 'Problemas Técnicos',
    items: [
      { q: 'Meu projeto não compila. O que fazer?', a: 'Verifique os logs de erro no detalhe do build. As causas mais comuns são: imports relativos incorretos, dependências ausentes no package.json, ou uso de APIs do navegador sem mock.' },
      { q: 'O download não está funcionando. Como resolver?', a: 'Tente recarregar a página e tentar novamente. Se o problema persistir, verifique se o build foi concluído com sucesso (status "Concluído").' },
      { q: 'Recebi notificações de erro que não reconheço.', a: 'Acesse o painel de Notificações (ícone 🔔 no cabeçalho) para ver os detalhes. Se suspeitar de atividade suspeita, altere sua senha imediatamente.' },
      { q: 'Como entrar em contato com o suporte técnico?', a: 'Use a aba "Abrir Ticket" nesta página. Nossa equipe responde em até 24 horas nos dias úteis.' },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--ovV)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 12 }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: C.on, lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: C.p, fontSize: 14, flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && (
        <div style={{ fontSize: 13, color: C.onV, lineHeight: 1.6, paddingBottom: 14 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage({ showToast }) {
  const [tab, setTab]       = useState('faq');
  const [search, setSearch] = useState('');
  const [question, setQuestion] = useState('');
  const [chat, setChat]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'compilation', message: '' });
  const [sending, setSending] = useState(false);

  const filteredFAQ = search
    ? FAQ_CATEGORIES.map(cat => ({
        ...cat,
        items: cat.items.filter(i =>
          i.q.toLowerCase().includes(search.toLowerCase()) ||
          i.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : FAQ_CATEGORIES;

  async function sendQuestion() {
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    setChat(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await callEdgeFunction('support-chat', { message: q, history: chat });
      setChat(prev => [...prev, { role: 'assistant', text: res.reply ?? 'Desculpe, não consegui processar sua pergunta.' }]);
    } catch {
      setChat(prev => [...prev, { role: 'assistant', text: 'Não foi possível conectar ao suporte IA. Por favor, verifique nossa FAQ ou entre em contato por e-mail.' }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendTicket() {
    if (!ticketForm.subject || !ticketForm.message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    showToast('✅ Ticket enviado! Responderemos em até 24h.');
    setTicketForm({ subject: '', category: 'compilation', message: '' });
    setSending(false);
  }

  return (
    <div className="fade-in">
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab ${tab === 'faq' ? 'a' : ''}`} onClick={() => setTab('faq')}>❓ Perguntas Frequentes</button>
        <button className={`tab ${tab === 'ai' ? 'a' : ''}`} onClick={() => setTab('ai')}>💬 Chat de Suporte</button>
        <button className={`tab ${tab === 'ticket' ? 'a' : ''}`} onClick={() => setTab('ticket')}>🎫 Abrir Ticket</button>
      </div>

      {/* FAQ Tab */}
      {tab === 'faq' && (
        <div>
          {/* Search */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="cb" style={{ paddingTop: 12, paddingBottom: 12 }}>
              <div className="search-wrap" style={{ width: '100%' }}>
                <span className="search-ico">🔍</span>
                <input
                  className="fi search-input"
                  placeholder="Buscar nas perguntas frequentes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredFAQ.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">🔍</div>
              Nenhuma pergunta encontrada para "{search}"
            </div>
          ) : (
            filteredFAQ.map(cat => (
              <div key={cat.title} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.p, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {cat.title}
                </div>
                <div className="card">
                  <div style={{ padding: '0 20px' }}>
                    {cat.items.map((item, i) => (
                      <FAQItem key={i} q={item.q} a={item.a} />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat Tab */}
      {tab === 'ai' && (
        <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="ch">
            <span className="ct">💬 Chat de Suporte</span>
            <span className="chip cp">Claude AI</span>
          </div>
          <div className="cb">
            <div style={{ minHeight: 280, maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, padding: 4 }}>
              {chat.length === 0 && (
                <div className="empty" style={{ padding: 40 }}>
                  <div style={{ fontSize: 42, marginBottom: 8 }}>🤖</div>
                  <div style={{ fontWeight: 600 }}>Olá! Sou o assistente do React to HTML Compiler.</div>
                  <div style={{ fontSize: 12, color: C.onV, marginTop: 4, textAlign: 'center' }}>
                    Pergunte sobre compilações, builds, planos, erros técnicos ou qualquer dúvida.
                  </div>
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? C.p : C.s1,
                  color: m.role === 'user' ? '#fff' : C.on,
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 14px', maxWidth: '80%', fontSize: 13, lineHeight: 1.5,
                }}>
                  {m.text}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', background: C.s1, borderRadius: '14px 14px 14px 4px', padding: '10px 14px' }}>
                  <div className="spinner" style={{ width: 16, height: 16, color: C.p }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="fi"
                placeholder="Digite sua dúvida..."
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && sendQuestion()}
              />
              <button className="btn bf" onClick={sendQuestion} disabled={loading || !question.trim()} style={{ flexShrink: 0 }}>
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Tab */}
      {tab === 'ticket' && (
        <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="ch"><span className="ct">🎫 Abrir Ticket de Suporte</span></div>
          <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, background: C.pC, borderRadius: 8, fontSize: 13, color: C.p }}>
              💡 Nossa equipe responde em até 24 horas nos dias úteis. Para suporte urgente, use o Chat de Suporte.
            </div>
            <div className="fld">
              <label>Categoria</label>
              <select className="fi" value={ticketForm.category} onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}>
                <option value="compilation">Problema na compilação</option>
                <option value="download">Problema no download</option>
                <option value="account">Conta e acesso</option>
                <option value="billing">Cobrança e planos</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div className="fld">
              <label>Assunto</label>
              <input className="fi" placeholder="Descreva brevemente o problema" value={ticketForm.subject} onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="fld">
              <label>Descrição detalhada</label>
              <textarea className="fi" rows={6} placeholder="Descreva o problema em detalhes. Inclua passos para reproduzir, mensagens de erro, etc." value={ticketForm.message} onChange={e => setTicketForm(f => ({ ...f, message: e.target.value }))} />
            </div>
            <button className="btn bf" style={{ width: '100%', justifyContent: 'center' }} onClick={sendTicket} disabled={sending || !ticketForm.subject || !ticketForm.message}>
              {sending ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Enviando...</> : '🎫 Enviar Ticket'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
