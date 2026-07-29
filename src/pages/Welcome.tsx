import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import schoolLogo from '@/assets/school-logo.png';
import heroImg from '@/assets/hero-home.png';
import { Users, Briefcase, UserCheck, Globe, Building2, GraduationCap, Heart, BookOpen } from 'lucide-react';

const visitorTypes = [
  { type: 'Student', icon: GraduationCap, description: 'Current Student' },
  { type: 'Parent', icon: Users, description: 'Parent or Guardian' },
  { type: 'Staff', icon: Briefcase, description: 'Teacher or Staff Member' },
  { type: 'SDC', icon: Building2, description: 'School Development Committee' },
  { type: 'Alumni', icon: BookOpen, description: 'Former Student' },
  { type: 'Government Official', icon: UserCheck, description: 'Government Representative' },
  { type: 'Prospective Parent', icon: Heart, description: 'Considering Enrollment' },
  { type: 'Visitor', icon: Globe, description: 'General Visitor' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem('visitor_type_selected')) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const handleSelect = async (type: string) => {
    setLoading(type);
    await supabase.from('visitor_logs').insert([{ visitor_type: type }]);
    localStorage.setItem('visitor_type_selected', 'true');
    setLoading(null);
    navigate('/home');
  };

  return (
    <div className="relative min-h-screen flex items-start md:items-center justify-center overflow-auto">
      <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-lg mx-4 py-6 md:py-10 text-center">
        <img src={schoolLogo} alt="Marist Brothers Dete" className="w-14 h-14 md:w-24 md:h-24 mx-auto mb-2 md:mb-4 drop-shadow-lg" />
        <h1 className="font-display text-2xl md:text-4xl font-bold text-white mb-0.5">
          Marist Brothers
        </h1>
        <p className="text-white/70 text-xs md:text-sm mb-4 md:mb-8">High School Dete</p>

        <div className="bg-card/95 backdrop-blur-md rounded-xl p-4 md:p-8 shadow-2xl border border-border/50">
          <h2 className="font-display text-base md:text-lg font-semibold text-foreground mb-0.5">Welcome</h2>
          <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">Please select your role to continue</p>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-2.5">
            {visitorTypes.map(({ type, icon: Icon, description }) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={loading !== null}
                className="w-full flex flex-col md:flex-row items-center md:items-center gap-1.5 md:gap-4 px-3 py-3 md:px-4 md:py-3.5 rounded-lg border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 group disabled:opacity-60"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 group-hover:bg-primary-foreground/20 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div className="text-center md:text-left">
                  <div className="font-semibold text-xs md:text-sm leading-tight">{loading === type ? '...' : type}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground group-hover:text-primary-foreground/70 transition-colors hidden md:block">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-[10px] md:text-xs mt-4 md:mt-6">Scientia et Virtus — Knowledge and Virtue</p>
      </div>
    </div>
  );
}
