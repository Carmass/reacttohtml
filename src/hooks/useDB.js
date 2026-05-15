import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

function useQuery(fetcher, deps = []) {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result ?? []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

// ── Auth ───────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
}

// ── Build History ──────────────────────────────────────────────
export function useBuildHistory(limit = 50) {
  return useQuery(async () => {
    const { data } = await supabase
      .from('build_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data;
  }, [limit]);
}

export async function createBuild(payload) {
  const { data, error } = await supabase.from('build_history').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateBuild(id, payload) {
  const { error } = await supabase.from('build_history').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteBuild(id) {
  const { error } = await supabase.from('build_history').delete().eq('id', id);
  if (error) throw error;
}

// ── Projects ───────────────────────────────────────────────────
export function useProjects() {
  return useQuery(async () => {
    const { data } = await supabase.from('projects').select('*, build_history(id, status, created_at)').order('created_at', { ascending: false });
    return data;
  });
}

export async function createProject(payload) {
  const { data, error } = await supabase.from('projects').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProject(id, payload) {
  const { error } = await supabase.from('projects').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ── Deployments ────────────────────────────────────────────────
export function useDeployments(projectId) {
  return useQuery(async () => {
    if (!projectId) return [];
    const { data } = await supabase
      .from('deployments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    return data;
  }, [projectId]);
}

export async function createDeployment(payload) {
  const { data, error } = await supabase.from('deployments').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateDeployment(id, payload) {
  const { error } = await supabase.from('deployments').update(payload).eq('id', id);
  if (error) throw error;
}

// ── Plans ──────────────────────────────────────────────────────
export function usePlans() {
  return useQuery(async () => {
    const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('price');
    return data;
  });
}

// ── Notifications ──────────────────────────────────────────────
export function useNotifications() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: rows } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setData(rows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel('notifications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function markRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setData(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    setData(prev => prev.map(n => ({ ...n, read: true })));
  }

  return { data, loading, markRead, markAllRead, refetch: load };
}

// ── Profiles (admin) ───────────────────────────────────────────
export function useProfiles() {
  return useQuery(async () => {
    const { data } = await supabase.from('profiles').select('*, auth_users:id(email)').order('created_at', { ascending: false });
    return data;
  });
}

export async function updateProfile(id, payload) {
  const { error } = await supabase.from('profiles').update(payload).eq('id', id);
  if (error) throw error;
}

// ── Referrals ──────────────────────────────────────────────────
export function useReferrals() {
  return useQuery(async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*, referrer:referrer_id(name), referred:referred_id(name)')
      .order('created_at', { ascending: false });
    return data;
  });
}

// ── Blog: Posts ────────────────────────────────────────────────
export function usePosts(published = false) {
  return useQuery(async () => {
    let q = supabase.from('posts').select('*, categories(name), author:profiles(name)');
    if (published) q = q.eq('status', 'published');
    q = q.order('created_at', { ascending: false });
    const { data } = await q;
    return data;
  }, [published]);
}

export async function createPost(payload) {
  const { data, error } = await supabase.from('posts').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updatePost(id, payload) {
  const { error } = await supabase.from('posts').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ── Blog: Categories ───────────────────────────────────────────
export function useCategories() {
  return useQuery(async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    return data;
  });
}

// ── Blog: Tags ─────────────────────────────────────────────────
export function useTags() {
  return useQuery(async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    return data;
  });
}

// ── Blog: Comments ─────────────────────────────────────────────
export function useComments(postId) {
  return useQuery(async () => {
    if (!postId) return [];
    const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at');
    return data;
  }, [postId]);
}

export async function approveComment(id) {
  const { error } = await supabase.from('comments').update({ approved: true }).eq('id', id);
  if (error) throw error;
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

// ── Newsletter ─────────────────────────────────────────────────
export function useNewsletterSubscribers() {
  return useQuery(async () => {
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
    return data;
  });
}

// ── Media ──────────────────────────────────────────────────────
export function useMedia() {
  return useQuery(async () => {
    const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false });
    return data;
  });
}

export async function deleteMedia(id) {
  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) throw error;
}

// ── Invoices ───────────────────────────────────────────────────
export function useInvoices() {
  return useQuery(async () => {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    return data;
  });
}

// ── Admin Settings ─────────────────────────────────────────────
export async function getAdminSettings() {
  const { data } = await supabase.from('admin_settings').select('*').single();
  return data;
}

export async function saveAdminSettings(payload) {
  const { error } = await supabase.from('admin_settings').upsert(payload);
  if (error) throw error;
}

// ── Storage helpers ────────────────────────────────────────────
export async function uploadBuildFile(file, path) {
  const { data, error } = await supabase.storage.from('builds').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: url } = supabase.storage.from('builds').getPublicUrl(data.path);
  return url.publicUrl;
}

export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
