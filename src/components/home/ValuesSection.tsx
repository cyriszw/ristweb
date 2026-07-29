import { BookOpen, Heart, Award, Globe, Lightbulb, Shield } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const values = [
  { icon: BookOpen, title: 'Academic Excellence', desc: 'Rigorous O-Level and A-Level curriculum preparing students for global success.' },
  { icon: Heart, title: 'Faith & Character', desc: 'Rooted in Marist Catholic values of simplicity, humility and love of God.' },
  { icon: Award, title: 'Holistic Growth', desc: 'Nurturing mind, body and spirit through sports, clubs and community service.' },
  { icon: Globe, title: 'Global Perspective', desc: 'Developing responsible citizens ready to make a difference in Zimbabwe and beyond.' },
  { icon: Lightbulb, title: 'Innovation', desc: 'Embracing modern learning methods and technology to future-proof our students.' },
  { icon: Shield, title: 'Safe Environment', desc: 'A caring community where every student feels valued, supported and protected.' },
];

export default function ValuesSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section ref={ref} className={`py-20 md:py-28 ${visible ? 'animate-reveal' : 'opacity-0'}`}>
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">Why Choose Us</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            A Tradition of Excellence in Education
          </h2>
          <div className="w-16 h-1 bg-secondary mx-auto mt-4 rounded-full" />
          <p className="mt-6 text-muted-foreground leading-relaxed">
            For over 40 years, Marist Brothers High School Dete has been shaping young minds through a unique blend of academic rigour, spiritual formation and character development in the Marist tradition.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <div
              key={i}
              className={`group relative bg-card border rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-reveal-delay-${Math.min(i + 1, 4)}`}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <v.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
