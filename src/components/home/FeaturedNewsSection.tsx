import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedNewsSkeleton } from '@/components/shared/Skeletons';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function FeaturedNewsSection() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, visible } = useScrollReveal();

  useEffect(() => {
    supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => { setPosts(data || []); setLoading(false); });

    const channel = supabase.channel('home-news')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(4)
          .then(({ data }) => setPosts(data || []));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <section className="py-20 md:py-28 bg-muted/50"><div className="container"><FeaturedNewsSkeleton /></div></section>;
  if (posts.length === 0) return null;

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <section ref={ref} className={`py-20 md:py-28 bg-muted/50 ${visible ? 'animate-reveal' : 'opacity-0'}`}>
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider mb-3">Latest Updates</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">School News</h2>
          </div>
          <Link to="/news" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            View All News <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Featured post */}
          <article className="group bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all overflow-hidden">
            {featured.image_url && (
              <div className="relative h-64 overflow-hidden">
                <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase">{featured.category}</span>
                </div>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Clock className="w-3.5 h-3.5" />
                {new Date(featured.created_at).toLocaleDateString('en-ZW', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{featured.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{featured.content}</p>
              <Link to="/news" className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary hover:underline">
                Read More <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>

          {/* Secondary posts */}
          <div className="flex flex-col gap-4">
            {rest.map((post, i) => (
              <article key={post.id} className={`group flex gap-4 bg-card rounded-xl border p-4 hover:shadow-md transition-all animate-reveal-delay-${i + 1}`}>
                {post.image_url ? (
                  <img src={post.image_url} alt={post.title} className="w-28 h-24 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-28 h-24 rounded-lg bg-primary/10 shrink-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary uppercase">{post.category}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{post.category}</span>
                  <h4 className="font-display font-semibold text-foreground mt-0.5 line-clamp-2">{post.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <Link to="/news" className="sm:hidden mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          View All News <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
