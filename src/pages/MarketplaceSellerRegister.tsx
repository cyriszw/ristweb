import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Store, ShieldCheck, Loader2, Phone, Lock } from 'lucide-react';

function phoneToEmail(phone: string) {
  const clean = phone.replace(/[^0-9]/g, '');
  return `${clean}@sellers.maristdete.local`;
}
function pinToPassword(pin: string) {
  return pin.length >= 6 ? pin : pin.padEnd(6, '0');
}

export default function MarketplaceSellerRegister() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName:'', phone:'', pin:'', confirmPin:'', storeName:'', agreement:false });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = form.phone.replace(/[^0-9]/g,'');
    if (!form.fullName || !cleanPhone || !form.pin || !form.confirmPin || !form.storeName) { toast.error('All fields required'); return; }
    if (cleanPhone.length < 9) { toast.error('Enter valid phone number'); return; }
    if (!/^\d{4,6}$/.test(form.pin)) { toast.error('PIN must be 4-6 digits'); return; }
    if (form.pin !== form.confirmPin) { toast.error('PINs do not match'); return; }
    if (!form.agreement) { toast.error('Agree to seller terms'); return; }
    setLoading(true);
    const email = phoneToEmail(form.phone);
    const password = pinToPassword(form.pin);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: form.fullName, phone: form.phone } } });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const userId = data.user?.id;
    if (!userId) { toast.error('Check your phone — account pending confirmation'); setLoading(false); return; }
    // create seller with phone and derived email
    const { data: seller, error: sErr } = await supabase.from('marketplace_sellers' as any).insert([{
      user_id: userId, full_name: form.fullName, email, phone: form.phone,
      seller_type: 'vendor', intended_items: 'Seller Dashboard Registration', agreement: true, status: 'active'
    }]).select().single();
    if (sErr) {
      // if seller exists due to phone duplicate, try to clean up auth user
      if (sErr.message.includes('duplicate')) toast.error('Phone number already registered — try logging in');
      else toast.error(sErr.message);
      setLoading(false); return;
    }
    const slug = form.storeName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + userId.slice(0,4);
    const { error: stErr } = await supabase.from('marketplace_stores' as any).insert([{
      seller_id: (seller as any).id, store_name: form.storeName, slug, description: `Welcome to ${form.storeName}`, contact_email: email, contact_phone: form.phone, status: 'active'
    }]);
    if (stErr) { toast.error(stErr.message); setLoading(false); return; }
    toast.success('Seller account created! Logging you in...');
    await supabase.auth.signInWithPassword({ email, password });
    nav('/marketplace/seller/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 p-10 flex flex-col justify-between w-full text-white">
          <div><Link to="/marketplace" className="inline-flex items-center gap-2 font-display font-bold text-xl"><Store className="w-7 h-7" /> Marist Marketplace</Link></div>
          <div className="max-w-md">
            <h1 className="font-display text-4xl font-bold leading-tight">Start selling with your phone</h1>
            <p className="mt-4 text-white/80">Register with your phone number and PIN — no email needed. One number = one store.</p>
            <div className="mt-8 space-y-3 text-sm">
              <div className="flex gap-3"><ShieldCheck className="w-5 h-5 shrink-0 text-white/90" /> Only approved products — moderated by school.</div>
              <div className="flex gap-3"><Phone className="w-5 h-5 shrink-0 text-white/90" /> Login with <span className="font-semibold">Number + PIN</span> — RLS isolated per seller.</div>
            </div>
          </div>
          <p className="text-xs text-white/60">© Marist Brothers High School Dete</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
        <form onSubmit={submit} className="w-full max-w-md bg-card border rounded-2xl p-7 shadow-sm space-y-4">
          <div className="text-center lg:text-left">
            <h2 className="font-display text-2xl font-bold">Create seller account</h2>
            <p className="text-sm text-muted-foreground">Use your phone number and PIN to log in • Already a seller? <Link to="/marketplace/seller/login" className="text-primary underline">Log in</Link></p>
          </div>
          <div><label className="text-sm font-medium">Full Name *</label><Input value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} placeholder="John Doe" required /></div>
          <div><label className="text-sm font-medium">Store Name *</label><Input value={form.storeName} onChange={e=>setForm({...form, storeName:e.target.value})} placeholder="John's Tuck Shop" required /></div>
          <div><label className="text-sm font-medium flex items-center gap-1.5"><Phone className="w-4 h-4" /> Phone Number *</label><Input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="077 123 4567 or +263..." required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium flex items-center gap-1.5"><Lock className="w-4 h-4" /> PIN *</label><Input type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={e=>setForm({...form, pin:e.target.value.replace(/[^0-9]/g,'')})} placeholder="4-6 digits" required /></div>
            <div><label className="text-sm font-medium">Confirm PIN *</label><Input type="password" inputMode="numeric" maxLength={6} value={form.confirmPin} onChange={e=>setForm({...form, confirmPin:e.target.value.replace(/[^0-9]/g,'')})} placeholder="Repeat PIN" required /></div>
          </div>
          <p className="text-xs text-muted-foreground">PIN is your password. Use 4-6 digits. You will log in with phone + PIN.</p>
          <label className="flex gap-2 p-3 rounded-lg border bg-amber-50/50 text-xs leading-relaxed">
            <input type="checkbox" checked={form.agreement} onChange={e=>setForm({...form, agreement:e.target.checked})} className="mt-0.5" />
            <span>I agree to Marketplace Rules — only approved products. 1 phone = 1 store.</span>
          </label>
          <Button type="submit" disabled={loading} className="w-full rounded-full">{loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</> : 'Create Seller Account'}</Button>
          <Link to="/marketplace/seller/login" className="block"><Button type="button" variant="outline" className="w-full rounded-full">Already have an account? Login</Button></Link>
          <p className="text-xs text-center text-muted-foreground">After registration → <span className="font-medium">/marketplace/seller/dashboard</span></p>
        </form>
      </div>
    </div>
  );
}
