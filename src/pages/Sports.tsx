import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { CardGridSkeleton } from '@/components/shared/Skeletons';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Trophy } from 'lucide-react';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function Sports() {
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('sports').select('*').order('name').then(({ data, error }) => {
      if (error) console.error('Failed to load sports:', error);
      setSports(data || []);
      setLoading(false);
    });
    const channel = supabase.channel('sports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sports' }, () => {
        supabase.from('sports').select('*').order('name').then(({ data, error }) => {
          if (error) { console.error('Realtime sports refetch failed:', error); return; }
          setSports(data || []);
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Layout>
      <PageHeader title="Sports" subtitle="Building teamwork, discipline, and sportsmanship" bannerKey="sports" />
      <section className="py-16">
        <div className="container">
          {loading ? <CardGridSkeleton count={6} columns="sm:grid-cols-2 lg:grid-cols-3" /> : sports.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No sports have been added yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sports.map(s => (
                <S key={s.id}>
                  <Link to={`/sports/${s.id}`} className="block h-full">
                    <div className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                      {s.image_url ? (
                        <div className="aspect-video w-full overflow-hidden bg-muted">
                          <img src={s.image_url} alt={s.name} className="h-full w-full object-contain" loading="lazy" />
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-primary/10 flex items-center justify-center"><Trophy className="w-12 h-12 text-primary/40" /></div>
                      )}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-display text-lg font-semibold text-foreground">{s.name}</h3>
                        {s.season && <span className="inline-block mt-1 text-xs font-medium bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded w-fit">Season: {s.season}</span>}
                        {s.description && <p className="mt-2 text-sm text-muted-foreground flex-1 line-clamp-3">{s.description}</p>}
                      </div>
                    </div>
                  </Link>
                </S>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
