import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import schoolLogo from '@/assets/school-logo.png';


const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/academics', label: 'Academics' },
  { to: '/admissions', label: 'Admissions' },
  { to: '/news', label: 'News' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/clubs', label: 'Clubs' },
  { to: '/innovation-hub', label: 'Innovation Hub' },
  { to: '/sports', label: 'Sports' },
  { to: '/fees', label: 'Fees' },
  { to: '/school-portal', label: 'School Portal' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
      <div className="container flex items-center justify-between h-14 sm:h-16">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
          <img src={schoolLogo} alt="Marist Brothers Logo" className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0" />
          <div className="leading-tight min-w-0">
            <span className="font-display text-[13px] sm:text-sm font-bold text-primary block truncate">Marist Brothers</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground block truncate">High School Dete</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === l.to
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden -mr-2 h-11 w-11 inline-flex items-center justify-center rounded-md hover:bg-muted active:bg-muted transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer — portaled to body so the header's backdrop-blur
          containing block doesn't clip the fixed overlay */}
      {createPortal(
        <div
          className={`lg:hidden fixed inset-0 z-[60] overflow-hidden transition-opacity duration-200 ${
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!open}
        >
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <nav
            className={`absolute right-0 top-0 h-full w-[82%] max-w-xs bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between h-14 px-5 border-b shrink-0">
              <span className="font-display text-sm font-bold text-primary">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="-mr-2 h-11 w-11 inline-flex items-center justify-center rounded-md hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 px-3 flex flex-col gap-0.5">
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`px-4 min-h-[48px] flex items-center rounded-lg text-[15px] font-medium transition-colors ${
                    pathname === l.to
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted active:bg-muted'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="p-4 border-t shrink-0">
              <Link
                to="/admissions"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center min-h-[48px] rounded-lg bg-secondary text-secondary-foreground font-bold text-sm"
              >
                Apply Now
              </Link>
            </div>
          </nav>
        </div>,
        document.body,
      )}
    </header>
  );
}

