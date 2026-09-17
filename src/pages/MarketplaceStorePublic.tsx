import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Store, MapPin, Clock, Mail, Phone, ShoppingCart, Star, Package, Search } from 'lucide-react';

export default function MarketplaceStorePublic(){
  const { slug } = useParams();
  const [store,setStore]=useState<any>(null);
  const [products,setProducts]=useState<any[]>([]);
  const [seller,setSeller]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState('');
  const [cart,setCart]=useState<any[]>(()=>{ try{ return JSON.parse(localStorage.getItem('seller-cart')||'[]');}catch{return []}});
  const [customer,setCustomer]=useState({ name:'', email:'', phone:'' });

  useEffect(()=>{
    const run=async()=>{
      const {data:st}=await supabase.from('marketplace_stores' as any).select('*').eq('slug', slug).maybeSingle();
      if(!st){ setLoading(false); return; }
      setStore(st);
      const {data:sl}=await supabase.from('marketplace_sellers' as any).select('full_name').eq('id', (st as any).seller_id).maybeSingle();
      setSeller(sl);
      const {data:prods}=await supabase.from('marketplace_seller_products' as any).select('*').eq('store_id', (st as any).id).eq('status','published').order('created_at',{ascending:false});
      setProducts(prods||[]);
      // increment store views? not needed
      setLoading(false);
      // increment product views
      if(prods?.length) {
        // best effort
        prods.forEach((p:any)=> supabase.from('marketplace_seller_products' as any).update({views: (p.views||0)+1}).eq('id', p.id).then(()=>{}));
      }
    }; run();
  },[slug]);

  const addToCart=(p:any)=>{
    const existing=cart.find((c:any)=>c.id===p.id);
    let next;
    if(existing) next=cart.map((c:any)=>c.id===p.id? {...c, qty: c.qty+1}:c);
    else next=[...cart, {id:p.id, name:p.name, price:Number(p.price), image:p.images?.[0], qty:1, store_id: store.id, seller_id: store.seller_id}];
    setCart(next); localStorage.setItem('seller-cart', JSON.stringify(next)); toast.success('Added to cart');
  };
  const cartTotal=cart.reduce((a,c)=>a+c.price*c.qty,0);
  const placeOrder=async()=>{
    if(cart.length===0){ toast.error('Cart empty'); return; }
    if(!customer.name || !customer.email){ toast.error('Name and email required'); return; }
    // ensure all cart items belong to same store (they do)
    const total=cartTotal;
    const {data:order, error}=await supabase.from('marketplace_orders' as any).insert([{
      store_id: store.id, seller_id: store.seller_id, customer_name: customer.name, customer_email: customer.email, customer_phone: customer.phone,
      subtotal: total, total, payment_status:'pending', order_status:'pending', notes: `Cart ${cart.length} items`
    }]).select().single();
    if(error){ toast.error(error.message); return; }
    for(const c of cart){
      await supabase.from('marketplace_order_items' as any).insert([{
        order_id: (order as any).id, product_id: c.id, product_name: c.name, product_image: c.image, quantity: c.qty, unit_price: c.price, total: c.price*c.qty
      }]);
      // decrement stock and increment sales
      const prod=products.find(p=>p.id===c.id);
      if(prod) await supabase.from('marketplace_seller_products' as any).update({ stock_quantity: Math.max(0, prod.stock_quantity - c.qty), sales_count: (prod.sales_count||0)+c.qty }).eq('id', prod.id);
    }
    toast.success('Order placed! Seller will confirm.');
    setCart([]); localStorage.removeItem('seller-cart');
    setCustomer({name:'',email:'',phone:''});
  };

  if(loading) return <Layout><div className="container py-10"><div className="h-64 bg-muted animate-pulse rounded-xl" /></div></Layout>;
  if(!store) return <Layout><div className="container py-16 text-center"><p className="font-medium">Store not found</p><Link to="/marketplace" className="text-primary underline text-sm">Back to Marketplace</Link></div></Layout>;

  const filtered=products.filter(p=>!q || `${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Layout>
      {/* Banner */}
      <section className="relative">
        {store.banner_url ? <img src={store.banner_url} className="w-full h-48 sm:h-64 object-cover" /> : <div className="w-full h-48 sm:h-64 bg-primary" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container flex gap-4 items-end pb-4">
            <div className="w-20 h-20 rounded-xl bg-white p-1 shadow-lg shrink-0 overflow-hidden">{store.logo_url ? <img src={store.logo_url} className="w-full h-full object-cover rounded-lg" /> : <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg"><Store className="w-8 h-8 text-muted-foreground" /></div>}</div>
            <div className="text-white pb-1">
              <h1 className="font-display text-2xl font-bold">{store.store_name}</h1>
              <p className="text-sm text-white/80 flex items-center gap-2">{seller?.full_name && <span>{seller.full_name}</span>} {store.location && <><MapPin className="w-3.5 h-3.5" /> {store.location}</>}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card border-b">
        <div className="container py-4 flex flex-wrap gap-4 text-sm">
          {store.description && <p className="flex-1 min-w-[200px] text-muted-foreground">{store.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs">
            {store.contact_email && <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full"><Mail className="w-3.5 h-3.5" /> {store.contact_email}</span>}
            {store.contact_phone && <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full"><Phone className="w-3.5 h-3.5" /> {store.contact_phone}</span>}
            {store.business_hours && Object.keys(store.business_hours).length>0 && <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> {Object.entries(store.business_hours as any).slice(0,2).map(([k,v])=>`${k} ${v}`).join(' • ')}</span>}
            {store.social_links && Object.entries(store.social_links as any).map(([k,v])=>(
              <a key={k} href={String(v)} target="_blank" rel="noreferrer" className="underline text-primary">{k}</a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 bg-muted/20">
        <div className="container">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search in store..." value={q} onChange={e=>setQ(e.target.value)} className="pl-9" /></div>
            <div className="flex items-center gap-2 text-sm"><ShoppingCart className="w-4 h-4" /> Cart {cart.length} • ${cartTotal.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {filtered.length===0 ? (
              <Card className="py-16 text-center"><CardContent><Package className="w-10 h-10 mx-auto text-muted-foreground" /><p className="mt-3 font-medium">No products</p><p className="text-sm text-muted-foreground">This store has no published products yet</p></CardContent></Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p=>(
                  <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-[4/3] bg-muted overflow-hidden">{p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-8 h-8" /></div>}</div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 h-8">{p.description||''}</p>
                      <div className="mt-2 flex items-center gap-2"><span className="font-bold text-primary">${Number(p.price).toFixed(2)}</span>{p.discount_price && <span className="text-xs line-through text-muted-foreground">${Number(p.discount_price).toFixed(2)}</span>}<Badge variant="outline" className="ml-auto text-[11px]">Stock {p.stock_quantity}</Badge></div>
                      <Button size="sm" className="w-full mt-3 rounded-full" onClick={()=>addToCart(p)} disabled={p.stock_quantity===0}>{p.stock_quantity===0?'Out of stock':'Add to Cart'}</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <Card><CardContent className="p-4">
              <h3 className="font-semibold text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Your Cart</h3>
              <div className="mt-3 space-y-2">
                {cart.length===0 ? <p className="text-sm text-muted-foreground text-center py-6">Cart empty</p> :
                 cart.map((c:any)=>(<div key={c.id} className="flex gap-2 text-sm border rounded-lg p-2"><img src={c.image||''} className="w-10 h-10 rounded object-cover bg-muted" /><div className="flex-1"><p className="font-medium line-clamp-1">{c.name}</p><p className="text-xs text-muted-foreground">Qty {c.qty} × ${c.price.toFixed(2)}</p></div><button onClick={()=>{ const n=cart.filter((x:any)=>x.id!==c.id); setCart(n); localStorage.setItem('seller-cart', JSON.stringify(n)); }} className="text-xs text-red-600">×</button></div>))}
              </div>
              {cart.length>0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between font-bold"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
                  <Input placeholder="Your name *" value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})} />
                  <Input placeholder="Email *" value={customer.email} onChange={e=>setCustomer({...customer, email:e.target.value})} />
                  <Input placeholder="Phone" value={customer.phone} onChange={e=>setCustomer({...customer, phone:e.target.value})} />
                  <Button className="w-full rounded-full" onClick={placeOrder}>Place Order</Button>
                  <p className="text-[11px] text-muted-foreground text-center">Order will appear in seller's Dashboard → Orders</p>
                </div>
              )}
            </CardContent></Card>
            <Card><CardContent className="p-4 text-sm text-muted-foreground"><p className="font-medium text-foreground flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> Store Reviews</p><p className="mt-1">Reviews for this store's products appear on product cards. Sellers can reply from Dashboard → Reviews.</p></CardContent></Card>
            <Link to="/marketplace" className="block text-center text-sm text-primary underline">← Back to Marketplace</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
