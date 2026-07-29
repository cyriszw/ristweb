import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function CTABanner() {
  const { ref, visible } = useScrollReveal();

  return (
    <section ref={ref} className={`py-20 bg-primary ${visible ? 'animate-reveal' : 'opacity-0'}`}>
      <div className="container text-center text-primary-foreground">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Begin Your Journey With Us
        </h2>
        <p className="max-w-xl mx-auto opacity-85 mb-8">
          Applications are open for the upcoming academic year. Join a community that nurtures excellence, faith and purpose.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/admissions"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-secondary text-secondary-foreground font-bold text-sm hover:brightness-110 transition-all active:scale-[0.97] shadow-lg"
          >
            Apply Now <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-primary-foreground/15 text-primary-foreground font-medium text-sm backdrop-blur-sm hover:bg-primary-foreground/25 transition-all active:scale-[0.97] border border-primary-foreground/20"
          >
            <Phone className="w-4 h-4" /> Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
