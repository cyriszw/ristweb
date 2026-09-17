import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldAlert, AlertTriangle, CheckCircle2, Store } from 'lucide-react';

export default function MarketplaceRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: user?.email || '',
    sellerType: 'vendor' as 'parent'|'guardian'|'provider'|'vendor',
    intendedItems: '',
    agreement: false,
  });
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const submit = async () => {
    setAttempted(true);
    if (!form.fullName || !form.phone || !form.email || !form.intendedItems || !form.agreement) {
      toast.error('Please fill all required fields and agree to the rules');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('marketplace_sellers' as any).insert([{
      user_id: user ? user.id : null,
      full_name: form.fullName,
      phone: form.phone,
      email: form.email,
      seller_type: form.sellerType,
      intended_items: form.intendedItems,
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
              <h3 className="font-semibold text-sm">What will you sell? *</h3>
              <p className="text-xs text-muted-foreground mb-1">List the specific products you intend to advertise. Must be from the approved list above.</p>
              <Textarea value={form.intendedItems} onChange={e=>setForm({...form, intendedItems:e.target.value})} placeholder="e.g., Fruit (apples, bananas), Sandwiches, Exercise Books — all from approved list" rows={3} className={attempted && !form.intendedItems ? 'border-red-300' : ''} />
              <p className="text-xs text-muted-foreground mt-1">If a product is not on the approved list, you must get school authorisation first (Rules §4).</p>
            </div>

            {/* Agreement with strong emphasis */}
            <label className={`flex gap-3 p-4 rounded-xl border-2 transition-colors ${attempted && !form.agreement ? 'border-red-300 bg-red-50' : form.agreement ? 'border-green-300 bg-green-50' : 'border-amber-200 bg-amber-50/50'}`}>
              <input type="checkbox" checked={form.agreement} onChange={e=>setForm({...form, agreement:e.target.checked})} className="mt-1 w-4 h-4 accent-primary" />
              <span className="text-sm leading-relaxed">
                <span className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-600" /> I agree to the School Marketplace Rules</span>
                I confirm my information is accurate. I agree to follow the School Marketplace Rules and <span className="font-semibold">only advertise products approved by the school</span>. I understand that <span className="font-bold text-red-700">prohibited or illegal items are not permitted</span> and that violations — including advertising items not on the school list — may result in <span className="font-bold text-red-700">removal of listings, immediate suspension of my account or permanent termination</span> of my Marketplace access (Rules §14).
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
