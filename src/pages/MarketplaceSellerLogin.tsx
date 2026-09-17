import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Store, Loader2, Phone, Lock } from 'lucide-react';

function phoneToEmail(phone: string) {
  const clean = phone.replace(/[^0-9]/g, '');
  return `${clean}@sellers.maristdete.local`;
}
function pinToPassword(pin: string) {
  return pin.length >= 6 ? pin : pin.padEnd(6, '0');
}

export default function MarketplaceSellerLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ phone:'', pin:'' });
  const [reset, setReset] = useState({ phone:'', newPin:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login'|'reset'>('login');

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = form.phone.replace(/[^0-9]/g,'');
    if(!clean || !form.pin) { toast.error('Phone and PIN required'); return; }
    if(!/^\d{4,6}$/.test(form.pin)) { toast.error('PIN must be 4-6 digits'); return; }
    setLoading(true);
    const email = phoneToEmail(form.phone);
    const password = pinToPassword(form.pin);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error('Invalid phone or PIN'); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: seller } = await supabase.from('marketplace_sellers' as any).select('id').eq('user_id', user.id).maybeSingle();
      if (!seller) { toast.error('No seller account for this number — register first'); await supabase.auth.signOut(); setLoading(false); return; }
    }
    toast.success('Welcome back');
    nav('/marketplace/seller/dashboard');
    setLoading(false);
  };

  const doReset = async () => {
    const clean = reset.phone.replace(/[^0-9]/g,'');
    if(!clean) { toast.error('Enter phone number'); return; }
    if(!/^\d{4,6}$/.test(reset.newPin)) { toast.error('New PIN must be 4-6 digits'); return; }
    if(reset.newPin !== reset.confirm) { toast.error('PINs do not match'); return; }
    setLoading(true);
    const { error } = await supabase.rpc('reset_seller_pin' as any, { phone_input: reset.phone, new_pin: reset.newPin });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success('PIN reset — now log in with new PIN');
    setMode('login');
    setForm({ phone: reset.phone, pin: '' });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-10 text-white flex-col justify-between">
        <Link to="/marketplace" className="inline-flex items-center gap-2 font-display font-bold text-xl"><Store className="w-7 h-7" /> Marist Marketplace</Link>
        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold">Seller Login</h1>
          <p className="mt-3 text-white/80 text-sm">Enter your phone number and PIN to manage your store. One number = one store, RLS protected.</p>
        </div>
        <p className="text-xs text-white/60">Phone + PIN • No email needed</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
        {mode==='login' ? (
          <form onSubmit={login} className="w-full max-w-md bg-card border rounded-2xl p-7 shadow-sm space-y-4">
            <h2 className="font-display text-2xl font-bold">Seller sign in</h2>
            <p className="text-sm text-muted-foreground">Use the phone and PIN you registered with • No account? <Link to="/marketplace/seller/register" className="text-primary underline">Register</Link></p>
            <div><label className="text-sm font-medium flex items-center gap-1.5"><Phone className="w-4 h-4" /> Phone Number</label><Input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="077 123 4567" required /></div>
            <div><label className="text-sm font-medium flex items-center gap-1.5"><Lock className="w-4 h-4" /> PIN</label><Input type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={e=>setForm({...form, pin:e.target.value.replace(/[^0-9]/g,'')})} placeholder="4-6 digits" required /></div>
            <Button type="submit" disabled={loading} className="w-full rounded-full">{loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...</> : 'Login'}</Button>
            <Link to="/marketplace/seller/register" className="block"><Button type="button" variant="outline" className="w-full rounded-full">Create Seller Account</Button></Link>
            <button type="button" onClick={()=>setMode('reset')} className="w-full text-xs text-primary underline">Forgot PIN? Reset with phone number</button>
            <div className="pt-3 border-t text-xs text-muted-foreground text-center">
              <Link to="/marketplace" className="underline">← Back to Marketplace</Link>
            </div>
          </form>
        ) : (
          <div className="w-full max-w-md bg-card border rounded-2xl p-7 shadow-sm space-y-4">
            <h2 className="font-display text-2xl font-bold">Reset PIN</h2>
            <p className="text-sm text-muted-foreground">Enter your phone number and choose a new PIN (no email needed)</p>
            <div><label className="text-sm font-medium">Phone Number</label><Input value={reset.phone} onChange={e=>setReset({...reset, phone:e.target.value})} placeholder="077 123 4567" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm">New PIN</label><Input type="password" inputMode="numeric" maxLength={6} value={reset.newPin} onChange={e=>setReset({...reset, newPin:e.target.value.replace(/[^0-9]/g,'')})} placeholder="4-6 digits" /></div>
              <div><label className="text-sm">Confirm</label><Input type="password" inputMode="numeric" maxLength={6} value={reset.confirm} onChange={e=>setReset({...reset, confirm:e.target.value.replace(/[^0-9]/g,'')})} /></div>
            </div>
            <Button onClick={doReset} disabled={loading} className="w-full rounded-full">{loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Resetting...</> : 'Reset PIN'}</Button>
            <button onClick={()=>setMode('login')} className="w-full text-xs text-muted-foreground underline">Back to login</button>
          </div>
        )}
      </div>
    </div>
  );
}
