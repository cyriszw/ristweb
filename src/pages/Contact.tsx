import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('messages').insert([{
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    }]);
    setSending(false);
    if (error) { toast.error('Failed to send message. Please try again.'); return; }
    toast.success('Message sent successfully! We will get back to you soon.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <Layout>
      <PageHeader title="Contact Us" subtitle="We'd love to hear from you" bannerKey="contact" />
      <section className="py-16">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-5 gap-12">
            <S className="md:col-span-2">
              <h2 className="font-display text-xl font-bold text-foreground mb-6">Get in Touch</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-sm text-foreground">Address</div>
                    <div className="text-sm text-muted-foreground">Dete, Hwange District, Matabeleland North, Zimbabwe</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-sm text-foreground">Phone</div>
                    <div className="text-sm text-muted-foreground">+263 XX XXX XXXX</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-sm text-foreground">Email</div>
                    <div className="text-sm text-muted-foreground">info@maristdete.ac.zw</div>
                  </div>
                </div>
              </div>
            </S>
            <S className="md:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-4 bg-card border rounded-lg p-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} maxLength={100} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} maxLength={255} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                  <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} maxLength={1000} rows={5} required />
                </div>
                <Button type="submit" disabled={sending} className="w-full active:scale-[0.97]">
                  {sending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                </Button>
              </form>
            </S>
          </div>
        </div>
      </section>
    </Layout>
  );
}
