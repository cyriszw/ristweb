import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import ValuesSection from '@/components/home/ValuesSection';
import StatsSection from '@/components/home/StatsSection';
import FeaturedNewsSection from '@/components/home/FeaturedNewsSection';
import LifeAtMaristSection from '@/components/home/LifeAtMaristSection';
import GalleryPreview from '@/components/home/GalleryPreview';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import EventsSection from '@/components/home/EventsSection';
import CTABanner from '@/components/home/CTABanner';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useScrollReveal } from '@/hooks/useScrollReveal';

function IntroSection() {
  const intro = useSiteContent('homepage_intro', '');
  const { ref, visible } = useScrollReveal();
  if (!intro) return null;
  return (
    <section ref={ref} className={`py-10 bg-card border-b ${visible ? 'animate-reveal' : 'opacity-0'}`}>
      <div className="container max-w-3xl text-center">
        <p className="text-muted-foreground leading-relaxed">{intro}</p>
      </div>
    </section>
  );
}

export default function Index() {
  return (
    <Layout>
      <HeroSection />
      <IntroSection />
      <StatsSection />
      <ValuesSection />
      <FeaturedNewsSection />
      <LifeAtMaristSection />
      <GalleryPreview />
      <TestimonialsSection />
      <EventsSection />
      <CTABanner />
    </Layout>
  );
}
