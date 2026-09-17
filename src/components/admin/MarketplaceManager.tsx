import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function MarketplaceManager() {
  const [tab, setTab] = useState<'sellers'|'listings'|'products'|'compliance'|'rules'>('sellers');
  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-4">Marketplace Management</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['sellers','listings','products','compliance','rules'] as const).map(k=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab===k?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground'}`}>{k.charAt(0).toUpperCase()+k.slice(1)}</button>
        ))}
      </div>
      {tab==='sellers' && <SellersTab />}
      {tab==='listings' && <ListingsTab />}
      {tab==='products' && <ProductsTab />}
      {tab==='compliance' && <ComplianceTab />}
      {tab==='rules' && <RulesTab />}
    </div>
  );
}

function SellersTab(){
  const [sellers,setSellers]=useState<any[]>([]);
  const load=useCallback(()=>{ supabase.from('marketplace_sellers' as any).select('*').order('created_at',{ascending:false}).then(({data})=>setSellers(data||[])); },[]);
  useEffect(()=>{ load(); },[load]);
  const updateStatus=async(id:string, status:string, reason?:string)=>{
    const payload:any={status};
    if(reason!==undefined) payload.suspension_reason=reason;
    const {error}=await supabase.from('marketplace_sellers' as any).update(payload).eq('id',id);
    if(error) toast.error(error.message); else { toast.success('Updated'); load(); await supabase.from('marketplace_audit_log' as any).insert([{action: `seller_${status}`, target_type:'seller', target_id:id, details: reason||status}]); }
  };
  const saveNotes=async(id:string, notes:string)=>{
    await supabase.from('marketplace_sellers' as any).update({internal_notes:notes}).eq('id',id);
    toast.success('Notes saved');
  };
  return (
    <div className="space-y-3">
      {sellers.map(s=>(
        <div key={s.id} className="bg-card border rounded-lg p-4">
          <div className="flex justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{s.full_name} <span className="text-xs text-muted-foreground">({s.seller_type})</span></p>
              <p className="text-xs text-muted-foreground">{s.email} • {s.phone} • {s.student_name ? `${s.student_name} (${s.student_id_reg})`:''}</p>
              <p className="text-xs mt-1">Intended: {s.intended_items}</p>
              <p className="text-xs">Status: <span className={`px-2 py-0.5 rounded-full text-xs ${s.status==='active'?'bg-green-100 text-green-700': s.status==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{s.status}</span> Violations: {s.violation_count} {s.suspension_reason && <span className="text-red-600">— {s.suspension_reason}</span>}</p>
            </div>
            <div className="flex flex-wrap gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={()=>updateStatus(s.id,'active')}>Approve</Button>
              <Button size="sm" variant="outline" onClick={()=>updateStatus(s.id,'rejected','Rejected by admin')}>Reject</Button>
              <Button size="sm" variant="outline" onClick={()=>{const r=prompt('Suspension reason'); if(r!==null) updateStatus(s.id,'suspended',r);}}>Suspend</Button>
              <Button size="sm" variant="outline" onClick={()=>updateStatus(s.id,'active')}>Unsuspend</Button>
              <Button size="sm" variant="destructive" onClick={()=>updateStatus(s.id,'banned','Banned by admin')}>Ban</Button>
            </div>
          </div>
          <div className="mt-3">
            <Textarea placeholder="Internal notes" defaultValue={s.internal_notes||''} onBlur={e=>saveNotes(s.id, e.target.value)} rows={2} />
          </div>
        </div>
      ))}
      {sellers.length===0 && <p className="text-sm text-muted-foreground">No sellers yet</p>}
    </div>
  );
}

function ListingsTab(){
  const [listings,setListings]=useState<any[]>([]);
  const load=useCallback(()=>{ supabase.from('marketplace_listings' as any).select('*, marketplace_products(name), marketplace_sellers(full_name)').order('created_at',{ascending:false}).then(({data})=>setListings(data||[])); },[]);
  useEffect(()=>{ load(); },[load]);
  const update=async(id:string, patch:any)=>{
    const {error}=await supabase.from('marketplace_listings' as any).update(patch).eq('id',id);
    if(error) toast.error(error.message); else { toast.success('Updated'); load();}
  };
  const remove=async(id:string)=>{
    await supabase.from('marketplace_listings' as any).delete().eq('id',id);
    toast.success('Removed'); load();
  };
  return (
    <div className="space-y-3">
      {listings.map(l=>(
        <div key={l.id} className="bg-card border rounded-lg p-4 flex gap-4">
          {l.image_url ? <img src={l.image_url} alt="" className="w-20 h-20 rounded object-cover shrink-0"/> : <div className="w-20 h-20 bg-muted rounded shrink-0"/>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{l.marketplace_products?.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{l.category}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${l.status==='approved'?'bg-green-100 text-green-700': l.status==='pending_review'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{l.status}</span>
              {l.flagged && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Flagged: {l.flag_reason}</span>}
            </div>
            <p className="text-sm text-muted-foreground">{l.description}</p>
            <p className="text-sm font-semibold">${Number(l.price).toFixed(2)} • {l.marketplace_sellers?.full_name}</p>
            <div className="flex gap-1 mt-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={()=>update(l.id,{status:'approved', is_visible:true})}>Approve</Button>
              <Button size="sm" variant="outline" onClick={()=>update(l.id,{status:'rejected'})}>Reject</Button>
              <Button size="sm" variant="outline" onClick={()=>update(l.id,{status:'suspended', is_visible:false})}>Suspend</Button>
              <Button size="sm" variant="destructive" onClick={()=>remove(l.id)}>Remove</Button>
            </div>
          </div>
        </div>
      ))}
      {listings.length===0 && <p className="text-sm text-muted-foreground">No listings</p>}
    </div>
  );
}

function ProductsTab(){
  const [products,setProducts]=useState<any[]>([]);
  const [form,setForm]=useState({name:'', category:'Food & Snacks' as any, description:'', min_price:'', max_price:'', is_approved:true, is_prohibited:false, enabled:true});
  const [editing,setEditing]=useState<string|null>(null);
  const load=useCallback(()=>{ supabase.from('marketplace_products' as any).select('*').order('category').order('name').then(({data})=>setProducts(data||[])); },[]);
  useEffect(()=>{ load(); },[load]);
  const save=async()=>{
    if(!form.name) {toast.error('Name required'); return;}
    const payload:any={
      name: form.name,
      category: form.category,
      description: form.description||null,
      min_price: form.min_price? Number(form.min_price): null,
      max_price: form.max_price? Number(form.max_price): null,
      is_approved: form.is_approved,
      is_prohibited: form.is_prohibited,
      enabled: form.enabled,
    };
    let error;
    if(editing){
      const r=await supabase.from('marketplace_products' as any).update(payload).eq('id',editing);
      error=r.error;
    } else {
      const r=await supabase.from('marketplace_products' as any).insert([payload]);
      error=r.error;
    }
    if(error) toast.error(error.message); else { toast.success(editing?'Updated':'Created'); setForm({name:'', category:'Food & Snacks', description:'', min_price:'', max_price:'', is_approved:true, is_prohibited:false, enabled:true}); setEditing(null); load(); }
  };
  const edit=(p:any)=>{
    setEditing(p.id);
    setForm({name:p.name, category:p.category, description:p.description||'', min_price:p.min_price?.toString()||'', max_price:p.max_price?.toString()||'', is_approved:p.is_approved, is_prohibited:p.is_prohibited, enabled:p.enabled});
  };
  const remove=async(id:string)=>{
    await supabase.from('marketplace_products' as any).delete().eq('id',id);
    toast.success('Removed'); load();
  };
  return (
    <div>
      <div className="bg-card border rounded-lg p-4 space-y-3 mb-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="Product name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <select value={form.category} onChange={e=>setForm({...form, category:e.target.value as any})} className="h-10 rounded-md border px-3 text-sm bg-background">
            {['Food & Snacks','Drinks','School Supplies','Clothing & Uniform Items','Other Approved Items'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Min price" type="number" value={form.min_price} onChange={e=>setForm({...form, min_price:e.target.value})} />
          <Input placeholder="Max price" type="number" value={form.max_price} onChange={e=>setForm({...form, max_price:e.target.value})} />
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1"><input type="checkbox" checked={form.is_approved} onChange={e=>setForm({...form, is_approved:e.target.checked})} /> Approved</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={form.is_prohibited} onChange={e=>setForm({...form, is_prohibited:e.target.checked})} /> Prohibited</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form, enabled:e.target.checked})} /> Enabled</label>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>{editing?'Update':'Add'} Product</Button>
          {editing && <Button size="sm" variant="outline" onClick={()=>{setEditing(null); setForm({name:'', category:'Food & Snacks', description:'', min_price:'', max_price:'', is_approved:true, is_prohibited:false, enabled:true});}}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-2">
        {products.map(p=>(
          <div key={p.id} className="bg-card border rounded-lg p-3 flex justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{p.name} <span className="text-xs text-muted-foreground">({p.category})</span></p>
              <p className="text-xs text-muted-foreground">{p.min_price||'—'} - {p.max_price||'—'} • {p.is_approved?'Approved':''} {p.is_prohibited?'Prohibited':''} {p.enabled?'Enabled':'Disabled'}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={()=>edit(p)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={()=>remove(p.id)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplianceTab(){
  const [stats,setStats]=useState({pendingSellers:0, pendingListings:0, flagged:0, suspended:0, violations:0});
  const [recent,setRecent]=useState<any[]>([]);
  useEffect(()=>{
    const fetchStats=async()=>{
      const [{count:pendingSellers},{count:pendingListings},{count:flagged},{count:suspended}] = await Promise.all([
        supabase.from('marketplace_sellers' as any).select('*',{count:'exact', head:true}).eq('status','pending'),
        supabase.from('marketplace_listings' as any).select('*',{count:'exact', head:true}).eq('status','pending_review'),
        supabase.from('marketplace_listings' as any).select('*',{count:'exact', head:true}).eq('flagged',true),
        supabase.from('marketplace_sellers' as any).select('*',{count:'exact', head:true}).in('status',['suspended','banned']),
      ]);
      const {data:viol}=await supabase.from('marketplace_sellers' as any).select('violation_count');
      const violations = (viol||[]).reduce((a,c)=>a+(c.violation_count||0),0);
      setStats({pendingSellers:pendingSellers||0, pendingListings:pendingListings||0, flagged:flagged||0, suspended:suspended||0, violations});
      const {data:rec}=await supabase.from('marketplace_audit_log' as any).select('*').order('created_at',{ascending:false}).limit(10);
      setRecent(rec||[]);
    };
    fetchStats();
  },[]);
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries({ 'Pending Sellers': stats.pendingSellers, 'Pending Listings': stats.pendingListings, 'Flagged': stats.flagged, 'Suspended': stats.suspended, 'Violations': stats.violations }).map(([k,v])=>(
          <div key={k} className="bg-card border rounded-xl p-4 text-center"><p className="text-xs text-muted-foreground uppercase tracking-widest">{k}</p><p className="text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      <h3 className="font-semibold mb-2">Recent Moderation Actions</h3>
      <div className="space-y-2">
        {recent.map(r=>(
          <div key={r.id} className="bg-card border rounded-lg p-3 text-sm">
            <p className="font-medium">{r.action} <span className="text-muted-foreground">— {r.target_type}:{r.target_id?.slice(0,8)}</span></p>
            <p className="text-xs text-muted-foreground">{r.details} • {new Date(r.created_at).toLocaleString()}</p>
          </div>
        ))}
        {recent.length===0 && <p className="text-sm text-muted-foreground">No actions yet</p>}
      </div>
    </div>
  );
}

function RulesTab(){
  const [content,setContent]=useState('');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    supabase.from('marketplace_rules' as any).select('content').limit(1).maybeSingle().then(({data})=>{ if(data) setContent(data.content); setLoading(false);});
  },[]);
  const save=async()=>{
    const { data } = await supabase.from('marketplace_rules' as any).select('id').limit(1).maybeSingle();
    if(data){
      await supabase.from('marketplace_rules' as any).update({content}).eq('id', data.id);
    } else {
      await supabase.from('marketplace_rules' as any).insert([{content}]);
    }
    toast.success('Rules updated');
    await supabase.from('marketplace_audit_log' as any).insert([{action:'update_rules', target_type:'rules', details: 'Marketplace rules updated'}]);
  };
  if(loading) return <p>Loading...</p>;
  return (
    <div>
      <Textarea value={content} onChange={e=>setContent(e.target.value)} rows={12} />
      <Button onClick={save} className="mt-3">Save Rules</Button>
    </div>
  );
}
