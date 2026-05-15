import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  try {
    const now = new Date().toISOString();

    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, author_id')
      .eq('status', 'scheduled')
      .lte('scheduled_date', now);

    if (error) throw error;
    if (!posts?.length) {
      return new Response(JSON.stringify({ published: 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    const ids = posts.map(p => p.id);
    const { error: updateError } = await supabase
      .from('posts')
      .update({ status: 'published', updated_at: now })
      .in('id', ids);

    if (updateError) throw updateError;

    // Notify authors
    for (const post of posts) {
      if (post.author_id) {
        await supabase.from('notifications').insert({
          user_id: post.author_id,
          title: '📝 Post publicado',
          message: `"${post.title}" foi publicado automaticamente.`,
          icon: '📝',
        });
      }
    }

    return new Response(JSON.stringify({ published: posts.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
