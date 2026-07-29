import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  bannerKey?: string;
  gradient?: 'innovation';
}

export default function PageHeader({ title, subtitle, bannerKey, gradient }: PageHeaderProps) {
  const { ref, visible } = useScrollReveal();
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!bannerKey) return;
    supabase.from('site_settings').select('value').eq('key', `banner_${bannerKey}`).maybeSingle()
      .then(({ data }) => { if (data?.value) setBannerUrl(data.value); });
  }, [bannerKey]);

  if (bannerUrl) {
    return (
      <section ref={ref} className="relative h-40 sm:h-48 md:h-64 flex items-center overflow-hidden">
        <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <div className={`relative container text-center z-10 ${visible ? 'animate-reveal' : 'opacity-0'}`}>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">{title}</h1>
          {subtitle && <p className="mt-2 md:mt-3 text-sm sm:text-base text-white/80 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      </section>
    );
  }

  const gradientClass = gradient === 'innovation'
    ? 'bg-gradient-to-r from-innovation-start via-innovation-mid to-innovation-end'
    : 'bg-primary';

  return (
    <section ref={ref} className={`${gradientClass} py-10 sm:py-14 md:py-20`}>
      <div className={`container text-center ${visible ? 'animate-reveal' : 'opacity-0'}`}>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">{title}</h1>
        {subtitle && <p className="mt-2 md:mt-3 text-sm sm:text-base text-white/80 max-w-2xl mx-auto">{subtitle}</p>}
      </div>
    </section>
  );

}
