import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  category: string | null;
  likes?: number;
  uploaded_at?: string;
}

interface Props {
  images: GalleryImage[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
}

function prettyCategory(cat: string | null) {
  if (!cat) return 'School Life';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function GalleryLightbox({ images, currentIndex, open, onOpenChange, onNavigate }: Props) {
  const image = images[currentIndex];

  const goPrev = useCallback(() => {
    onNavigate(currentIndex <= 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate(currentIndex >= images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, onNavigate]);

  const onClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handler);
    };
  }, [open, goPrev, goNext, onClose]);

  if (!open || !image) return null;

  const captions: Record<string, string> = {
    general: 'Bringing students, staff and the community together.',
    events: 'Memories from our school events and celebrations.',
    sports: 'Teamwork, spirit and healthy competition.',
    academics: 'Learning, curiosity and achievement.',
    students: 'Our wonderful pupils in everyday moments.',
    community: 'Strong ties with families and the wider community.',
  };

  const cat = image.category || 'general';
  const subtitle = image.caption && image.caption.trim().length > 0
    ? image.caption
    : captions[cat] || 'Life at Thomas Coulter Primary School.';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 text-white">
        <div className="min-w-0">
          <p className="text-xs tracking-widest uppercase text-white/60">Gallery</p>
          <p className="text-sm font-medium truncate">
            {currentIndex + 1} <span className="text-white/40">/</span> {images.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-0">
        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="relative w-full max-w-6xl h-full flex items-center justify-center">
          <img
            key={image.id}
            src={image.image_url}
            alt={image.caption || 'Gallery image'}
            className="max-w-full max-h-[68vh] sm:max-h-[72vh] lg:max-h-[78vh] w-auto h-auto object-contain rounded-[12px] shadow-2xl animate-in fade-in zoom-in-95 duration-300"
          />
        </div>

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 bg-gradient-to-t from-black to-black/0">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-widest uppercase text-white/60">{prettyCategory(image.category)}</p>
          <h2 className="mt-1.5 font-display text-lg sm:text-xl font-semibold text-white leading-tight">
            {image.caption && image.caption.trim().length > 0 ? (image.caption.length > 80 ? image.caption.slice(0, 80) + '…' : image.caption) : `Life at Thomas Coulter Primary School`}
          </h2>
          <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-2xl mx-auto">{subtitle}</p>
        </div>
      </div>

      {/* Click backdrop to close */}
      <button
        className="absolute inset-0 -z-10"
        aria-label="Close lightbox"
        onClick={onClose}
        tabIndex={-1}
      />
    </div>
  );
}
