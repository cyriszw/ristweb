import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { ref, visible } = useScrollReveal();

  useEffect(() => {
    (supabase.from('testimonials' as any).select('*').order('created_at', { ascending: false }) as any)
      .then(({ data }: any) => setTestimonials(data || []));

    const channel = supabase.channel('testimonials-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => {
        (supabase.from('testimonials' as any).select('*').order('created_at', { ascending: false }) as any)
          .then(({ data }: any) => { if (data) setTestimonials(data); });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const goTo = useCallback((index: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setIsAnimating(false);
    }, 300);
  }, []);

  const prev = useCallback(() => goTo(current === 0 ? testimonials.length - 1 : current - 1), [current, testimonials.length, goTo]);
  const next = useCallback(() => goTo(current === testimonials.length - 1 ? 0 : current + 1), [current, testimonials.length, goTo]);

  // Auto-advance every 5 seconds when more than 3 testimonials
  useEffect(() => {
    if (testimonials.length <= 3) return;
    const timer = setInterval(() => {
      goTo(current === testimonials.length - 1 ? 0 : current + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length, current, goTo]);

  if (testimonials.length === 0) return null;

  const showCards = testimonials.length <= 3;

  return (
    <section ref={ref} className={`py-16 md:py-20 bg-primary/5 ${visible ? 'animate-reveal' : 'opacity-0'}`}>
      <div className="container">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
          What People Say
        </h2>

        {showCards ? (
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.id} className={`bg-card border rounded-xl p-6 flex flex-col items-center text-center animate-reveal-delay-${i + 1}`}>
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                {t.image_url ? (
                  <img src={t.image_url} alt={t.name} className="w-16 h-16 rounded-full object-cover mb-3" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-primary">{t.name[0]}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.message}"</p>
                <div className="font-display font-semibold text-foreground">{t.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative max-w-2xl mx-auto">
            <div className={`bg-card border rounded-xl p-8 flex flex-col items-center text-center transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              {testimonials[current]?.image_url ? (
                <img src={testimonials[current].image_url} alt={testimonials[current].name} className="w-16 h-16 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-primary">{testimonials[current]?.name[0]}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{testimonials[current]?.message}"</p>
              <div className="font-display font-semibold text-foreground">{testimonials[current]?.name}</div>
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={prev} className="p-2 rounded-full bg-card border hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`} />
                ))}
              </div>
              <button onClick={next} className="p-2 rounded-full bg-card border hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}