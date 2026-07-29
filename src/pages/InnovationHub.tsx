import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { CardGridSkeleton } from '@/components/shared/Skeletons';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Lightbulb } from 'lucide-react';


function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function InnovationHub() {
  const [innovations, setInnovations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    supabase.from('innovations').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) console.error('Failed to load innovations:', error);
      setInnovations(data || []);
      setLoading(false);
    });
    const channel = supabase.channel('innovations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innovations' }, () => {
        supabase.from('innovations').select('*').order('created_at', { ascending: false }).then(({ data }) => setInnovations(data || []));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const categories = ['all', ...new Set(innovations.map(i => i.category).filter(Boolean))];
  const filtered = filter === 'all' ? innovations : innovations.filter(i => i.category === filter);

  return (
    <Layout>
      <PageHeader title="Innovation Hub" subtitle="Discover student projects, innovations, and talents" bannerKey="innovation_hub" gradient="innovation" />
      <section className="py-16">
        <div className="container">
          {loading ? <CardGridSkeleton count={6} /> : (
            <>
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {categories.map(c => (
                    <button key={c} onClick={() => setFilter(c)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        filter === c ? 'bg-gradient-to-r from-innovation-start to-innovation-end text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}>
                      {c === 'all' ? 'All' : c}
                    </button>
                  ))}
                </div>
              )}
              {filtered.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No innovations have been added yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map(item => (
                    <S key={item.id}>
                      <Link to={`/innovation-hub/${item.id}`} className="block h-full group">
                        <div className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group-hover:-translate-y-1 group-hover:border-innovation-start/30">
                          {item.image_url ? (
                            <div className="aspect-video w-full relative overflow-hidden bg-muted">
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            <div className="aspect-video w-full bg-gradient-to-br from-innovation-start/20 via-innovation-mid/15 to-innovation-end/20 flex items-center justify-center">
                              <Lightbulb className="w-12 h-12 text-innovation-mid/60" />
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col">
                            {item.category && (
                              <span className="text-xs font-medium text-innovation-mid uppercase tracking-wider mb-1">{item.category}</span>
                            )}
                            <h3 className="font-display text-lg font-semibold text-foreground">{item.name}</h3>
                            {item.description && (
                              <p className="mt-2 text-sm text-muted-foreground flex-1 line-clamp-3">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </S>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
