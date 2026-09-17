import { Camera } from 'lucide-react';

type Variant = 'featured' | 'wide' | 'portrait' | 'standard';

interface GalleryCardProps {
  image: { id: string; image_url: string; caption: string | null; category: string | null; likes?: number };
  variant: Variant;
  index: number;
  onView: () => void;
}

const variantClasses: Record<Variant, string> = {
  featured: 'col-span-2 row-span-2 min-h-[320px] sm:min-h-[360px] lg:min-h-[420px]',
  wide: 'col-span-2 row-span-1 min-h-[160px] sm:min-h-[180px] lg:min-h-[200px]',
  portrait: 'col-span-1 row-span-2 min-h-[320px] sm:min-h-[360px] lg:min-h-[420px]',
  standard: 'col-span-1 row-span-1 min-h-[160px] sm:min-h-[180px] lg:min-h-[200px]',
};

function prettyCategory(cat: string | null) {
  if (!cat) return 'School Life';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function titleFromCaption(caption: string | null, category: string | null, index: number) {
  if (caption && caption.trim().length > 0) {
    // Use caption as title, truncated
    return caption.length > 48 ? caption.slice(0, 47) + '…' : caption;
  }
  const fallbacks = [
    'Annual School Gathering',
    'School Activities',
    'Learning Together',
    'Community Spirit',
    'Celebrating Achievement',
    'Life at Thomas Coulter',
  ];
  // Prefer category-based title
  if (category && category !== 'general') return `${prettyCategory(category)} Moments`;
  return fallbacks[index % fallbacks.length];
}

export default function GalleryCard({ image, variant, index, onView }: GalleryCardProps) {
  const title = titleFromCaption(image.caption, image.category, index);
  const categoryLabel = prettyCategory(image.category);

  return (
    <button
      onClick={onView}
      className={`group relative overflow-hidden rounded-[16px] bg-muted text-left shadow-sm hover:shadow-md transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${variantClasses[variant]}`}
      aria-label={`View ${title}`}
    >
      <img
        src={image.image_url}
        alt={image.caption || title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] will-change-transform"
        loading={index < 6 ? 'eager' : 'lazy'}
        decoding="async"
      />

      {/* Subtle gradient overlay - always visible at bottom for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Hover dark overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

      {/* Center camera icon on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
        <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
          <Camera className="w-5 h-5 text-foreground" />
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-4">
        <div className="translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-[11px] tracking-widest font-semibold text-white/80 uppercase">
            {categoryLabel}
          </p>
          <h3 className="mt-1 text-white font-semibold leading-tight text-[14px] sm:text-[15px] line-clamp-2 drop-shadow-sm">
            {title}
          </h3>
          {image.caption && image.caption !== title && (
            <p className="mt-1 text-white/75 text-xs leading-snug line-clamp-1 hidden sm:block">
              {image.caption.length > 70 ? image.caption.slice(0, 70) + '…' : image.caption}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
