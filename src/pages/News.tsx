import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { CardGridSkeleton } from '@/components/shared/Skeletons';
import { useScrollReveal } from '@/hooks/useScrollReveal';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function News() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q.eq('category', filter);
    q.then(({ data, error }) => {
      if (error) console.error('Failed to load posts:', error);
      setPosts(data || []);
      setLoading(false);
    });
  }, [filter]);

  useEffect(() => {
    const channel = supabase.channel('posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        const q = supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (filter !== 'all') q.eq('category', filter);
        q.then(({ data, error }) => {
          if (error) { console.error('Realtime posts refetch failed:', error); return; }
          setPosts(data || []);
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const categories = ['all', 'events', 'exams', 'sports', 'notices'];

  return (
    <Layout>
      <PageHeader title="News & Updates" subtitle="Stay informed about school activities and announcements" bannerKey="news" />
      <section className="py-16">
        <div className="container">
          <S>
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors active:scale-[0.97] ${
                    filter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>
                  {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </S>
          {loading ? <CardGridSkeleton count={6} /> : posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No news articles found.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <S key={post.id}>
                  <article className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full">
                    {post.image_url && (
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img src={post.image_url} alt={post.title} className="h-full w-full object-contain" loading="lazy" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-secondary uppercase tracking-wider">{post.category}</span>
                        <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{post.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{post.content}</p>
                    </div>
                  </article>
                </S>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
