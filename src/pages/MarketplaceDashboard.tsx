import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function MarketplaceDashboard() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ product_id:'', description:'', price:'', quantity:'1', availability:'in_stock', image_url:'', contact_info:'', collection_info:'' });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: s } = await supabase.from('marketplace_sellers' as any).select('*').eq('user_id', user.id).maybeSingle();
    setSeller(s || null);
    if (s) {
      const { data: l } = await supabase.from('marketplace_listings' as any).select('*, marketplace_products(name)').eq('seller_id', s.id).order('created_at', {ascending:false});
      setListings(l || []);
    }
    const { data: p } = await supabase.from('marketplace_products' as any).select('*').eq('enabled', true).eq('is_approved', true).eq('is_prohibited', false).order('name');
    setProducts(p || []);
  };
  useEffect(()=>{ load(); }, [user]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const path = `listings/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('marketplace').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return ''; }
    const { data } = supabase.storage.from('marketplace').getPublicUrl(path);
    setUploading(false);
    return data.publicUrl;
  };

  const createListing = async () => {
    if (!seller) return;
    if (seller.status !== 'active') { toast.error('Your seller account is not active: '+seller.status); return; }
    if (!form.product_id || !form.price) { toast.error('Product and price required'); return; }
    const prod = products.find(p=>p.id===form.product_id);
    const { error } = await supabase.from('marketplace_listings' as any).insert([{
      seller_id: seller.id,
      product_id: form.product_id,
      category: prod?.category || 'Other Approved Items',
      description: form.description || null,
      price: Number(form.price),
      quantity: Number(form.quantity),
      availability: form.availability,
      image_url: form.image_url || null,
      contact_info: form.contact_info || null,
      collection_info: form.collection_info || null,
      status: 'pending_review',
    }]);
    if (error) { toast.error(error.message); return; }
    toast.success('Listing submitted — pending review');
    setShowCreate(false);
    setForm({ product_id:'', description:'', price:'', quantity:'1', availability:'in_stock', image_url:'', contact_info:'', collection_info:'' });
    load();
  };

  if (!user) return <Layout><div className="container py-16 text-center"><p>Please log in</p><Link to="/login" className="text-primary underline">Login</Link></div></Layout>;

  if (!seller) return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <h1 className="font-display text-2xl font-bold">My Marketplace Dashboard</h1>
        <div className="mt-6 bg-card border rounded-xl p-8 text-center">
          <p className="font-medium">You have not registered as a seller yet</p>
          <Link to="/marketplace/register" className="inline-flex mt-4 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm">Register as a Seller</Link>
        </div>
      </div>
    </Layout>
  );

  const stats = {
    total: listings.length,
    active: listings.filter(l=>l.status==='approved').length,
    pending: listings.filter(l=>l.status==='pending_review').length,
    rejected: listings.filter(l=>l.status==='rejected').length,
    suspended: listings.filter(l=>l.status==='suspended').length,
  };

  return (
    <Layout>
      <section className="bg-primary py-8">
        <div className="container">
          <h1 className="font-display text-2xl font-bold text-white">My Marketplace Dashboard</h1>
          <p className="text-white/80 text-sm mt-1">Account status: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${seller.status==='active'?'bg-green-500 text-white': seller.status==='pending'?'bg-amber-500 text-white':'bg-red-500 text-white'}`}>{seller.status}</span> {seller.suspension_reason && <span className="text-white/70">— {seller.suspension_reason}</span>}</p>
        </div>
      </section>
      <div className="container py-6">
        {seller.status==='suspended' && <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6"><p className="font-semibold">Account Suspended</p><p className="text-sm">{seller.suspension_reason || 'Contact administration.'} Your listings are hidden and you cannot create new ones.</p></div>}
        {seller.status==='pending' && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 mb-6">Your seller application is pending approval. You will be notified once approved.</div>}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries({Total:stats.total, Active:stats.active, Pending:stats.pending, Rejected:stats.rejected, Suspended:stats.suspended}).map(([k,v])=>(
            <div key={k} className="bg-card border rounded-xl p-4 text-center"><p className="text-xs text-muted-foreground uppercase tracking-widest">{k}</p><p className="text-2xl font-bold">{v}</p></div>
          ))}
        </div>
        <div className="flex gap-3 mb-6">
          <Button onClick={()=>setShowCreate(true)} disabled={seller.status!=='active'}>+ Add Listing</Button>
          <Link to="/marketplace" className="inline-flex items-center rounded-md border px-4 py-2 text-sm">Browse Marketplace</Link>
          {seller.violation_count>0 && <span className="text-sm text-red-600 self-center">Violations: {seller.violation_count}</span>}
        </div>

        {showCreate && (
          <div className="bg-card border rounded-xl p-6 mb-6 space-y-4">
            <h3 className="font-semibold">Create Listing</h3>
            <p className="text-xs text-muted-foreground">Your listing will be reviewed according to the school's Marketplace Rules. Select product from approved list.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Product *</label>
                <select value={form.product_id} onChange={e=>setForm({...form, product_id:e.target.value})} className="h-10 w-full rounded-md border px-3 text-sm bg-background">
                  <option value="">Select approved product</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name} — {p.category}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium">Price *</label><Input type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} placeholder="0.00" /></div>
            </div>
            <Textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="text-sm">Quantity</label><Input type="number" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})} /></div>
              <div><label className="text-sm">Availability</label>
                <select value={form.availability} onChange={e=>setForm({...form, availability:e.target.value})} className="h-10 w-full rounded-md border px-3 text-sm bg-background">
                  <option value="in_stock">In Stock</option><option value="preorder">Pre-order</option><option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div><label className="text-sm">Contact Info</label><Input value={form.contact_info} onChange={e=>setForm({...form, contact_info:e.target.value})} placeholder="Phone / email" /></div>
            </div>
            <Input placeholder="Collection/delivery info" value={form.collection_info} onChange={e=>setForm({...form, collection_info:e.target.value})} />
            <div className="flex items-center gap-3">
              <label className="text-sm flex items-center gap-2 cursor-pointer"><span className="px-3 py-1.5 border rounded-md bg-muted text-sm">{uploading?'Uploading...':'Upload Image'}</span><input type="file" accept="image/*" className="hidden" onChange={async e=>{const f=e.target.files?.[0]; if(f){const url=await uploadImage(f); if(url) setForm({...form, image_url:url});}}}/></label>
              {form.image_url && <img src={form.image_url} alt="" className="w-12 h-12 rounded object-cover" />}
            </div>
            <div className="flex gap-2">
              <Button onClick={createListing}>Submit for Review</Button>
              <Button variant="outline" onClick={()=>setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {listings.map(l=>(
            <div key={l.id} className="bg-card border rounded-xl p-4 flex gap-4">
              {l.image_url ? <img src={l.image_url} alt="" className="w-20 h-20 rounded object-cover shrink-0" /> : <div className="w-20 h-20 bg-muted rounded shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-medium text-sm">{l.marketplace_products?.name}</span><span className={`px-2 py-0.5 rounded-full text-xs ${l.status==='approved'?'bg-green-100 text-green-700': l.status==='pending_review'?'bg-amber-100 text-amber-700': 'bg-red-100 text-red-700'}`}>{l.status}</span>{l.flagged && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">Flagged: {l.flag_reason}</span>}</div>
                <p className="text-sm text-muted-foreground line-clamp-1">{l.description}</p>
                <p className="text-sm font-semibold">${Number(l.price).toFixed(2)} • Qty {l.quantity} • {l.category}</p>
              </div>
            </div>
          ))}
          {listings.length===0 && <p className="text-center text-muted-foreground py-8">No listings yet</p>}
        </div>
      </div>
    </Layout>
  );
}
