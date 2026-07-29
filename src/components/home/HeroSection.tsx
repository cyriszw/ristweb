import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import heroImg from '@/assets/hero-home.png';
import schoolLogo from '@/assets/school-logo.png';
import SearchBar from '@/components/shared/SearchBar';
import { useSiteContent } from '@/hooks/useSiteContent';

export default function HeroSection() {
  const motto = useSiteContent('homepage_motto', 'Scientia et Virtus — Knowledge and Virtue in the heart of Zimbabwe.');

  return (
    <section className="relative min-h-[560px] h-[calc(100svh-3.5rem)] md:h-screen max-h-[900px] flex items-center overflow-hidden">
      <img src={heroImg} alt="School campus aerial view" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-school-dark/85 via-school-dark/60 to-school-dark/40 md:to-transparent" />


      {/* Side CTAs - desktop only */}
      <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 flex-col gap-2">
        {[
          { label: 'APPLY', to: '/admissions' },
          { label: 'CONTACT', to: '/contact' },
          { label: 'ACADEMICS', to: '/academics' },
        ].map(cta => (
          <Link
            key={cta.label}
            to={cta.to}
            className="bg-primary/90 hover:bg-primary text-primary-foreground px-6 py-4 text-xs font-bold tracking-[0.2em] text-center transition-all hover:px-8 backdrop-blur-sm min-w-[160px]"
          >
            {cta.label}
          </Link>
        ))}
      </div>

      <div className="relative container z-10">
        <div className="max-w-2xl">
          <img src={schoolLogo} alt="Marist Brothers Dete" className="w-16 h-16 md:w-28 md:h-28 mb-4 md:mb-6 drop-shadow-2xl animate-reveal" />
          <h1 className="font-display text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white md:leading-[1.05] animate-reveal">
            Marist Brothers<br />High School Dete
          </h1>
          <p className="mt-4 md:mt-5 text-base md:text-xl text-white/85 max-w-lg animate-reveal" style={{ animationDelay: '200ms' }}>
            {motto}
          </p>
          <div className="mt-6 md:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3 animate-reveal" style={{ animationDelay: '300ms' }}>
            <Link to="/admissions" className="inline-flex items-center justify-center gap-2 px-8 min-h-[48px] rounded-md bg-secondary text-secondary-foreground font-bold text-sm hover:brightness-110 transition-all active:scale-[0.97] shadow-lg">
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/about" className="inline-flex items-center justify-center gap-2 px-8 min-h-[48px] rounded-md bg-white/15 text-white font-medium text-sm backdrop-blur-sm hover:bg-white/25 transition-all active:scale-[0.97] border border-white/20">
              Learn More
            </Link>
          </div>
          <div className="mt-6 md:mt-8 max-w-md animate-reveal" style={{ animationDelay: '400ms' }}>
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center pt-2">
          <div className="w-1 h-2.5 rounded-full bg-white/60" />
        </div>
      </div>

    </section>
  );
}
