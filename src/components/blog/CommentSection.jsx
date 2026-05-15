import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Reply, MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLanguage } from "@/components/blog/i18nContext.jsx";

function CommentForm({ postId, parentId, onSubmitted, onCancel }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ author_name: '', author_email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.author_name || !form.author_email || !form.content) return;
    setSubmitting(true);
    await base44.entities.Comment.create({
      post_id: postId,
      parent_id: parentId || null,
      author_name: form.author_name,
      author_email: form.author_email,
      content: form.content,
      status: 'pending',
      likes: 0,
      dislikes: 0
    });
    setSubmitting(false);
    setDone(true);
    if (onSubmitted) onSubmitted();
  };

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
      {t('comment_pending')}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-3 bg-gray-50 rounded-xl p-4 border">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder={`${t('your_name')} *`} value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} required />
        <Input placeholder={`${t('your_email')} *`} type="email" value={form.author_email} onChange={e => setForm(f => ({ ...f, author_email: e.target.value }))} required />
      </div>
      <Textarea placeholder={t('your_comment')} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={3} required />
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting} size="sm">
          {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {t('submit_comment')}
        </Button>
        {onCancel && <Button type="button" variant="outline" size="sm" onClick={onCancel}>{t('back_to_blog')}</Button>}
      </div>
    </form>
  );
}

function CommentItem({ comment, allComments, postId }) {
  const { t } = useLanguage();
  const [showReply, setShowReply] = useState(false);
  const [localLikes, setLocalLikes] = useState(comment.likes || 0);
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes || 0);
  const [voted, setVoted] = useState(null);

  const replies = allComments.filter(c => c.parent_id === comment.id);

  const handleVote = async (type) => {
    if (voted === type) return;
    const prev = voted;
    setVoted(type);
    const update = {};
    if (type === 'like') {
      update.likes = localLikes + 1;
      setLocalLikes(l => l + 1);
      if (prev === 'dislike') { update.dislikes = localDislikes - 1; setLocalDislikes(d => d - 1); }
    } else {
      update.dislikes = localDislikes + 1;
      setLocalDislikes(d => d + 1);
      if (prev === 'like') { update.likes = localLikes - 1; setLocalLikes(l => l - 1); }
    }
    await base44.entities.Comment.update(comment.id, update);
  };

  return (
    <div className="space-y-3">
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
            {comment.author_name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 text-sm">{comment.author_name}</span>
              <span className="text-xs text-gray-400">{format(new Date(comment.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => handleVote('like')} className={`flex items-center gap-1 text-xs transition-colors ${voted === 'like' ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}>
                <ThumbsUp className="w-3 h-3" /> {localLikes}
              </button>
              <button onClick={() => handleVote('dislike')} className={`flex items-center gap-1 text-xs transition-colors ${voted === 'dislike' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                <ThumbsDown className="w-3 h-3" /> {localDislikes}
              </button>
              <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <Reply className="w-3 h-3" /> {t('leave_comment')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReply && (
        <div className="ml-8">
          <CommentForm postId={postId} parentId={comment.id} onCancel={() => setShowReply(false)} onSubmitted={() => setShowReply(false)} />
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} allComments={allComments} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId }) {
  const { t } = useLanguage();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadComments(); }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    const data = await base44.entities.Comment.filter({ post_id: postId, status: 'approved' }, '-created_date', 100);
    setComments(data);
    setLoading(false);
  };

  const rootComments = comments.filter(c => !c.parent_id);

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" /> {t('comments')} ({comments.length})
      </h2>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('leave_comment')}</h3>
        <CommentForm postId={postId} />
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-400">{t('loading_posts')}</div>
      ) : rootComments.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('no_comments')}</p>
      ) : (
        <div className="space-y-4">
          {rootComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} allComments={comments} postId={postId} />
          ))}
        </div>
      )}
    </section>
  );
}