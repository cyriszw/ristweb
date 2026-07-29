import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  type: 'post' | 'event' | 'club' | 'sport';
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }

    const [posts, events, clubs, sports] = await Promise.all([
      supabase.from('posts').select('id, title').ilike('title', `%${q}%`).limit(5),
      supabase.from('events').select('id, title').ilike('title', `%${q}%`).limit(5),
      supabase.from('clubs').select('id, name').ilike('name', `%${q}%`).limit(5),
      supabase.from('sports').select('id, name').ilike('name', `%${q}%`).limit(5),
    ]);

    const r: SearchResult[] = [
      ...(posts.data || []).map(p => ({ id: p.id, title: p.title, type: 'post' as const })),
      ...(events.data || []).map(e => ({ id: e.id, title: e.title, type: 'event' as const })),
      ...(clubs.data || []).map(c => ({ id: c.id, title: c.name, type: 'club' as const })),
      ...(sports.data || []).map(s => ({ id: s.id, title: s.name, type: 'sport' as const })),
    ];
    setResults(r);
  };

  const typeLinks: Record<string, string> = {
    post: '/news',
    event: '/news',
    club: '/clubs',
    sport: '/sports',
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search news, events, clubs..."
          className="pl-9"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-card border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map(r => (
            <Link
              key={`${r.type}-${r.id}`}
              to={typeLinks[r.type]}
              className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <span>{r.title}</span>
              <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">{r.type}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
