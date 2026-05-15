/**
 * Supabase compatibility shim that provides the same API surface as Base44 SDK.
 * All pages imported from the reference app use `base44.*` calls — this file
 * redirects them transparently to Supabase/Edge Functions.
 */
import { supabase, callEdgeFunction } from '../lib/supabase.js';

// ── Edge Function name mapping (camelCase → kebab-case) ──────────────────────
const FUNCTION_MAP = {
  checkDailyLimit:        'check-daily-limit',
  startToolBuild:         'start-tool-build',
  pollToolBuild:          'poll-tool-build',
  downloadCompiledFile:   'download-compiled-file',
  incrementUsage:         'increment-usage',
  sendBuildNotification:  'send-build-notification',
  processReferral:        'process-referral',
  supportChat:            'support-chat',
  deployGithub:           'deploy-github',
  stripeCreateCheckout:   'stripe-create-checkout',
};

// ── Auth helpers ─────────────────────────────────────────────────────────────
const auth = {
  async me() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    return {
      id: session.user.id,
      email: session.user.email,
      full_name: profile?.name || session.user.user_metadata?.full_name || '',
      name: profile?.name || session.user.user_metadata?.full_name || '',
      role: profile?.role || 'user',
      plan_type: profile?.plan_type || 'free',
      avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url || null,
      ...profile,
    };
  },

  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  redirectToLogin(returnUrl) {
    window.location.href = '/LoginPage' + (returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : '');
  },

  logout(returnUrl) {
    supabase.auth.signOut().then(() => {
      window.location.href = returnUrl || '/Landing';
    });
  },
};

// ── Generic entity factory ────────────────────────────────────────────────────
function makeEntity(tableName, { dateField = 'created_at', userField = 'user_id', selectClause = '*' } = {}) {
  return {
    async filter(conditions = {}, sort = `-${dateField}`, limit = 100) {
      const { data: { session } } = await supabase.auth.getSession();

      let q = supabase.from(tableName).select(selectClause);

      // Map conditions: created_by (email) → user_id
      for (const [key, val] of Object.entries(conditions)) {
        if (key === 'created_by') {
          if (session?.user?.id) q = q.eq(userField, session.user.id);
        } else {
          q = q.eq(key, val);
        }
      }

      // Sort: '-field' means descending, 'field' means ascending
      if (sort) {
        const descending = sort.startsWith('-');
        const field = sort.replace(/^-/, '');
        // Map date field names
        const mappedField = field === 'created_date' ? dateField : field;
        q = q.order(mappedField, { ascending: !descending });
      }

      q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;

      // Normalize date fields for reference app compatibility
      return (data || []).map(row => normalizeDates(row));
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select(selectClause).eq('id', id).single();
      if (error) throw error;
      return normalizeDates(data);
    },

    async create(payload) {
      const { data: { session } } = await supabase.auth.getSession();
      const record = { ...payload };

      // Auto-inject user_id if entity has one
      if (userField && session?.user?.id && !record[userField]) {
        record[userField] = session.user.id;
      }

      // Map created_by → user_id if present
      if (record.created_by) {
        record[userField] = session?.user?.id;
        delete record.created_by;
      }

      const { data, error } = await supabase.from(tableName).insert(record).select().single();
      if (error) throw error;
      return normalizeDates(data);
    },

    async update(id, payload) {
      const { error } = await supabase.from(tableName).update(payload).eq('id', id);
      if (error) throw error;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },

    // list(sort, limit) — fetches all records without user filtering (for admin use)
    async list(sort = `-${dateField}`, limit = 100) {
      let q = supabase.from(tableName).select(selectClause);

      if (sort) {
        const descending = sort.startsWith('-');
        const field = sort.replace(/^-/, '');
        const mappedField = field === 'created_date' ? dateField : field;
        q = q.order(mappedField, { ascending: !descending });
      }

      q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(row => normalizeDates(row));
    },
  };
}

// ── Date normalization ─────────────────────────────────────────────────────────
function normalizeDates(row) {
  if (!row) return row;
  const out = { ...row };
  // Reference app uses created_date, our DB uses created_at
  if (out.created_at && !out.created_date) {
    out.created_date = out.created_at;
  }
  return out;
}

// ── Entities ──────────────────────────────────────────────────────────────────
const entities = {
  BuildHistory: makeEntity('build_history'),
  Project:      makeEntity('projects'),
  Deployment:   makeEntity('deployments', { userField: 'user_id' }),
  Profile:      makeEntity('profiles', { userField: 'id' }),
  Referral:     makeEntity('referrals', { userField: 'referrer_id' }),
  Post:         makeEntity('posts', { userField: 'author_id' }),
  Category:     makeEntity('categories', { userField: null }),
  Tag:          makeEntity('tags', { userField: null }),
  Comment:      makeEntity('comments', { userField: 'user_id' }),
  Notification: makeEntity('notifications'),
  Plan:         makeEntity('plans', { userField: null }),
  Invoice:      makeEntity('invoices'),
  Media:        makeEntity('media', { userField: 'user_id' }),
  AdminSetting: makeEntity('admin_settings', { userField: null }),
  Testimonial:  makeEntity('testimonials', { userField: 'user_id' }),
  Support:      makeEntity('support_tickets', { userField: 'user_id' }),
};

// ── Functions (Edge Functions) ─────────────────────────────────────────────────
const functions = {
  async invoke(name, body = {}) {
    const edgeName = FUNCTION_MAP[name];
    if (!edgeName) {
      console.warn(`[base44] No edge function mapping for: ${name}`);
      return { data: {} };
    }
    try {
      // downloadCompiledFile: fetch file directly and return base64
      if (name === 'downloadCompiledFile') {
        const { fileUrl, fileName } = body;
        const result = await downloadFileAsBase64(fileUrl, fileName);
        return { data: result };
      }

      const result = await callEdgeFunction(edgeName, body);
      // Normalize response: our edge functions return { key: value }
      // Reference app expects { data: { key: value } }
      const normalized = normalizeEdgeResponse(name, result);
      return { data: normalized };
    } catch (err) {
      console.error(`[base44] Edge function ${name} failed:`, err);
      throw err;
    }
  },
};

// Normalize edge function responses to match reference app expectations
function normalizeEdgeResponse(name, result) {
  if (name === 'pollToolBuild') {
    // Our function returns { status, compiled_url }
    // Reference app expects { status, success, compiled_file_url }
    const out = { ...result };
    if (out.status === 'completed') {
      out.success = true;
      if (out.compiled_url && !out.compiled_file_url) {
        out.compiled_file_url = out.compiled_url;
      }
    }
    return out;
  }
  return result;
}

// Override downloadCompiledFile to fetch file and return base64 (reference app expects this)
async function downloadFileAsBase64(fileUrl, fileName) {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error('Failed to fetch file');
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    base64: btoa(binary),
    fileName: fileName || fileUrl.split('/').pop(),
  };
}

// ── Integrations (file upload) ─────────────────────────────────────────────────
const integrations = {
  Core: {
    async UploadFile({ file }) {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';
      const ext = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('builds')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('builds')
        .getPublicUrl(data.path);

      return { file_url: urlData.publicUrl };
    },
  },
};

// ── App logs (no-op shim) ─────────────────────────────────────────────────────
const appLogs = {
  logUserInApp: async () => {},
};

export const base44 = {
  auth,
  entities,
  functions,
  integrations,
  appLogs,
};
