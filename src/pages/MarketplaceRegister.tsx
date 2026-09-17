import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldAlert, AlertTriangle, CheckCircle2, Store, Plus, X } from 'lucide-react';

export default function MarketplaceRegister() {
  const { user } = useAuth();
  const PRESET_PRODUCTS = [
    'Unsweetened Powdered Milk',
    'Mazoe Raspberry',
    'Mazoe Blackberry',
    'Mazoe Cream Soda',
    'Potato Chips',
    'Biscuits (Charhons or Proton)',
    'Tomato Sauce',
    'Peanut Butter',
    'White Maputi',
    'Cerevita',
  ];

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: user?.email || '',
    sellerType: 'vendor' as 'parent'|'guardian'|'provider'|'vendor',
    agreement: false,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const togglePreset = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const addCustom = () => {
    const v = newItem.trim();
    if (!v) return;
    if (PRESET_PRODUCTS.includes(v)) {
      toast.error('This item is already in the approved list — please select it above');
      return;
    }
    if (customItems.includes(v)) {
      toast.error('Already added');
      return;
    }
    setCustomItems(prev => [...prev, v]);
    setNewItem('');
  };
  const removeCustom = (idx: number) => setCustomItems(prev => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    setAttempted(true);
    const hasSelection = selected.size > 0 || customItems.length > 0;
    if (!form.fullName || !form.phone || !form.email || !hasSelection || !form.agreement) {
      toast.error('Please fill all required fields, select at least one item, and agree to the rules');
      return;
    }
    setLoading(true);
    // Create pending product requests for custom items (not automatically approved)
    for (const name of customItems) {
      const { error: prodErr } = await supabase.from('marketplace_products' as any).insert([{
        name,
        category: 'Other Approved Items',
        description: `Requested by seller ${form.fullName} (${form.email}) — pending school approval`,
        is_approved: false,
        is_prohibited: false,
        enabled: false,
      }]);
      // Ignore duplicate name errors (already exists)
      if (prodErr && !prodErr.message.includes('duplicate') && !prodErr.message.includes('already exists')) {
        console.warn('product request failed', prodErr.message);
      }
    }
    const intended = [...Array.from(selected), ...customItems.map(c => `${c} (Pending Approval)`)].join(', ');
    const { error } = await supabase.from('marketplace_sellers' as any).insert([{
      user_id: user ? user.id : null,
      full_name: form.fullName,
      phone: form.phone,
      email: form.email,
      seller_type: form.sellerType,
      intended_items: intended,
      agreement: true,
      status: 'pending',
    }]);
    setLoading(false);
    if (error) {
      if (error.message.includes('duplicate')) toast.error('You have already registered as a seller');
      else toast.error(error.message);
      return;
    }
    setSubmitted(true);
    toast.success('Registration submitted — pending admin approval');
  };

  if (submitted) {
    return (
      <Layout>
        <section className="bg-primary py-10">
          <div className="container max-w-3xl">
            <p className="text-xs tracking-[0.2em] text-white/70 uppercase flex items-center gap-2"><Store className="w-4 h-4" /> Marketplace</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-white">Application Received</h1>
          </div>
        </section>
        <div className="container max-w-3xl py-12">
          <div className="bg-card border rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
            <h2 className="mt-4 font-display text-xl font-bold">Thank you — your application is pending</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Your seller registration has been submitted successfully. An administrator will review your information and verify it before approving your account. You will be notified by email/phone once approved. You cannot publish listings until approved.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <Link to="/marketplace" className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium">Back to Marketplace</Link>
              <Link to="/marketplace/rules" className="inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-sm font-medium">View Rules</Link>
            </div>
            {!user && <p className="text-xs text-muted-foreground mt-4">Tip: <Link to="/login" className="text-primary underline">Create an account / log in</Link> with the same email ({form.email}) to manage your listings after approval.</p>}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary py-10">
        <div className="container max-w-3xl">
          <p className="text-xs tracking-[0.2em] text-white/70 uppercase flex items-center gap-2"><Store className="w-4 h-4" /> Marketplace</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Register as a Seller</h1>
          <p className="mt-2 text-white/80 text-sm">Join our school-approved marketplace. All applications are reviewed by administration before you can publish listings.</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container max-w-3xl">
          {/* Suspension warning */}
          <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 flex gap-3">
            <div className="shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800 text-sm">Important — Zero Tolerance for Prohibited Items</p>
              <p className="text-sm text-red-700 mt-1 leading-relaxed">
                You may <span className="font-semibold underline">only</span> advertise products that appear on the school's <span className="font-semibold">Approved Marketplace Product List</span>. 
                Advertising <span className="font-bold">prohibited, illegal or non-approved items</span> — including alcohol, drugs, tobacco/vapes, weapons, stolen or counterfeit goods, or any food/drink banned by the school — will lead to <span className="font-bold">immediate suspension of your account and removal of your listings</span> in accordance with Marketplace Rules §5 and §14. Repeated or serious violations may result in a permanent ban.
              </p>
              <Link to="/marketplace/rules" className="inline-flex mt-2 text-xs font-medium text-red-700 underline underline-offset-4 hover:text-red-800">Read full Marketplace Rules →</Link>
            </div>
          </div>

          {/* Approved list hint */}
          <div className="mb-6 rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Only these categories are allowed</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {['Food & Snacks','Drinks','School Supplies','Clothing & Uniform Items','Other Approved Items'].map(c=>(
                <span key={c} className="px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-800 font-medium">{c}</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Examples: Sandwiches, Fruit, Baked goods, Fruit Juice, Water, Exercise Books, Pens, School Shirt/Tie etc. The exact list is controlled by the school admin. <Link to="/marketplace" className="text-primary underline">Browse approved products</Link>.</p>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-sm">Your Details</h2>
              <p className="text-xs text-muted-foreground">Tell us who you are. Fields marked * are required.</p>
            </div>

            <div><label className="text-sm font-medium">Full Name *</label><Input value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} placeholder="John Doe" className={attempted && !form.fullName ? 'border-red-300' : ''} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Phone Number *</label><Input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="+263 ..." className={attempted && !form.phone ? 'border-red-300' : ''} /></div>
              <div><label className="text-sm font-medium">Email Address *</label><Input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className={attempted && !form.email ? 'border-red-300' : ''} /></div>
            </div>
            <div><label className="text-sm font-medium">Seller Type *</label>
              <select value={form.sellerType} onChange={e=>setForm({...form, sellerType:e.target.value as any})} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="vendor">Individual Seller</option>
                <option value="provider">Approved Tuck-food Provider</option>
                <option value="parent">Community Member</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">Choose the option that best describes you.</p>
            </div>

            <div className="pt-2">
              <h3 className="font-semibold text-sm">Items You Intend to Sell *</h3>
              <div className="mt-2 rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-semibold text-foreground">School-Approved Default Items</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">These items are part of the school's current approved Marketplace list. You may select the items you intend to sell. You may also request to add additional items for consideration by the school.</p>
                <div className="mt-3 grid sm:grid-cols-2 gap-2">
                  {PRESET_PRODUCTS.map(name => {
                    const checked = selected.has(name);
                    return (
                      <label key={name} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${checked ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted border-border'}`}>
                        <input type="checkbox" checked={checked} onChange={()=>togglePreset(name)} className="w-4 h-4 accent-primary" />
                        <span className="flex-1">{name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <Input placeholder="Add another item not on the list (e.g., Fresh Eggs)" value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); addCustom();}}} />
                  <Button type="button" variant="outline" onClick={addCustom} className="shrink-0"><Plus className="w-4 h-4 mr-1" /> Add Another Item</Button>
                </div>
                {customItems.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {customItems.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm">
                        <span>{c} <span className="text-xs text-amber-700 font-medium">— Pending School Approval</span></span>
                        <button type="button" onClick={()=>removeCustom(idx)} className="p-1 rounded hover:bg-amber-100"><X className="w-4 h-4 text-amber-700" /></button>
                      </div>
                    ))}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed"><span className="font-semibold">Additional Item Requires Approval</span> — Items outside the school's default approved list must be reviewed and approved by the school before they can be advertised or sold through the Marketplace.</p>
                    </div>
                  </div>
                )}
                {(attempted && selected.size===0 && customItems.length===0) && <p className="text-xs text-red-600 mt-2">Select at least one approved item or add another item.</p>}
              </div>
            </div>

            {/* Agreement - new product approval wording */}
            <label className={`flex gap-3 p-4 rounded-xl border-2 transition-colors ${attempted && !form.agreement ? 'border-red-300 bg-red-50' : form.agreement ? 'border-green-300 bg-green-50' : 'border-amber-200 bg-amber-50/50'}`}>
              <input type="checkbox" checked={form.agreement} onChange={e=>setForm({...form, agreement:e.target.checked})} className="mt-1 w-4 h-4 accent-primary" />
              <span className="text-sm leading-relaxed">
                <span className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-600" /> I agree to the Marketplace Rules and product approval requirements</span>
                I understand that the items displayed in the School-Approved Default Items list are the school's current approved products. I may request additional items, but those items require school approval before they can be advertised. I agree to follow all Marketplace Rules and understand that <span className="font-bold text-red-700">prohibited or illegal items may result in my listing being removed and my account being suspended.</span>
              </span>
            </label>
            {!form.agreement && attempted && <p className="text-xs text-red-600 -mt-2">You must agree to the rules to register.</p>}

            <div className="flex gap-3 pt-2">
              <Button onClick={submit} disabled={loading} className="min-w-[170px]">{loading?'Submitting...':'Submit for Approval'}</Button>
              <Link to="/marketplace" className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm">Cancel</Link>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Your registration will be <span className="font-medium text-foreground">Pending Approval</span>. An administrator must approve you before you can publish listings. You will be notified.</p>
          </div>
          <p className="mt-4 text-center text-sm"><Link to="/marketplace/rules" className="text-primary underline font-medium">View full Marketplace Rules & Seller Agreement</Link></p>
        </div>
      </section>
    </Layout>
  );
}
