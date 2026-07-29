import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Lightbulb, ArrowLeft, Tag, Instagram, Youtube, Facebook, Linkedin, Twitter, AtSign, Globe } from 'lucide-react';
import { DetailSkeleton } from '@/components/shared/Skeletons';

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram, youtube: Youtube, facebook: Facebook, linkedin: Linkedin, twitter: Twitter, 'at-sign': AtSign,
};
const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30',
  youtube: 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30',
  facebook: 'hover:bg-blue-600/10 hover:text-blue-600 hover:border-blue-600/30',
  linkedin: 'hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30',
  twitter: 'hover:bg-foreground/10 hover:text-foreground hover:border-foreground/30',
  'at-sign': 'hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500/30',
};

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function InnovationDetail() {
  const { id } = useParams<{ id: string }>();
  const [innovation, setInnovation] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('innovations').select('*').eq('id', id).maybeSingle(),
      supabase.from('innovation_images').select('*').eq('innovation_id', id).order('sort_order'),
      supabase.from('innovation_social_links').select('*').eq('innovation_id', id).order('display_order'),
    ]).then(([{ data: inn }, { data: imgs }, { data: links }]) => {
      setInnovation(inn);
      setImages(imgs || []);
      setSocialLinks((links || []).filter(l => l.platform_url));
      setLoading(false);
    });

    const channel = supabase.channel(`innovation-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innovations', filter: `id=eq.${id}` }, () => {
        supabase.from('innovations').select('*').eq('id', id).maybeSingle().then(({ data }) => setInnovation(data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innovation_images' }, () => {
        supabase.from('innovation_images').select('*').eq('innovation_id', id).order('sort_order').then(({ data }) => setImages(data || []));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <Layout><DetailSkeleton /></Layout>;
  if (!innovation) return (
    <Layout>
      <div className="py-20 text-center">
        <p className="text-muted-foreground mb-4">Innovation not found.</p>
        <Link to="/innovation-hub" className="text-primary hover:underline text-sm">← Back to Innovation Hub</Link>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Hero banner */}
      <section className="relative h-64 md:h-80 flex items-end overflow-hidden">
        {innovation.image_url ? (
          <img src={innovation.image_url} alt={innovation.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-innovation-start via-innovation-mid to-innovation-end" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative container pb-8 z-10">
          <Link to="/innovation-hub" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Innovations
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">{innovation.name}</h1>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container max-w-4xl space-y-10">
          {/* Info cards */}
          <S>
            <div className="grid sm:grid-cols-2 gap-4">
              {innovation.category && (
                <div className="bg-card border rounded-lg p-5 flex items-start gap-3">
                  <Tag className="w-5 h-5 text-innovation-mid mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</div>
                    <div className="text-sm font-semibold text-foreground mt-1">{innovation.category}</div>
                  </div>
                </div>
              )}
              <div className="bg-card border rounded-lg p-5 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-innovation-accent mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</div>
                  <div className="text-sm font-semibold text-foreground mt-1">Student Innovation</div>
                </div>
              </div>
            </div>
          </S>

          {/* Description */}
          {innovation.description && (
            <S>
              <h2 className="font-display text-xl font-bold text-foreground mb-3">About This Project</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{innovation.description}</p>
            </S>
          )}

          {/* Image Gallery */}
          {images.length > 0 && (
            <S>
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Gallery</h2>
              <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImg(img.image_url)}
                    className={`overflow-hidden rounded-lg border hover:shadow-md transition-shadow ${
                      images.length === 3 && i === 0 ? 'col-span-2' : ''
                    }`}
                  >
                    <img src={img.image_url} alt={`Gallery ${i + 1}`} className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </S>
          )}

          {/* Social Media Links */}
          {socialLinks.length > 0 && (
            <S>
              <div className="flex flex-wrap justify-center gap-3">
                {socialLinks.map(link => {
                  const Icon = PLATFORM_ICONS[link.icon_name] || Globe;
                  const colorClass = PLATFORM_COLORS[link.icon_name] || 'hover:bg-primary/10 hover:text-primary hover:border-primary/30';
                  return (
                    <a key={link.id} href={link.platform_url} target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card text-muted-foreground text-sm font-medium transition-all duration-200 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                      {link.platform_name}
                    </a>
                  );
                })}
              </div>
            </S>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </Layout>
  );
}
