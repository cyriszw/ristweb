import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { GalleryGridSkeleton } from '@/components/shared/Skeletons';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import GalleryCard from '@/components/gallery/GalleryCard';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

const LIKED_KEY = 'gallery_liked_ids';
function getStoredLikes(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')); } catch { return new Set(); }
}
function storeLikes(ids: Set<string>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

export default function Gallery() {
  const [images, setImages] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(getStoredLikes);

  const fetchImages = useCallback(async (cat: string) => {
    const q = supabase.from('gallery').select('*').order('uploaded_at', { ascending: false });
    if (cat !== 'all') q.eq('category', cat);
    const { data, error } = await q;
    if (error) console.error('Failed to load gallery:', error);
    return data || [];
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchImages(filter).then(d => { setImages(d); setLoading(false); });
  }, [filter, fetchImages]);

  useEffect(() => {
    const channel = supabase.channel('gallery-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => {
        fetchImages(filter).then(setImages);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter, fetchImages]);

  const handleLike = useCallback(async (id: string) => {
    if (likedIds.has(id)) return; // already liked
    const newLiked = new Set(likedIds);
    newLiked.add(id);
    setLikedIds(newLiked);
    storeLikes(newLiked);

    // Optimistic update
    setImages(prev => prev.map(img => img.id === id ? { ...img, likes: (img.likes || 0) + 1 } : img));

    await supabase.rpc('increment_gallery_likes' as any, { row_id: id }).then(({ error }) => {
      if (error) {
        // Fallback: direct update
        supabase.from('gallery').update({ likes: images.find(i => i.id === id)?.likes || 1 } as any).eq('id', id);
      }
    });
  }, [likedIds, images]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const categories = ['all', 'general', 'sports', 'events', 'academics'];

  return (
    <Layout>
      <PageHeader title="Photo Gallery" subtitle="Capturing moments at Marist Brothers" bannerKey="gallery" />
      <section className="py-16">
        <div className="container">
          <S>
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors active:scale-[0.97] ${filter === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </S>
          {loading ? <GalleryGridSkeleton count={8} /> : images.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No images in the gallery yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <S key={img.id}>
                  <GalleryCard
                    image={img}
                    liked={likedIds.has(img.id)}
                    onView={() => openLightbox(i)}
                    onLike={() => handleLike(img.id)}
                  />
                </S>
              ))}
            </div>
          )}
        </div>
      </section>

      <GalleryLightbox
        images={images}
        currentIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onNavigate={setLightboxIndex}
        onLike={handleLike}
        likedIds={likedIds}
      />
    </Layout>
  );
}
