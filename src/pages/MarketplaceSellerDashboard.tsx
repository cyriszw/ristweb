import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSeller } from '@/hooks/useSeller';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { LayoutDashboard, Package, ShoppingCart, Store as StoreIcon, BarChart3, MessageSquare, Star, CreditCard, Settings, Search, Bell, LogOut, Eye, Menu, Plus, Trash2, Edit2, AlertTriangle, TrendingUp, DollarSign, Boxes, Clock, CheckCircle, Upload, Image as ImageIcon, ExternalLink } from 'lucide-react';

type Tab = 'overview'|'products'|'orders'|'store'|'analytics'|'messages'|'reviews'|'payments'|'settings';

const SIDEBAR: {key:Tab,label:string,icon:any}[] = [
  {key:'overview',label:'Overview',icon:LayoutDashboard},
  {key:'products',label:'Products',icon:Package},
  {key:'orders',label:'Orders',icon:ShoppingCart},
  {key:'store',label:'Store',icon:StoreIcon},
  {key:'analytics',label:'Analytics',icon:BarChart3},
  {key:'messages',label:'Messages',icon:MessageSquare},
  {key:'reviews',label:'Reviews',icon:Star},
  {key:'payments',label:'Payments',icon:CreditCard},
  {key:'settings',label:'Settings',icon:Settings},
];

