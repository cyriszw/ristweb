import { useEffect, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function EventsSection() {
  const [events, setEvents] = useState<any[]>([]);
  const { ref, visible } = useScrollReveal();

  useEffect(() => {
    supabase.from('events').select('*').order('event_date', { ascending: true }).limit(4)
      .then(({ data }) => setEvents(data || []));
  }, []);

  if (events.length === 0) return null;

  return (
    <section ref={ref} className={`py-20 md:py-28 bg-muted/50 ${visible ? 'animate-reveal' : 'opacity-0'}`}>
      <div className="container">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider mb-3">Mark Your Calendar</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Upcoming Events</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {events.map((e, i) => {
            const date = new Date(e.event_date);
            return (
              <div key={e.id} className={`bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 animate-reveal-delay-${i + 1}`}>
                <div className="bg-primary text-primary-foreground text-center py-3">
                  <div className="text-2xl font-bold font-display">{date.getDate()}</div>
                  <div className="text-xs uppercase tracking-wider opacity-80">
                    {date.toLocaleDateString('en-ZW', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-display font-semibold text-foreground">{e.title}</h4>
                  {e.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{e.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
