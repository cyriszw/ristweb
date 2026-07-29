import { useEffect, useState } from 'react';
import { Calendar, Users, Trophy, GraduationCap, Award, BookOpen, Star, Heart } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, any> = {
  Users, GraduationCap, Trophy, Calendar, Award, BookOpen, Star, Heart,
};

interface HomepageStat {
  id: string;
  title: string;
  value: string;
  icon: string | null;
  is_visible: boolean;
  order_index: number;
}

export default function StatsSection() {
  const { ref, visible } = useScrollReveal();
  const [stats, setStats] = useState<HomepageStat[]>([]);

  useEffect(() => {
    const load = () => {
      (supabase.from('homepage_stats' as any).select('*').eq('is_visible', true).order('order_index', { ascending: true }) as any)
        .then(({ data }: any) => setStats(data || []));
    };
    load();
    const channel = supabase.channel('homepage-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_stats' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (stats.length === 0) return null;

  return (
    <section ref={ref} className={`py-16 bg-primary text-primary-foreground ${visible ? 'animate-reveal' : 'opacity-0'}`}>
      <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => {
          const Icon = (s.icon && iconMap[s.icon]) || Users;
          return (
            <div key={s.id} className={`animate-reveal-delay-${(i % 4) + 1}`}>
              <Icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <div className="text-3xl md:text-4xl font-bold font-display">{s.value}</div>
              <div className="text-sm opacity-75 mt-1">{s.title}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
