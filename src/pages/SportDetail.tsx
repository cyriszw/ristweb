import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Trophy, ArrowLeft, Calendar } from 'lucide-react';
import { DetailSkeleton } from '@/components/shared/Skeletons';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function SportDetail() {
  const { id } = useParams<{ id: string }>();
  const [sport, setSport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('sports').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => { setSport(data); setLoading(false); });

    const channel = supabase.channel(`sport-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sports', filter: `id=eq.${id}` }, () => {
        supabase.from('sports').select('*').eq('id', id).maybeSingle().then(({ data }) => setSport(data));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <Layout><DetailSkeleton /></Layout>;
  if (!sport) return (
    <Layout>
      <div className="py-20 text-center">
        <p className="text-muted-foreground mb-4">Sport not found.</p>
        <Link to="/sports" className="text-primary hover:underline text-sm">← Back to Sports</Link>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <section className="relative h-64 md:h-80 flex items-end overflow-hidden">
        {sport.image_url ? (
          <img src={sport.image_url} alt={sport.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-primary" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container pb-8 z-10">
          <Link to="/sports" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Sports
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">{sport.name}</h1>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container max-w-4xl space-y-10">
          <S>
            <div className="grid sm:grid-cols-2 gap-4">
              {sport.season && (
                <div className="bg-card border rounded-lg p-5 flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Season</div>
                    <div className="text-sm font-semibold text-foreground mt-1">{sport.season}</div>
                  </div>
                </div>
              )}
              <div className="bg-card border rounded-lg p-5 flex items-start gap-3">
                <Trophy className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</div>
                  <div className="text-sm font-semibold text-foreground mt-1">School Sport</div>
                </div>
              </div>
            </div>
          </S>

          {sport.description && (
            <S>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">About This Sport</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{sport.description}</p>
            </S>
          )}
        </div>
      </section>
    </Layout>
  );
}
