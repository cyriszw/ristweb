import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function LifeAtMaristSection() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const { ref, visible } = useScrollReveal();

  useEffect(() => {
    supabase.from('clubs').select('*').limit(3).then(({ data }) => setClubs(data || []));
    supabase.from('sports').select('*').limit(3).then(({ data }) => setSports(data || []));
  }, []);

  return (
    <section ref={ref} className={`py-20 md:py-28 ${visible ? 'animate-reveal' : 'opacity-0'}`}>
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">Beyond the Classroom</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Life at Marist</h2>
          <p className="mt-4 text-muted-foreground">
            Our vibrant co-curricular programme ensures students develop talents, build friendships and discover new passions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Clubs column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">Clubs</h3>
            </div>
            {clubs.map(c => (
              <Link to={`/clubs/${c.id}`} key={c.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border hover:shadow-md hover:-translate-y-0.5 transition-all">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm text-foreground">{c.name}</div>
                  {c.meeting_days && <div className="text-xs text-muted-foreground">{c.meeting_days}</div>}
                </div>
              </Link>
            ))}
            <Link to="/clubs" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-2">
              All Clubs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Sports column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">Sports</h3>
            </div>
            {sports.map(s => (
              <Link to={`/sports/${s.id}`} key={s.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border hover:shadow-md hover:-translate-y-0.5 transition-all">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-secondary" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm text-foreground">{s.name}</div>
                  {s.season && <div className="text-xs text-muted-foreground">Season: {s.season}</div>}
                </div>
              </Link>
            ))}
            <Link to="/sports" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-2">
              All Sports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Innovation Hub column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-innovation-start/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-innovation-start" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">Innovation Hub</h3>
            </div>
            <div className="bg-gradient-to-br from-innovation-start/10 via-innovation-mid/10 to-innovation-end/10 rounded-xl p-6 border">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Our Innovation Hub empowers students to explore STEM, robotics, coding and creative problem-solving through hands-on projects.
              </p>
              <Link to="/innovation-hub" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-innovation-start to-innovation-mid text-white text-sm font-semibold hover:brightness-110 transition-all">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
