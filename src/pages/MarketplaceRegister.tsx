import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MarketplaceRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    providerName: '',
    studentName: '',
    studentId: '',
    phone: '',
    email: user?.email || '',
    sellerType: 'parent' as 'parent'|'guardian'|'provider'|'vendor',
    intendedItems: '',
    agreement: false,
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) { toast.error('Please log in to register as a seller'); navigate('/login'); return; }
    if (!form.fullName || !form.phone || !form.email || !form.intendedItems || !form.agreement) {
      toast.error('Please fill all required fields and agree to the rules');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('marketplace_sellers' as any).insert([{
      user_id: user.id,
      full_name: form.fullName,
      provider_name: form.providerName || null,
      student_name: form.studentName || null,
      student_id_reg: form.studentId || null,
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
    toast.success('Registration submitted — pending admin approval');
    navigate('/marketplace/dashboard');
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Register as a Seller</h1>
          <p className="text-muted-foreground mt-2">You need to log in first.</p>
          <Link to="/login" className="inline-flex mt-6 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium">Go to Login</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-primary py-10">
        <div className="container max-w-3xl">
          <p className="text-xs tracking-[0.2em] text-white/70 uppercase">Marketplace</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Register as a Seller</h1>
          <p className="mt-2 text-white/80 text-sm">Parents/guardians and approved tuck-food providers may register to advertise permitted items.</p>
        </div>
      </section>
      <section className="py-8">
        <div className="container max-w-3xl">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Full Name *</label><Input value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} placeholder="John Doe" /></div>
              <div><label className="text-sm font-medium">Seller Type *</label>
                <select value={form.sellerType} onChange={e=>setForm({...form, sellerType:e.target.value as any})} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="provider">Approved tuck-food provider</option>
                  <option value="vendor">Other approved vendor</option>
                </select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Parent/Guardian or Provider Name</label><Input value={form.providerName} onChange={e=>setForm({...form, providerName:e.target.value})} placeholder="If different from above" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Student Name (if applicable)</label><Input value={form.studentName} onChange={e=>setForm({...form, studentName:e.target.value})} /></div>
              <div><label className="text-sm font-medium">Student ID / Registration Number</label><Input value={form.studentId} onChange={e=>setForm({...form, studentId:e.target.value})} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Phone Number *</label><Input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="+263 ..." /></div>
              <div><label className="text-sm font-medium">Email Address *</label><Input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
            </div>
            <div><label className="text-sm font-medium">Items they intend to sell *</label><Textarea value={form.intendedItems} onChange={e=>setForm({...form, intendedItems:e.target.value})} placeholder="e.g., Fruit, sandwiches, exercise books (must be from approved list)" rows={3} /></div>
            <label className="flex gap-3 p-4 border rounded-lg bg-muted/30">
              <input type="checkbox" checked={form.agreement} onChange={e=>setForm({...form, agreement:e.target.checked})} className="mt-1" />
              <span className="text-sm leading-relaxed">I agree to follow the school's Marketplace Rules and only advertise items permitted by the school. I understand that advertising prohibited or illegal items may result in immediate suspension of my account and removal of my listings.</span>
            </label>
            <div className="flex gap-3">
              <Button onClick={submit} disabled={loading}>{loading?'Submitting...':'Submit for Approval'}</Button>
              <Link to="/marketplace" className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm">Cancel</Link>
            </div>
            <p className="text-xs text-muted-foreground">Your registration will be <span className="font-medium text-foreground">Pending Approval</span>. An administrator must approve you before you can publish listings.</p>
          </div>
          <p className="mt-4 text-center text-sm"><Link to="/marketplace/rules" className="text-primary underline">View Marketplace Rules</Link></p>
        </div>
      </section>
    </Layout>
  );
}
