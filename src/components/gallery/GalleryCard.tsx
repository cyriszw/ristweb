import { Eye, Heart } from 'lucide-react';

interface GalleryCardProps {
  image: { id: string; image_url: string; caption: string | null; likes: number };
  liked: boolean;
  onView: () => void;
  onLike: () => void;
}

export default function GalleryCard({ image, liked, onView, onLike }: GalleryCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg aspect-square bg-muted">
      <img
        src={image.image_url}
        alt={image.caption || 'Gallery image'}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
        <button
          onClick={onView}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-3 transition-all duration-200 transform scale-75 group-hover:scale-100"
          aria-label="View image"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full p-3 transition-all duration-200 transform scale-75 group-hover:scale-100"
          aria-label="Like image"
        >
          <Heart className={`w-5 h-5 transition-all ${liked ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Bottom info bar */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <p className="text-white text-xs font-medium truncate mr-2">{image.caption || ''}</p>
          <div className="flex items-center gap-1 text-white/80 text-xs shrink-0">
            <Heart className={`w-3 h-3 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{image.likes}</span>
          </div>
        </div>
      </div>

      {/* Mobile: tap to open */}
      <button
        onClick={onView}
        className="absolute inset-0 md:hidden"
        aria-label="Open image"
      />
    </div>
  );
}
