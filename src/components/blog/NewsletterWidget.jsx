import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle } from "lucide-react";
import { useLanguage } from "@/components/blog/i18nContext.jsx";

export default function NewsletterWidget() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Try to use language context; fall back gracefully if not inside provider
  let t = (key) => key;
  try {
    const ctx = useLanguage();
    t = ctx.t;
  } catch (_) {}

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    const existing = await base44.entities.NewsletterSubscriber.filter({ email });
    if (existing.length > 0) {
      if (existing[0].status === 'unsubscribed') {
        await base44.entities.NewsletterSubscriber.update(existing[0].id, { status: 'active', name: name || existing[0].name });
        setSuccess(true);
      } else {
        setError(t('newsletter_already'));
      }
      setLoading(false);
      return;
    }
    await base44.entities.NewsletterSubscriber.create({ email, name, status: 'active', source: 'blog' });
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-semibold text-green-800">{t('newsletter_success')}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-gray-900">Newsletter</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">{t('newsletter_description')}</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          placeholder={t('newsletter_name_placeholder')}
          value={name}
          onChange={e => setName(e.target.value)}
          className="bg-white"
        />
        <Input
          type="email"
          placeholder={t('newsletter_email_placeholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="bg-white"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading ? "..." : t('newsletter_button')}
        </Button>
      </form>
    </div>
  );
}