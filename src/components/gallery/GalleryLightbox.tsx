import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  likes: number;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
  onLike: (id: string) => void;
  likedIds: Set<string>;
}

export default function GalleryLightbox({
  images, currentIndex, open, onOpenChange, onNavigate, onLike, likedIds,
}: GalleryLightboxProps) {
  const image = images[currentIndex];

  const goPrev = useCallback(() => {
    onNavigate(currentIndex <= 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate(currentIndex >= images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goPrev, goNext]);

  if (!image) return null;

  const liked = likedIds.has(image.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black/95 border-none overflow-hidden [&>button]:text-white [&>button]:hover:bg-white/20">
        <DialogTitle className="sr-only">Gallery image viewer</DialogTitle>

        {/* Like button */}
        <button
          onClick={() => onLike(image.id)}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2 text-white hover:bg-black/70 transition-colors"
        >
          <Heart
            className={`w-5 h-5 transition-all ${liked ? 'fill-red-500 text-red-500 scale-110' : ''}`}
          />
          <span className="text-sm font-medium">{image.likes}</span>
        </button>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image */}
        <div className="flex items-center justify-center min-h-[60vh] max-h-[90vh]">
          <img
            src={image.image_url}
            alt={image.caption || 'Gallery image'}
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>

        {/* Caption */}
        {image.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
            <p className="text-white text-sm font-medium">{image.caption}</p>
          </div>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 right-4 text-white/70 text-xs font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </DialogContent>
    </Dialog>
  );
}
