import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Search, Apple, CupSoda, BookOpen, Shirt, Package, ShieldCheck } from 'lucide-react';

type Product = { id: string; name: string; category: string };
type Listing = {
  id: string;
  product_id: string;
  category: string;
  description: string | null;
  price: number;
  quantity: number;
  availability: string;
  image_url: string | null;
  contact_info: string | null;
  collection_info: string | null;
  status: string;
  created_at: string;
  marketplace_products?: Product | null;
  marketplace_sellers?: { full_name: string } | null;
};

const CATEGORIES = [
  { key: 'all', label: 'All', icon: ShoppingBag },
  { key: 'Food & Snacks', label: 'Food & Snacks', icon: Apple },
  { key: 'Drinks', label: 'Drinks', icon: CupSoda },
  { key: 'School Supplies', label: 'School Supplies', icon: BookOpen },
  { key: 'Clothing & Uniform Items', label: 'Clothing', icon: Shirt },
  { key: 'Other Approved Items', label: 'Other', icon: Package },
];

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all'|'low'|'high'>('all');
  const [availability, setAvailability] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      // Public listings: only approved & visible, but RLS for anon is is_visible=true and status approved
      // So we can just query listings with is_visible check handled by RLS; for service we filter client side as well
      const { data, error } = await supabase
        .from('marketplace_listings' as any)
        .select('*, marketplace_products(name,category), marketplace_sellers(full_name)')
        .eq('status', 'approved')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });
      if (!error && data) setListings(data as any);
      setLoading(false);
    };
    fetch();
    const ch = supabase.channel('marketplace-listings').on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_listings' }, fetch).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    return listings.filter(l => {
      if (category !== 'all' && l.category !== category) return false;
      if (availability !== 'all' && l.availability !== availability) return false;
      if (priceFilter === 'low' && l.price > 20) return false;
      if (priceFilter === 'high' && l.price <= 20) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${l.marketplace_products?.name || ''} ${l.description || ''} ${l.category}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [listings, category, search, priceFilter, availability]);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-primary py-10 sm:py-14 md:py-16">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.2em] font-semibold text-primary-foreground/70 uppercase flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Marketplace
            </p>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">School Marketplace</h1>
            <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed max-w-2xl">
              School-approved sellers and school-approved products — moderated by administration. Safe, transparent and community-focused.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/marketplace/register" className="inline-flex items-center justify-center rounded-full bg-white text-primary px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors">Register as a Seller</Link>
              <Link to="/marketplace/dashboard" className="inline-flex items-center justify-center rounded-full bg-primary-foreground/10 text-white border border-white/20 px-6 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors">My Listings</Link>
              <Link to="/marketplace/rules" className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white underline underline-offset-4"><ShieldCheck className="w-4 h-4" /> Marketplace Rules</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category tabs */}
      <section className="border-b bg-card sticky top-[56px] sm:top-[64px] z-30">
        <div className="container">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none">
            {CATEGORIES.map(c => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  <c.icon className="w-4 h-4" /> {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products, description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={priceFilter} onChange={e => setPriceFilter(e.target.value as any)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All Prices</option>
              <option value="low">Under $20</option>
              <option value="high">Over $20</option>
            </select>
            <select value={availability} onChange={e => setAvailability(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All Availability</option>
              <option value="in_stock">In Stock</option>
              <option value="preorder">Pre-order</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Only <span className="font-medium text-foreground">approved and active listings</span> appear publicly. All sellers and products are school-approved.</p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-8">
        <div className="container">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-muted-foreground" /></div>
              <p className="mt-4 font-medium">No listings found</p>
              <p className="text-sm text-muted-foreground">Try adjusting filters or check back later.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(l => (
                <div key={l.id} className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {l.image_url ? <img src={l.image_url} alt={l.marketplace_products?.name || 'Product'} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-8 h-8" /></div>}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{l.category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.availability==='in_stock'?'bg-green-100 text-green-700': l.availability==='preorder'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{l.availability.replace('_',' ')}</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-foreground line-clamp-1">{l.marketplace_products?.name || 'Product'}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{l.description || 'No description'}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-primary">${Number(l.price).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">Qty: {l.quantity}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Seller</span><span className="font-medium text-foreground">{l.marketplace_sellers?.full_name || '—'}</span></div>
                      <div className="flex justify-between"><span>Date</span><span>{new Date(l.created_at).toLocaleDateString()}</span></div>
                      {l.contact_info && <div className="truncate">Contact: {l.contact_info}</div>}
                      {l.collection_info && <div className="truncate">Collection: {l.collection_info}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
