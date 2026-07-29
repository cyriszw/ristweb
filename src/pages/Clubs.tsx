import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { CardGridSkeleton } from '@/components/shared/Skeletons';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Users } from 'lucide-react';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function Clubs() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('clubs').select('*').order('name').then(({ data, error }) => {
      if (error) console.error('Failed to load clubs:', error);
      setClubs(data || []);
      setLoading(false);
    });
    const channel = supabase.channel('clubs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, () => {
        supabase.from('clubs').select('*').order('name').then(({ data, error }) => {
          if (error) { console.error('Realtime clubs refetch failed:', error); return; }
          setClubs(data || []);
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Layout>
      <PageHeader title="Clubs & Societies" subtitle="Explore your interests and develop new skills" bannerKey="clubs" />
      <section className="py-16">
        <div className="container">
          {loading ? <CardGridSkeleton count={6} /> : clubs.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No clubs have been added yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map(c => (
                <S key={c.id}>
                  <Link to={`/clubs/${c.id}`} className="block h-full">
                    <div className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                      {c.image_url ? (
                        <div className="aspect-video w-full overflow-hidden bg-muted">
                          <img src={c.image_url} alt={c.name} className="h-full w-full object-contain" loading="lazy" />
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-primary/10 flex items-center justify-center"><Users className="w-12 h-12 text-primary/40" /></div>
                      )}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-display text-lg font-semibold text-foreground">{c.name}</h3>
                        {c.meeting_days && <p className="text-xs text-secondary font-medium mt-1">{c.meeting_days}</p>}
                        {c.description && <p className="mt-2 text-sm text-muted-foreground flex-1 line-clamp-3">{c.description}</p>}
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
