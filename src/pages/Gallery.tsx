import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import GalleryCard from '@/components/gallery/GalleryCard';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import { Camera } from 'lucide-react';

type Variant = 'featured' | 'wide' | 'portrait' | 'standard';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'students', label: 'Students' },
  { key: 'sports', label: 'Sports' },
  { key: 'academics', label: 'Academics' },
  { key: 'community', label: 'Community' },
] as const;

function getVariant(index: number): Variant {
  // Intentional editorial rhythm – not random
  // 0 featured, 1 standard, 2 portrait, 3 wide, 4 standard, 5 standard, 6 wide, 7 portrait, repeat
  const mod = index % 8;
  if (index === 0) return 'featured';
  if (mod === 2 || mod === 7) return 'portrait';
  if (mod === 3 || mod === 6) return 'wide';
  if (mod === 0 && index !== 0) return 'featured';
  return 'standard';
}

type GalleryImage = { id: string; image_url: string; caption: string | null; category: string | null; likes?: number; uploaded_at?: string };

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);

  const fetchImages = useCallback(async (cat: string) => {
    let q = supabase.from('gallery').select('*').order('uploaded_at', { ascending: false });
    // Map our filter keys to DB categories – DB may have 'general' for most
    // We keep "all" as no filter, otherwise try exact match; if no results, show empty gracefully
    if (cat !== 'all') {
      // For students/community which may not exist in DB, try to match; if no rows, fallback to general
      q = q.eq('category', cat);
    }
    const { data } = await q;
    return data || [];
  }, []);

  useEffect(() => {
    setLoading(true);
    setVisibleCount(12);
    fetchImages(filter).then((d) => {
      setImages(d);
      setLoading(false);
    });
  }, [filter, fetchImages]);

  useEffect(() => {
    const channel = supabase
      .channel('gallery-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => {
        fetchImages(filter).then(setImages);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, fetchImages]);

  const visibleImages = useMemo(() => images.slice(0, visibleCount), [images, visibleCount]);
  const hasMore = visibleCount < images.length;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-background border-b border-border/60">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center py-14 sm:py-16 md:py-20 lg:py-24">
            <p className="text-xs tracking-[0.24em] font-semibold text-primary uppercase">Gallery</p>
            <h1 className="mt-3 font-display text-[28px] sm:text-3xl md:text-[40px] font-bold leading-[1.1] text-foreground">
              Life at Thomas Coulter
              <br className="hidden sm:block" />
              <span className="sm:ml-2">Primary School</span>
            </h1>
            <div className="mx-auto mt-6 h-1 w-12 rounded-full bg-primary" />
            <p className="mt-6 text-sm sm:text-[15px] leading-relaxed text-muted-foreground max-w-[560px] mx-auto">
              Explore the moments, achievements and memories that make our school community special.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[65px] z-30 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="container">
          <div className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 sm:gap-2 mx-auto">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`relative px-3.5 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      active
                        ? 'text-primary-foreground bg-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-8 sm:py-10 lg:py-12">
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[160px] sm:auto-rows-[180px] lg:auto-rows-[200px] gap-3 md:gap-4 lg:gap-5">
              {Array.from({ length: 12 }).map((_, i) => {
                const v = getVariant(i);
                const cls =
                  v === 'featured'
                    ? 'col-span-2 row-span-2'
                    : v === 'wide'
                    ? 'col-span-2 row-span-1'
                    : v === 'portrait'
                    ? 'col-span-1 row-span-2'
                    : 'col-span-1 row-span-1';
                return <div key={i} className={`rounded-[16px] bg-muted animate-pulse ${cls}`} />;
              })}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Camera className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium text-foreground">No photos in this category yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Try another filter or check back soon.</p>
              <button
                onClick={() => setFilter('all')}
                className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Show all photos
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[160px] sm:auto-rows-[180px] lg:auto-rows-[200px] gap-3 md:gap-4 lg:gap-5">
                {visibleImages.map((img, i) => (
                  <GalleryCard
                    key={img.id}
                    image={img}
                    variant={getVariant(i)}
                    index={i}
                    onView={() => openLightbox(i)}
                  />
                ))}
              </div>

              {/* Count + Load More */}
              <div className="mt-8 sm:mt-10 flex flex-col items-center gap-4">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{visibleImages.length}</span> of{' '}
                  <span className="font-medium text-foreground">{images.length}</span> photos
                </p>
                {hasMore && (
                  <button
                    onClick={() => setVisibleCount((c) => Math.min(c + 8, images.length))}
                    className="inline-flex items-center justify-center rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Load More Photos
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <GalleryLightbox
        images={images}
        currentIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onNavigate={setLightboxIndex}
      />

      {/* subtle bottom spacing for editorial feel */}
      <div className="h-6" />
    </Layout>
  );
}
