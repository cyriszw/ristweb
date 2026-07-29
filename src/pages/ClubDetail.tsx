import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Users, ArrowLeft, Calendar } from 'lucide-react';
import { DetailSkeleton } from '@/components/shared/Skeletons';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function ClubDetail() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('clubs').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => { setClub(data); setLoading(false); });

    const channel = supabase.channel(`club-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs', filter: `id=eq.${id}` }, () => {
        supabase.from('clubs').select('*').eq('id', id).maybeSingle().then(({ data }) => setClub(data));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <Layout><DetailSkeleton /></Layout>;
  if (!club) return (
    <Layout>
      <div className="py-20 text-center">
        <p className="text-muted-foreground mb-4">Club not found.</p>
        <Link to="/clubs" className="text-primary hover:underline text-sm">← Back to Clubs</Link>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Hero banner */}
      <section className="relative h-64 md:h-80 flex items-end overflow-hidden">
        {club.image_url ? (
          <img src={club.image_url} alt={club.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-primary" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container pb-8 z-10">
          <Link to="/clubs" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Clubs
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">{club.name}</h1>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container max-w-4xl space-y-10">
          {/* Info cards */}
          <S>
            <div className="grid sm:grid-cols-2 gap-4">
              {club.meeting_days && (
                <div className="bg-card border rounded-lg p-5 flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meeting Days</div>
                    <div className="text-sm font-semibold text-foreground mt-1">{club.meeting_days}</div>
                  </div>
                </div>
              )}
              <div className="bg-card border rounded-lg p-5 flex items-start gap-3">
                <Users className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</div>
                  <div className="text-sm font-semibold text-foreground mt-1">School Club</div>
                </div>
              </div>
            </div>
          </S>

          {/* Description */}
          {club.description && (
            <S>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">About This Club</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{club.description}</p>
            </S>
          )}
        </div>
      </section>
    </Layout>
  );
}
