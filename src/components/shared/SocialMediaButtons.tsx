import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, AtSign, Globe } from 'lucide-react';

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  'at-sign': AtSign,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30',
  youtube: 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30',
  facebook: 'hover:bg-blue-600/10 hover:text-blue-600 hover:border-blue-600/30',
  linkedin: 'hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30',
  twitter: 'hover:bg-foreground/10 hover:text-foreground hover:border-foreground/30',
  'at-sign': 'hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500/30',
};

export default function SocialMediaButtons() {
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('social_media_links')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => setLinks((data || []).filter(l => l.platform_url)));
  }, []);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {links.map(link => {
        const Icon = PLATFORM_ICONS[link.icon_name] || Globe;
        const colorClass = PLATFORM_COLORS[link.icon_name] || 'hover:bg-primary/10 hover:text-primary hover:border-primary/30';
        return (
          <a
            key={link.id}
            href={link.platform_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card text-muted-foreground text-sm font-medium transition-all duration-200 ${colorClass}`}
          >
            <Icon className="w-4 h-4" />
            {link.platform_name}
          </a>
        );
      })}
    </div>
  );
}
