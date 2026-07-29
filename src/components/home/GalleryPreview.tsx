import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';

const LIKED_KEY = 'gallery_liked_ids';
function getStoredLikes(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')); } catch { return new Set(); }
}
function storeLikes(ids: Set<string>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
}

export default function GalleryPreview() {
  const [images, setImages] = useState<any[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(getStoredLikes);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { ref, visible } = useScrollReveal();

  useEffect(() => {
    supabase.from('gallery').select('*').order('uploaded_at', { ascending: false }).limit(6)
      .then(({ data }) => setImages(data || []));
  }, []);

  const handleLike = useCallback(async (id: string) => {
    if (likedIds.has(id)) return;
    const newLiked = new Set(likedIds);
    newLiked.add(id);
    setLikedIds(newLiked);
    storeLikes(newLiked);
    setImages(prev => prev.map(img => img.id === id ? { ...img, likes: (img.likes || 0) + 1 } : img));
    await supabase.from('gallery').update({ likes: (images.find(i => i.id === id)?.likes || 0) + 1 } as any).eq('id', id);
  }, [likedIds, images]);

  if (images.length === 0) return null;

  return (
    <>
      <section ref={ref} className={`py-20 md:py-28 ${visible ? 'animate-reveal' : 'opacity-0'}`}>
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">Campus Life</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Photo Gallery</h2>
            </div>
            <Link to="/gallery" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              View Full Gallery <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {images.map((img, i) => (
              <div
                key={img.id}
                className={`group relative overflow-hidden rounded-xl aspect-[4/3] ${i === 0 ? 'md:row-span-2 md:aspect-auto' : ''}`}
              >
                <img
                  src={img.image_url}
                  alt={img.caption || 'School photo'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-3 transition-all scale-75 group-hover:scale-100"
                    aria-label="View image"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleLike(img.id)}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-3 transition-all scale-75 group-hover:scale-100"
                    aria-label="Like image"
                  >
                    <Heart className={`w-5 h-5 ${likedIds.has(img.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>
                {/* Caption + likes */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-medium">{img.caption || ''}</span>
                    <span className="flex items-center gap-1 text-white/80 text-xs">
                      <Heart className={`w-3 h-3 ${likedIds.has(img.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      {img.likes || 0}
                    </span>
                  </div>
                </div>
                {/* Mobile tap target */}
                <button
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                  className="absolute inset-0 md:hidden"
                  aria-label="Open image"
                />
              </div>
            ))}
          </div>

          <Link to="/gallery" className="sm:hidden mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            View Full Gallery <ArrowRight className="w-4 h-4" />
          </Link>
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
    </>
  );
}
