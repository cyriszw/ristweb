import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import schoolLogo from '@/assets/school-logo.png';
import scholasticLogo from '@/assets/scholastic-logo.png';
import { GraduationCap, Users, Briefcase, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SCHOLASTIC_URL = 'https://scholasticservices.online/#/login';

const tiles = [
  { key: 'student', label: 'Student Portal', icon: GraduationCap },
  { key: 'parent', label: 'Parent Portal', icon: Users },
  { key: 'staff', label: 'Staff Portal', icon: Briefcase },
];

export default function SchoolPortal() {
  const [active, setActive] = useState<(typeof tiles)[number] | null>(null);

  if (active) {
    const Icon = active.icon;
    return (
      <Layout>
        <div className="container py-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                <h1 className="font-display text-xl font-semibold text-primary">{active.label}</h1>
              </div>
            </div>
            <a
              href={SCHOLASTIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Open in new tab <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <iframe
              src={SCHOLASTIC_URL}
              title={`${active.label} - Scholastic Services Login`}
              className="w-full h-[70vh] sm:h-[80vh] min-h-[480px] border-0 bg-white"
              referrerPolicy="no-referrer"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Login is provided by Scholastic Services. If the panel above appears blank, please use "Open in new tab".
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-10 sm:py-16 px-4 animate-fade-in">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
          <img src={schoolLogo} alt="Marist Brothers" className="h-12 w-12 sm:h-16 sm:w-16 object-contain" />
          <span className="text-xl sm:text-2xl text-muted-foreground font-light select-none">×</span>
          <img src={scholasticLogo} alt="Scholastic Services" className="h-12 w-12 sm:h-16 sm:w-16 object-contain" />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2 text-center">
          School Portal
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8 sm:mb-12 text-center max-w-md">
          Select your portal to log in to Scholastic Services
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.key}
                onClick={() => setActive(tile)}
                className="group flex flex-row sm:flex-col items-center gap-4 p-5 sm:p-8 rounded-xl border bg-card shadow-sm hover:shadow-lg sm:hover:scale-[1.04] active:scale-[0.98] hover:border-primary/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors duration-300">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <span className="font-display text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {tile.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </Layout>
  );
}