export default function MarketplaceSellerDashboard(){
  const { user, signOut } = useAuth();
  const { seller, store, loading: sellerLoading, refresh } = useSeller();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(()=>{ if(!sellerLoading && !seller) {/* not seller, show info but allow view */} },[sellerLoading,seller]);

  useEffect(()=>{
    if(!seller) return;
    supabase.from('marketplace_notifications' as any).select('*').eq('seller_id', seller.id).order('created_at',{ascending:false}).limit(10).then(({data})=>setNotifications(data||[]));
    const ch = supabase.channel('seller-notifs').on('postgres_changes',{event:'INSERT',schema:'public',table:'marketplace_notifications',filter:`seller_id=eq.${seller.id}`}, payload=> setNotifications(prev=>[payload.new as any, ...prev].slice(0,10))).subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  },[seller?.id]);

  if(!user) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="font-medium">Please log in as seller</p><Link to="/marketplace/seller/login" className="text-primary underline text-sm">Seller Login</Link></div></div>;
  if(sellerLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if(!seller) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-md w-full text-center p-6"><p className="font-semibold">No seller account</p><p className="text-sm text-muted-foreground mt-1">You are logged in as {user.email} but have no seller profile.</p><div className="mt-4 flex gap-2 justify-center"><Link to="/marketplace/seller/register"><Button>Register as Seller</Button></Link><Link to="/marketplace"><Button variant="outline">Browse Marketplace</Button></Link></div></Card>
    </div>
  );
  if(!store) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-6 max-w-md w-full text-center"><p className="font-semibold">Creating your store...</p><Button className="mt-3" onClick={async()=>{
        const slug = seller.full_name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+seller.id.slice(0,4);
        await supabase.from('marketplace_stores' as any).insert([{seller_id:seller.id, store_name: seller.full_name+"'s Store", slug, description:'My store'}]);
        refresh(); toast.success('Store created');
      }}>Create Store</Button></Card>
    </div>
  );

  const markAllRead = async()=>{ await supabase.from('marketplace_notifications' as any).update({is_read:true}).eq('seller_id', seller.id).eq('is_read',false); setNotifications(prev=>prev.map(n=>({...n,is_read:true}))); };

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[240px] shrink-0 bg-card border-r flex-col sticky top-0 h-screen">
        <div className="p-5 border-b flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><StoreIcon className="w-5 h-5" /></div><div><p className="font-bold text-sm leading-none">{store.store_name}</p><p className="text-xs text-muted-foreground truncate max-w-[150px]">{store.slug}</p></div></div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR.map(s=>(
            <button key={s.key} onClick={()=>setTab(s.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left ${tab===s.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}><s.icon className="w-4 h-4" /> {s.label}</button>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Link to={`/marketplace/store/${store.slug}`} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Eye className="w-4 h-4" /> View Store</Link>
          <button onClick={async()=>{ await signOut(); nav('/marketplace'); }} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut className="w-4 h-4" /> Log out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top nav */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu className="w-5 h-5" /></Button></SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0">
                <div className="p-5 border-b flex items-center gap-2"><StoreIcon className="w-5 h-5 text-primary" /><span className="font-bold">{store.store_name}</span></div>
                <nav className="p-3 space-y-1">
                  {SIDEBAR.map(s=>(
                    <button key={s.key} onClick={()=>{setTab(s.key); setMobileOpen(false);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${tab===s.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><s.icon className="w-4 h-4" /> {s.label}</button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <div className="flex-1 max-w-md relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products, orders..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 h-9 bg-muted/50" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Link to={`/marketplace/store/${store.slug}`} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium border rounded-full px-3 py-1.5 hover:bg-muted"><Eye className="w-4 h-4" /> View Store <ExternalLink className="w-3 h-3" /></Link>
              <Dialog>
                <DialogTrigger asChild><Button variant="ghost" size="icon" className="relative"><Bell className="w-5 h-5" />{notifications.filter(n=>!n.is_read).length>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{notifications.filter(n=>!n.is_read).length}</span>}</Button></DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Notifications</DialogTitle></DialogHeader>
                  <div className="space-y-2 max-h-[60vh] overflow-auto">
                    <div className="flex justify-between items-center"><p className="text-xs text-muted-foreground">{notifications.length} recent</p><button onClick={markAllRead} className="text-xs text-primary underline">Mark all read</button></div>
                    {notifications.map(n=>(
                      <div key={n.id} className={`p-3 rounded-lg border text-sm ${n.is_read ? 'bg-card' : 'bg-primary/5 border-primary/20'}`}><p className="font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.message}</p><p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p></div>
                    ))}
                    {notifications.length===0 && <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>}
                  </div>
                </DialogContent>
              </Dialog>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{seller.full_name.charAt(0).toUpperCase()}</div>
              <div className="hidden md:block text-sm leading-tight"><p className="font-medium">{seller.full_name}</p><p className="text-xs text-muted-foreground">{store.store_name}</p></div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {tab==='overview' && <Overview store={store} seller={seller} search={search} />}
          {tab==='products' && <Products store={store} seller={seller} search={search} />}
          {tab==='orders' && <Orders store={store} seller={seller} />}
          {tab==='store' && <StoreTab store={store} seller={seller} refresh={refresh} />}
          {tab==='analytics' && <Analytics store={store} seller={seller} />}
          {tab==='messages' && <Messages store={store} seller={seller} />}
          {tab==='reviews' && <Reviews store={store} seller={seller} />}
          {tab==='payments' && <Payments store={store} seller={seller} />}
          {tab==='settings' && <SettingsTab store={store} seller={seller} refresh={refresh} />}
        </main>
      </div>
    </div>
  );
}

// -------- Overview ----------
function Overview({ store, seller, search }: any){
  const [stats, setStats] = useState<any>({ revenue:0, orders:0, products:0, pending:0, completed:0, lowStock:0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [best, setBest] = useState<any[]>([]);
  const [low, setLow] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    const run = async()=>{
      const [{data:products},{data:orders},{data:payouts}] = await Promise.all([
        supabase.from('marketplace_seller_products' as any).select('id,stock_quantity,sales_count,name,price,views,status').eq('store_id', store.id),
        supabase.from('marketplace_orders' as any).select('id,order_number,customer_name,total,order_status,created_at').eq('store_id', store.id).order('created_at',{ascending:false}).limit(20),
        supabase.from('marketplace_payouts' as any).select('net_amount').eq('store_id', store.id).eq('status','completed'),
      ]);
      const totalRev = (orders||[]).filter((o:any)=>['completed','shipped','confirmed','processing'].includes(o.order_status)).reduce((a,c:any)=>a+Number(c.total),0);
      const pending = (orders||[]).filter((o:any)=>o.order_status==='pending').length;
      const completed = (orders||[]).filter((o:any)=>o.order_status==='completed').length;
      setStats({ revenue: totalRev, orders: orders?.length||0, products: products?.length||0, pending, completed, lowStock: (products||[]).filter((p:any)=>p.stock_quantity<5).length });
      // revenue chart last 7 days
      const days = Array.from({length:7}).map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().slice(0,10); });
      const chart = days.map(d=>({ date: d.slice(5), revenue: (orders||[]).filter((o:any)=>o.created_at.slice(0,10)===d).reduce((a,c:any)=>a+Number(c.total),0)}));
      setRevenueData(chart);
      setRecentOrders((orders||[]).slice(0,5));
      setBest((products||[]).sort((a:any,b:any)=>b.sales_count-a.sales_count).slice(0,3));
      setLow((products||[]).filter((p:any)=>p.stock_quantity<5).slice(0,5));
      const {data:notes}= await supabase.from('marketplace_notifications' as any).select('*').eq('seller_id', seller.id).order('created_at',{ascending:false}).limit(5);
      setActivity(notes||[]);
      setLoading(false);
    }; run();
  },[store.id, seller.id]);
  if(loading) return <div className="grid gap-4"><div className="h-32 bg-muted animate-pulse rounded-xl" /><div className="h-64 bg-muted animate-pulse rounded-xl" /></div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {label:'Total Revenue', value:`$${stats.revenue.toFixed(2)}`, icon:DollarSign, color:'text-green-600 bg-green-50'},
          {label:'Total Orders', value: stats.orders, icon:ShoppingCart, color:'text-blue-600 bg-blue-50'},
          {label:'Products', value: stats.products, icon:Boxes, color:'text-purple-600 bg-purple-50'},
          {label:'Pending Orders', value: stats.pending, icon:Clock, color:'text-amber-600 bg-amber-50'},
          {label:'Completed', value: stats.completed, icon:CheckCircle, color:'text-emerald-600 bg-emerald-50'},
          {label:'Low Stock', value: stats.lowStock, icon:AlertTriangle, color:'text-red-600 bg-red-50'},
        ].map(c=>(
          <Card key={c.label} className="shadow-sm"><CardContent className="p-4"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}><c.icon className="w-4 h-4" /></div><p className="text-xs text-muted-foreground mt-2">{c.label}</p><p className="text-xl font-bold">{c.value}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Revenue — last 7 days</CardTitle></CardHeader><CardContent className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={revenueData}><XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line type="monotone" dataKey="revenue" stroke="hsl(215 70% 35%)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Low Stock Alerts</CardTitle></CardHeader><CardContent className="space-y-2">{low.length? low.map((p:any)=>(<div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-red-50 border border-red-200 text-sm"><span className="font-medium truncate">{p.name}</span><Badge variant="destructive">{p.stock_quantity} left</Badge></div>)) : <p className="text-sm text-muted-foreground py-6 text-center">All stocks healthy ✓</p>}</CardContent></Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Recent Orders</CardTitle></CardHeader><CardContent className="space-y-2">{recentOrders.length? recentOrders.map((o:any)=>(<div key={o.id} className="flex justify-between text-sm p-2 rounded-lg border"><div><p className="font-medium">{o.order_number}</p><p className="text-xs text-muted-foreground">{o.customer_name} • {new Date(o.created_at).toLocaleDateString()}</p></div><div className="text-right"><p className="font-bold">${Number(o.total).toFixed(2)}</p><Badge variant="outline" className="text-[11px]">{o.order_status}</Badge></div></div>)) : <p className="text-sm text-muted-foreground py-6 text-center">No orders yet — share your store link!</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Best-selling Products</CardTitle></CardHeader><CardContent className="space-y-2">{best.length? best.map((p:any)=>(<div key={p.id} className="flex justify-between text-sm p-2 rounded-lg border"><span className="font-medium truncate">{p.name}</span><span className="text-muted-foreground">{p.sales_count} sold • {p.views} views</span></div>)) : <p className="text-sm text-muted-foreground py-6 text-center">Add products to see sales</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader><CardContent className="space-y-2">{activity.map((a:any)=>(<div key={a.id} className="text-sm p-2 rounded-lg bg-muted/50"><p className="font-medium text-xs">{a.title}</p><p className="text-xs text-muted-foreground">{a.message}</p></div>))}{activity.length===0 && <p className="text-sm text-muted-foreground text-center py-6">No activity</p>}</CardContent></Card>
      </div>
    </div>
  );
}

// -------- Products ----------
function Products({ store, seller, search }: any){
  const [products,setProducts]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState('');
  const [cat,setCat]=useState('all');
  const [status,setStatus]=useState('all');
  const [stock,setStock]=useState('all');
  const [sort,setSort]=useState('newest');
  const [page,setPage]=useState(1);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<any>(null);
  const [form,setForm]=useState<any>({ name:'', description:'', price:'', discount_price:'', category:'Food & Snacks', stock_quantity:'10', sku:'', status:'draft', variants:'', images:[] as string[] });
  const [uploading,setUploading]=useState(false);
  const PAGE=6;

  const load=async()=>{
    setLoading(true);
    let query = supabase.from('marketplace_seller_products' as any).select('*').eq('store_id', store.id).order('created_at',{ascending:false});
    const {data}=await query;
    setProducts(data||[]); setLoading(false);
  };
  useEffect(()=>{ load(); },[store.id]);

  const filtered = useMemo(()=>{
    let r=[...products];
    const s=(q||search).toLowerCase();
    if(s) r=r.filter(p=>`${p.name} ${p.description} ${p.sku}`.toLowerCase().includes(s));
    if(cat!=='all') r=r.filter(p=>p.category===cat);
    if(status!=='all') r=r.filter(p=>p.status===status);
    if(stock==='low') r=r.filter(p=>p.stock_quantity<5);
    if(stock==='out') r=r.filter(p=>p.stock_quantity===0);
    if(stock==='in') r=r.filter(p=>p.stock_quantity>0);
    if(sort==='price_asc') r.sort((a,b)=>a.price-b.price);
    if(sort==='price_desc') r.sort((a,b)=>b.price-a.price);
    if(sort==='stock') r.sort((a,b)=>a.stock_quantity-b.stock_quantity);
    return r;
  },[products,q,search,cat,status,stock,sort]);

  const paginated = filtered.slice((page-1)*PAGE, page*PAGE);
  const totalPages=Math.ceil(filtered.length/PAGE)||1;

  const resetForm=()=>{ setForm({ name:'', description:'', price:'', discount_price:'', category:'Food & Snacks', stock_quantity:'10', sku:'', status:'draft', variants:'', images:[] }); setEditing(null); };

  const upload = async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const files=e.target.files; if(!files) return;
    setUploading(true);
    for(const f of Array.from(files)){
      const path=`seller_products/${store.id}/${Date.now()}-${f.name}`;
      const {error}=await supabase.storage.from('marketplace').upload(path,f);
      if(error){ toast.error(error.message); continue; }
      const {data}=supabase.storage.from('marketplace').getPublicUrl(path);
      setForm((prev:any)=>({...prev, images:[...prev.images, data.publicUrl]}));
    }
    setUploading(false);
  };

  const save=async()=>{
    if(!form.name || !form.price){ toast.error('Name and price required'); return; }
    const payload:any={
      store_id: store.id, seller_id: seller.id, name: form.name, description: form.description||null,
      price: Number(form.price), discount_price: form.discount_price? Number(form.discount_price): null,
      category: form.category, stock_quantity: Number(form.stock_quantity), sku: form.sku||null,
      status: form.status, images: form.images, variants: form.variants ? (()=>{ try{return JSON.parse(form.variants)}catch{return []}})() : []
    };
    let err;
    if(editing){
      const {error}=await supabase.from('marketplace_seller_products' as any).update(payload).eq('id', editing.id);
      err=error;
    } else {
      const {error}=await supabase.from('marketplace_seller_products' as any).insert([payload]);
      err=error;
    }
    if(err){ toast.error(err.message); return; }
    toast.success(editing?'Product updated':'Product added'); setOpen(false); resetForm(); load();
  };

  const del=async(id:string)=>{ if(!confirm('Delete product?')) return; await supabase.from('marketplace_seller_products' as any).delete().eq('id',id); toast.success('Deleted'); load(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div><h2 className="font-display text-xl font-bold">Products</h2><p className="text-xs text-muted-foreground">{filtered.length} products • {products.filter(p=>p.status==='published').length} published</p></div>
        <Dialog open={open} onOpenChange={o=>{ setOpen(o); if(!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Add Product</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>{editing?'Edit':'Add'} Product</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Name *</label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Mazoe Raspberry 2L" /></div>
                <div><label className="text-sm font-medium">SKU</label><Input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="SKU-001" /></div>
              </div>
              <div><label className="text-sm font-medium">Description</label><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} /></div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><label className="text-sm">Price *</label><Input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></div>
                <div><label className="text-sm">Discount Price</label><Input type="number" value={form.discount_price} onChange={e=>setForm({...form,discount_price:e.target.value})} placeholder="Optional" /></div>
                <div><label className="text-sm">Stock *</label><Input type="number" value={form.stock_quantity} onChange={e=>setForm({...form,stock_quantity:e.target.value})} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-sm">Category</label><Select value={form.category} onValueChange={v=>setForm({...form,category:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Food & Snacks','Drinks','School Supplies','Clothing & Uniform Items','Other Approved Items'].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="text-sm">Status</label><Select value={form.status} onValueChange={v=>setForm({...form,status:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="out_of_stock">Out of Stock</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>
              </div>
              <div><label className="text-sm">Variants (JSON)</label><Input value={form.variants} onChange={e=>setForm({...form,variants:e.target.value})} placeholder='[{"name":"Size","options":["S","M"]}]' /></div>
              <div><label className="text-sm font-medium flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Images (multiple)</label>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {form.images.map((url:string,i:number)=>(<div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border"><img src={url} className="w-full h-full object-cover" /><button type="button" onClick={()=>setForm({...form,images:form.images.filter((_:any,idx:number)=>idx!==i)})} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><Trash2 className="w-3 h-3" /></button></div>))}
                  <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted text-xs text-muted-foreground">
                    <Upload className="w-5 h-5" />{uploading?'...':'Upload'}<input type="file" multiple accept="image/*" className="hidden" onChange={upload} /></label>
                </div>
              </div>
              <div className="flex gap-2 justify-end"><Button variant="outline" onClick={()=>{setOpen(false); resetForm();}}>Cancel</Button><Button onClick={save}>{editing?'Update':'Add'} Product</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-3 flex flex-wrap gap-2">
        <div className="flex-1 min-w-[180px] relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search name, SKU..." value={q} onChange={e=>{setQ(e.target.value); setPage(1);}} className="pl-8 h-9" /></div>
        <Select value={cat} onValueChange={v=>{setCat(v); setPage(1);}}><SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{['Food & Snacks','Drinks','School Supplies','Clothing & Uniform Items','Other Approved Items'].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={v=>{setStatus(v); setPage(1);}}><SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="out_of_stock">Out of Stock</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select>
        <Select value={stock} onValueChange={v=>{setStock(v); setPage(1);}}><SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Stock" /></SelectTrigger><SelectContent><SelectItem value="all">All Stock</SelectItem><SelectItem value="in">In Stock</SelectItem><SelectItem value="low">Low (&lt;5)</SelectItem><SelectItem value="out">Out</SelectItem></SelectContent></Select>
        <Select value={sort} onValueChange={setSort}><SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="price_asc">Price ↑</SelectItem><SelectItem value="price_desc">Price ↓</SelectItem><SelectItem value="stock">Stock</SelectItem></SelectContent></Select>
      </CardContent></Card>

      {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />)}</div>
       : paginated.length===0 ? (
        <Card className="py-16 text-center"><CardContent><div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center"><Package className="w-7 h-7 text-muted-foreground" /></div><p className="mt-4 font-semibold">No products yet</p><p className="text-sm text-muted-foreground">Start building your store by adding your first product.</p><Button className="mt-4 rounded-full" onClick={()=>setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Add Product</Button></CardContent></Card>
       ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map(p=>(
              <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                  {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-8 h-8" /></div>}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className={p.status==='published'?'bg-green-600': p.status==='draft'?'bg-gray-600': p.status==='out_of_stock'?'bg-red-600':'bg-amber-600'}>{p.status}</Badge>
                    {p.stock_quantity<5 && <Badge variant="destructive">Low {p.stock_quantity}</Badge>}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={()=>{setEditing(p); setForm({ name:p.name, description:p.description||'', price: String(p.price), discount_price: p.discount_price? String(p.discount_price):'', category:p.category, stock_quantity: String(p.stock_quantity), sku:p.sku||'', status:p.status, variants: p.variants? JSON.stringify(p.variants):'', images: p.images||[] }); setOpen(true);}}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={()=>del(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.category} • SKU {p.sku||'—'}</p>
                  <div className="mt-2 flex items-center gap-2"><span className="font-bold text-primary">${Number(p.price).toFixed(2)}</span>{p.discount_price && <span className="text-xs line-through text-muted-foreground">${Number(p.discount_price).toFixed(2)}</span>}<span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">Stock {p.stock_quantity}</span></div>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant={p.status==='published'?'outline':'default'} className="flex-1 h-7 text-xs" onClick={async()=>{ const ns = p.status==='published'?'draft':'published'; await supabase.from('marketplace_seller_products' as any).update({status: ns}).eq('id', p.id); toast.success(ns==='published'?'Published — visible publicly':'Unpublished'); load(); }}>{p.status==='published'?'Unpublish':'Publish'}</Button>
                    <Badge variant="outline" className="text-[11px]">{p.views} views</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center gap-1 pt-2">
            <Button variant="outline" size="sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
            <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
}

// -------- Orders ----------
function Orders({ store, seller }: any){
  const [orders,setOrders]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState<any>(null);
  const [items,setItems]=useState<any[]>([]);
  const load=async()=>{
    setLoading(true);
    const {data}=await supabase.from('marketplace_orders' as any).select('*').eq('store_id', store.id).order('created_at',{ascending:false});
    setOrders(data||[]); setLoading(false);
  };
  useEffect(()=>{ load(); const ch=supabase.channel('orders-seller').on('postgres_changes',{event:'*',schema:'public',table:'marketplace_orders',filter:`store_id=eq.${store.id}`},load).subscribe(); return()=>{ supabase.removeChannel(ch);}; },[store.id]);
  const openOrder=async(o:any)=>{
    setSelected(o);
    const {data}=await supabase.from('marketplace_order_items' as any).select('*').eq('order_id', o.id);
    setItems(data||[]);
  };
  const updateStatus=async(id:string, status:string)=>{
    const {error}=await supabase.from('marketplace_orders' as any).update({order_status: status}).eq('id',id);
    if(error) toast.error(error.message); else { toast.success('Order '+status); load(); if(selected?.id===id) setSelected({...selected, order_status: status}); }
  };
  return (
    <div className="space-y-4">
      <div><h2 className="font-display text-xl font-bold">Orders</h2><p className="text-xs text-muted-foreground">Orders containing your products — update status to keep customers informed</p></div>
      {loading ? <div className="h-64 bg-muted animate-pulse rounded-xl" /> :
       orders.length===0 ? <Card className="py-16 text-center"><CardContent><ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground" /><p className="mt-3 font-medium">No orders yet</p><p className="text-sm text-muted-foreground">When customers buy from your store, orders appear here</p></CardContent></Card> :
       <Card><div className="overflow-auto"><table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="text-left p-3">Order ID</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Products</th><th className="text-left p-3">Total</th><th className="text-left p-3">Date</th><th className="text-left p-3">Payment</th><th className="text-left p-3">Status</th><th className="p-3">Action</th></tr></thead>
        <tbody>{orders.map((o:any)=>(
          <tr key={o.id} className="border-t hover:bg-muted/30">
            <td className="p-3 font-mono text-xs">{o.order_number}</td>
            <td className="p-3"><p className="font-medium">{o.customer_name}</p><p className="text-xs text-muted-foreground">{o.customer_email||''}</p></td>
            <td className="p-3 text-xs">{o.notes||'—'}</td>
            <td className="p-3 font-bold">${Number(o.total).toFixed(2)}</td>
            <td className="p-3 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
            <td className="p-3"><Badge variant={o.payment_status==='paid'?'default':'secondary'}>{o.payment_status}</Badge></td>
            <td className="p-3"><Badge variant="outline" className={o.order_status==='completed'?'bg-green-50 text-green-700':''}>{o.order_status}</Badge></td>
            <td className="p-3"><Button size="sm" variant="outline" onClick={()=>openOrder(o)}>View</Button></td>
          </tr>
        ))}</tbody>
       </table></div></Card>
      }
      <Dialog open={!!selected} onOpenChange={o=>!o && setSelected(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Order {selected?.order_number}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg"><div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{selected.customer_name}</p><p className="text-xs">{selected.customer_email}</p></div><div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-lg">${Number(selected.total).toFixed(2)}</p><p className="text-xs">Fee ${Number(selected.platform_fee).toFixed(2)} • You get ${Number(selected.seller_earnings).toFixed(2)}</p></div></div>
              <div className="space-y-2">{items.map((it:any)=>(<div key={it.id} className="flex gap-3 p-2 border rounded-lg"><img src={it.product_image||''} className="w-12 h-12 rounded object-cover bg-muted" /><div className="flex-1"><p className="font-medium text-sm">{it.product_name}</p><p className="text-xs text-muted-foreground">Qty {it.quantity} × ${Number(it.unit_price).toFixed(2)}</p></div><p className="font-bold">${Number(it.total).toFixed(2)}</p></div>))}{items.length===0 && <p className="text-xs text-muted-foreground">No items detail (order placed via old listings)</p>}</div>
              <div><p className="text-xs font-medium">Update status</p><div className="flex flex-wrap gap-1 mt-1">{['pending','confirmed','processing','shipped','completed','cancelled','refunded'].map(s=>(
                <button key={s} onClick={()=>updateStatus(selected.id,s)} className={`px-2.5 py-1 rounded-full text-xs border ${selected.order_status===s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{s}</button>
              ))}</div></div>
              <div className="flex gap-2 justify-end"><Button variant="outline" onClick={()=>setSelected(null)}>Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -------- Store ----------
function StoreTab({ store, seller, refresh }: any){
  const [form,setForm]=useState<any>({ store_name: store.store_name, description: store.description||'', contact_email: store.contact_email||'', contact_phone: store.contact_phone||'', location: store.location||'', business_hours: JSON.stringify(store.business_hours||{},null,2), social_links: JSON.stringify(store.social_links||{},null,2), logo_url: store.logo_url||'', banner_url: store.banner_url||'' });
  const [saving,setSaving]=useState(false);
  const upload = async(file:File, field:'logo_url'|'banner_url')=>{
    const path=`stores/${store.id}/${field}-${Date.now()}-${file.name}`;
    const {error}=await supabase.storage.from('marketplace').upload(path,file);
    if(error){ toast.error(error.message); return; }
    const {data}=supabase.storage.from('marketplace').getPublicUrl(path);
    setForm({...form, [field]: data.publicUrl});
  };
  const save=async()=>{
    setSaving(true);
    let bh={}, sl={};
    try{ bh = form.business_hours ? JSON.parse(form.business_hours) : {}; }catch{ toast.error('Business hours invalid JSON'); setSaving(false); return; }
    try{ sl = form.social_links ? JSON.parse(form.social_links) : {}; }catch{ toast.error('Social links invalid JSON'); setSaving(false); return; }
    const {error}=await supabase.from('marketplace_stores' as any).update({
      store_name: form.store_name, description: form.description, contact_email: form.contact_email, contact_phone: form.contact_phone,
      location: form.location, business_hours: bh, social_links: sl, logo_url: form.logo_url, banner_url: form.banner_url
    }).eq('id', store.id);
    if(error) toast.error(error.message); else { toast.success('Store updated — marketplace reflects immediately'); refresh(); }
    setSaving(false);
  };
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex justify-between items-start"><div><h2 className="font-display text-xl font-bold">Store Management</h2><p className="text-xs text-muted-foreground">Customize how your store appears publicly at <span className="font-mono text-primary">/marketplace/store/{store.slug}</span></p></div><Link to={`/marketplace/store/${store.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm border rounded-full px-3 py-1.5 hover:bg-muted"><Eye className="w-4 h-4" /> Preview Store</Link></div>
      <Card><CardContent className="p-5 space-y-4">
        <div><label className="text-sm font-medium">Store Name</label><Input value={form.store_name} onChange={e=>setForm({...form, store_name:e.target.value})} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm font-medium flex items-center gap-2">Logo {form.logo_url && <img src={form.logo_url} className="w-8 h-8 rounded object-cover" />}</label><label className="mt-1 flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted"><Upload className="w-4 h-4" /> Upload Logo<input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) upload(f,'logo_url'); }} /></label><Input placeholder="or paste URL" value={form.logo_url} onChange={e=>setForm({...form, logo_url:e.target.value})} className="mt-2" /></div>
          <div><label className="text-sm font-medium">Banner</label><label className="mt-1 flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted"><Upload className="w-4 h-4" /> Upload Banner<input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) upload(f,'banner_url'); }} /></label><Input placeholder="or paste URL" value={form.banner_url} onChange={e=>setForm({...form, banner_url:e.target.value})} className="mt-2" />{form.banner_url && <img src={form.banner_url} className="mt-2 w-full h-28 object-cover rounded-lg border" />}</div>
        </div>
        <div><label className="text-sm font-medium">Description</label><Textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} rows={3} placeholder="Tell customers about your store" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm">Contact Email</label><Input value={form.contact_email} onChange={e=>setForm({...form, contact_email:e.target.value})} /></div>
          <div><label className="text-sm">Contact Phone</label><Input value={form.contact_phone} onChange={e=>setForm({...form, contact_phone:e.target.value})} /></div>
        </div>
        <div><label className="text-sm">Location</label><Input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} placeholder="Block A, Room 12" /></div>
        <div><label className="text-sm">Business Hours (JSON)</label><Textarea value={form.business_hours} onChange={e=>setForm({...form, business_hours:e.target.value})} rows={3} className="font-mono text-xs" placeholder='{"mon":"8am-4pm"}' /></div>
        <div><label className="text-sm">Social Links (JSON)</label><Textarea value={form.social_links} onChange={e=>setForm({...form, social_links:e.target.value})} rows={2} className="font-mono text-xs" placeholder='{"facebook":"https://...","whatsapp":"..."}' /></div>
        <Button onClick={save} disabled={saving} className="rounded-full">{saving?'Saving...':'Save Store'}</Button>
      </CardContent></Card>
    </div>
  );
}

// -------- Analytics ----------
function Analytics({ store }: any){
  const [range,setRange]=useState('30');
  const [data,setData]=useState<any>({ revenue:0, orders:0, aov:0, best:[], chart:[], views:0 });
  useEffect(()=>{
    const fetch = async()=>{
      const days = range==='today'?1: range==='7'?7: range==='30'?30: range==='90'?90:365;
      const since = new Date(); since.setDate(since.getDate()-days);
      const {data:orders}=await supabase.from('marketplace_orders' as any).select('total,created_at').eq('store_id', store.id).gte('created_at', since.toISOString());
      const {data:products}=await supabase.from('marketplace_seller_products' as any).select('name,sales_count,views').eq('store_id', store.id).order('sales_count',{ascending:false}).limit(5);
      const rev = (orders||[]).reduce((a,c:any)=>a+Number(c.total),0);
      const chartMap:Record<string,number>={};
      (orders||[]).forEach((o:any)=>{ const d=o.created_at.slice(0,10); chartMap[d]=(chartMap[d]||0)+Number(o.total); });
      const chart = Object.entries(chartMap).map(([date,revenue])=>({date:date.slice(5), revenue})).sort((a,b)=>a.date.localeCompare(b.date));
      setData({ revenue: rev, orders: orders?.length||0, aov: orders?.length? rev/orders.length:0, best: products||[], chart, views: (products||[]).reduce((a,c:any)=>a+c.views,0) });
    }; fetch();
  },[store.id, range]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-display text-xl font-bold">Analytics</h2>
        <div className="flex gap-1">{[['today','Today'],['7','7 days'],['30','30 days'],['90','3 months'],['365','1 year']].map(([k,l])=>(
          <button key={k} onClick={()=>setRange(k)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${range===k?'bg-primary text-primary-foreground':'hover:bg-muted'}`}>{l}</button>
        ))}</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Revenue', value:`$${data.revenue.toFixed(2)}`},
          {label:'Orders', value: data.orders},
          {label:'Avg Order Value', value:`$${data.aov.toFixed(2)}`},
          {label:'Product Views', value: data.views},
        ].map(c=>(
          <Card key={c.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{c.label}</p><p className="text-xl font-bold">{c.value}</p></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle className="text-sm">Sales over time</CardTitle></CardHeader><CardContent className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.chart}><XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="revenue" fill="hsl(215 70% 35%)" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Best-selling products</CardTitle></CardHeader><CardContent className="space-y-2">{data.best.map((p:any)=>(<div key={p.name} className="flex justify-between text-sm p-2 border rounded-lg"><span className="font-medium">{p.name}</span><span className="text-muted-foreground">{p.sales_count} sales • {p.views} views</span></div>))}{data.best.length===0 && <p className="text-sm text-muted-foreground text-center py-6">No sales yet</p>}</CardContent></Card>
    </div>
  );
}

// -------- Messages ----------
function Messages({ store, seller }: any){
  const [msgs,setMsgs]=useState<any[]>([]);
  const [text,setText]=useState('');
  const [customer,setCustomer]=useState('Customer');
  const [selectedCustomer,setSelectedCustomer]=useState<string|null>(null);
  const load=async()=>{
    const {data}=await supabase.from('marketplace_messages' as any).select('*').eq('store_id', store.id).order('created_at',{ascending:false}).limit(50);
    setMsgs(data||[]);
  };
  useEffect(()=>{ load(); const ch=supabase.channel('msgs-seller').on('postgres_changes',{event:'INSERT',schema:'public',table:'marketplace_messages',filter:`store_id=eq.${store.id}`},load).subscribe(); return()=>supabase.removeChannel(ch); },[store.id]);
  const send=async()=>{
    if(!text.trim()) return;
    await supabase.from('marketplace_messages' as any).insert([{ store_id: store.id, seller_id: seller.id, customer_name: customer, message: text, sender_type:'seller', sender_id: seller.user_id }]);
    setText(''); toast.success('Sent'); load();
  };
  const customers=[...new Set(msgs.map(m=>m.customer_name))];
  const filtered = selectedCustomer ? msgs.filter(m=>m.customer_name===selectedCustomer) : msgs;
  return (
    <div className="grid lg:grid-cols-3 gap-4 h-[70vh]">
      <Card className="p-3 overflow-auto"><p className="font-semibold text-sm mb-2">Conversations</p>
        <button onClick={()=>setSelectedCustomer(null)} className={`w-full text-left p-2 rounded-lg text-sm mb-1 ${!selectedCustomer?'bg-primary text-primary-foreground':'hover:bg-muted'}`}>All messages ({msgs.length})</button>
        {customers.map(c=>(
          <button key={c} onClick={()=>setSelectedCustomer(c)} className={`w-full text-left p-2 rounded-lg text-sm flex justify-between ${selectedCustomer===c?'bg-primary text-primary-foreground':'hover:bg-muted'}`}><span>{c}</span><span className="text-xs">{msgs.filter(m=>m.customer_name===c && !m.is_read && m.sender_type==='customer').length ? '●' : ''}</span></button>
        ))}
        {customers.length===0 && <p className="text-xs text-muted-foreground text-center py-6">No conversations yet</p>}
      </Card>
      <Card className="lg:col-span-2 flex flex-col">
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {filtered.slice().reverse().map(m=>(
            <div key={m.id} className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender_type==='seller'?'ml-auto bg-primary text-primary-foreground':'bg-muted'}`}>
              <p className="text-xs font-medium opacity-70">{m.sender_type==='seller'?'You':m.customer_name} • {new Date(m.created_at).toLocaleString()}</p><p>{m.message}</p>{m.order_id && <p className="text-xs opacity-70">Order {m.order_id.slice(0,8)}</p>}
            </div>
          ))}
          {filtered.length===0 && <p className="text-sm text-muted-foreground text-center py-10">No messages — customers will message about orders/products</p>}
        </div>
        <div className="p-3 border-t flex gap-2">
          <Input placeholder="Customer name (for demo)" value={customer} onChange={e=>setCustomer(e.target.value)} className="w-[140px]" />
          <Input placeholder="Type a reply..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter' && send()} className="flex-1" />
          <Button onClick={send}>Send</Button>
        </div>
      </Card>
    </div>
  );
}

// -------- Reviews ----------
function Reviews({ store }: any){
  const [reviews,setReviews]=useState<any[]>([]);
  const [avg,setAvg]=useState(0);
  const load=async()=>{
    const {data}=await supabase.from('marketplace_reviews' as any).select('*, marketplace_seller_products(name)').eq('store_id', store.id).order('created_at',{ascending:false});
    setReviews(data||[]);
    if(data?.length) setAvg(data.reduce((a,c:any)=>a+c.rating,0)/data.length);
  };
  useEffect(()=>{ load(); },[store.id]);
  const reply=async(id:string, text:string)=>{
    await supabase.from('marketplace_reviews' as any).update({seller_reply:text}).eq('id',id);
    toast.success('Reply saved'); load();
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4"><h2 className="font-display text-xl font-bold">Reviews</h2><div className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /><span className="font-bold">{avg.toFixed(1)}</span><span className="text-sm text-muted-foreground">({reviews.length})</span></div></div>
      {reviews.length===0 ? <Card className="py-12 text-center"><CardContent><Star className="w-10 h-10 mx-auto text-muted-foreground" /><p className="mt-2 font-medium">No reviews yet</p><p className="text-sm text-muted-foreground">Customer reviews will appear here</p></CardContent></Card> :
       <div className="space-y-3">{reviews.map((r:any)=>(
        <Card key={r.id}><CardContent className="p-4">
          <div className="flex justify-between"><div><p className="font-medium text-sm">{r.customer_name} • <span className="text-muted-foreground">{r.marketplace_seller_products?.name}</span></p><div className="flex gap-0.5 mt-1">{Array.from({length:5}).map((_,i)=><Star key={i} className={`w-4 h-4 ${i<r.rating?'fill-amber-500 text-amber-500':'text-muted'}`} />)}</div></div><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p></div>
          <p className="text-sm mt-2">{r.comment || 'No comment'}</p>
          {r.seller_reply ? <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"><p className="text-xs font-semibold">Your reply</p><p className="text-sm">{r.seller_reply}</p></div>
          : <div className="mt-3 flex gap-2"><Input placeholder="Reply to this review..." id={`reply-${r.id}`} /><Button size="sm" onClick={()=>{ const el=document.getElementById(`reply-${r.id}`) as HTMLInputElement; if(el?.value) reply(r.id, el.value); }}>Reply</Button></div>}
        </CardContent></Card>
       ))}</div>
      }
    </div>
  );
}

// -------- Payments ----------
function Payments({ store, seller }: any){
  const [payouts,setPayouts]=useState<any[]>([]);
  const [orders,setOrders]=useState<any[]>([]);
  useEffect(()=>{
    supabase.from('marketplace_payouts' as any).select('*').eq('store_id', store.id).order('created_at',{ascending:false}).then(({data})=>setPayouts(data||[]));
    supabase.from('marketplace_orders' as any).select('total,platform_fee,seller_earnings,payment_status').eq('store_id', store.id).then(({data})=>setOrders(data||[]));
  },[store.id]);
  const totalEarnings = orders.filter(o=>o.payment_status==='paid').reduce((a,c)=>a+Number(c.seller_earnings),0);
  const pending = payouts.filter(p=>p.status==='pending').reduce((a,c)=>a+Number(c.net_amount),0);
  const completed = payouts.filter(p=>p.status==='completed').reduce((a,c)=>a+Number(c.net_amount),0);
  const available = Math.max(0, totalEarnings - completed - pending);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold">Payments</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Total Earnings', value:`$${totalEarnings.toFixed(2)}`, sub:'Customer payment − 10% fee'},
          {label:'Available Balance', value:`$${available.toFixed(2)}`, sub:'Ready for payout'},
          {label:'Pending Balance', value:`$${pending.toFixed(2)}`, sub:'Processing'},
          {label:'Completed Payouts', value:`$${completed.toFixed(2)}`, sub:'Paid to you'},
        ].map(c=>(
          <Card key={c.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{c.label}</p><p className="text-xl font-bold">{c.value}</p><p className="text-[11px] text-muted-foreground">{c.sub}</p></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle className="text-sm">How it breaks down</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
        <div className="flex justify-between p-2 rounded-lg bg-muted/50"><span>Customer payment</span><span className="font-medium">${orders.reduce((a,c)=>a+Number(c.total),0).toFixed(2)}</span></div>
        <div className="flex justify-between p-2 rounded-lg bg-amber-50 border border-amber-200"><span>Marketplace fee (10%)</span><span className="font-medium text-amber-700">-${orders.reduce((a,c)=>a+Number(c.platform_fee),0).toFixed(2)}</span></div>
        <div className="flex justify-between p-2 rounded-lg bg-green-50 border border-green-200 font-bold"><span>Seller earnings</span><span>${totalEarnings.toFixed(2)}</span></div>
        <p className="text-xs text-muted-foreground">Payout amount = seller earnings − any pending payouts. Sensitive bank details not shown here.</p>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Payout History</CardTitle></CardHeader><CardContent>
        {payouts.length===0 ? <p className="text-sm text-muted-foreground text-center py-6">No payouts yet — earnings accumulate as orders are marked paid/completed</p> :
         <div className="space-y-2">{payouts.map((p:any)=>(<div key={p.id} className="flex justify-between text-sm p-3 border rounded-lg"><div><p className="font-medium">${Number(p.net_amount).toFixed(2)} <Badge variant={p.status==='completed'?'default':'secondary'}>{p.status}</Badge></p><p className="text-xs text-muted-foreground">Amount ${Number(p.amount).toFixed(2)} − fee ${Number(p.platform_fee).toFixed(2)} • {new Date(p.created_at).toLocaleDateString()}</p></div><span className="text-xs">{p.payout_method||''}</span></div>))}</div>}
      </CardContent></Card>
    </div>
  );
}

// -------- Settings ----------
function SettingsTab({ store, seller, refresh }: any){
  const { user } = useAuth();
  const [profile,setProfile]=useState({ full_name: seller.full_name, email: seller.email, phone: seller.phone });
  const [pw,setPw]=useState({ newPin:'', confirm:'' });
  const saveProfile=async()=>{
    await supabase.from('marketplace_sellers' as any).update({ full_name: profile.full_name, email: profile.email, phone: profile.phone }).eq('id', seller.id);
    toast.success('Profile saved'); refresh();
  };
  const updatePin=async()=>{
    if(!/^\d{4,6}$/.test(pw.newPin)) { toast.error('PIN must be 4-6 digits'); return; }
    if(pw.newPin!==pw.confirm) { toast.error('PINs mismatch'); return; }
    const pwd = pw.newPin.length>=6 ? pw.newPin : pw.newPin.padEnd(6,'0');
    const {error}=await supabase.auth.updateUser({ password: pwd });
    if(error) toast.error(error.message); else { toast.success('PIN updated — use new PIN next login'); setPw({newPin:'',confirm:''}); }
  };
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-display text-xl font-bold">Settings</h2>
      <Card><CardHeader><CardTitle className="text-sm">Seller Profile</CardTitle></CardHeader><CardContent className="space-y-3">
        <div><label className="text-sm">Full Name</label><Input value={profile.full_name} onChange={e=>setProfile({...profile, full_name:e.target.value})} /></div>
        <div className="grid sm:grid-cols-2 gap-3"><div><label className="text-sm">Phone (login number)</label><Input value={profile.phone} onChange={e=>setProfile({...profile, phone:e.target.value.replace(/[^0-9+]/g,'')})} /></div><div><label className="text-sm">Contact Email</label><Input value={profile.email} onChange={e=>setProfile({...profile, email:e.target.value})} /></div></div>
        <p className="text-xs text-muted-foreground">Logged as {user?.email} • Phone login: {profile.phone} • Seller {seller.id.slice(0,8)} • Store {store.slug}</p>
        <Button onClick={saveProfile} size="sm">Save Profile</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Change PIN</CardTitle></CardHeader><CardContent className="space-y-3">
        <Input type="password" inputMode="numeric" maxLength={6} placeholder="New PIN (4-6 digits)" value={pw.newPin} onChange={e=>setPw({...pw, newPin:e.target.value.replace(/[^0-9]/g,'')})} />
        <Input type="password" inputMode="numeric" maxLength={6} placeholder="Confirm PIN" value={pw.confirm} onChange={e=>setPw({...pw, confirm:e.target.value.replace(/[^0-9]/g,'')})} />
        <Button onClick={updatePin} size="sm" variant="outline">Update PIN</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Notification Preferences</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Email notifications for new orders, reviews, low stock, messages and payouts are enabled by default. Manage in Supabase Auth email settings.</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Payout Settings</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
        <Input placeholder="Payout method (e.g., Bank, EcoCash)" defaultValue="" onBlur={async e=>{ const v=e.target.value; if(v) await supabase.from('marketplace_sellers' as any).update({ internal_notes: `Payout: ${v}` }).eq('id', seller.id); }} />
        <p className="text-xs text-muted-foreground">No sensitive payment info is stored in plain text. Contact admin to configure real payouts.</p>
      </CardContent></Card>
      <Card><CardContent className="p-4 flex gap-2"><Link to={`/marketplace/store/${store.slug}`}><Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" /> View Public Store</Button></Link><Link to="/marketplace"><Button variant="ghost" size="sm">Back to Marketplace</Button></Link></CardContent></Card>
    </div>
  );
}
