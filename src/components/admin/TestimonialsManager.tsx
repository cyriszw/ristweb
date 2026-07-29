import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Upload, X, Quote } from 'lucide-react';
import ImageCropper from '@/components/admin/ImageCropper';

function useImageCrop() {
  const [cropState, setCropState] = useState<{ src: string; aspect: number; label: string; resolve: (blob: Blob | null) => void } | null>(null);
  const openCropper = (file: File, aspect: number, label: string): Promise<Blob | null> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => setCropState({ src: reader.result as string, aspect, label, resolve });
      reader.readAsDataURL(file);
    });
  };
  const cropperProps = cropState ? {
    open: true, imageSrc: cropState.src, aspect: cropState.aspect, aspectLabel: cropState.label,
    onComplete: (blob: Blob) => { cropState.resolve(blob); setCropState(null); },
    onCancel: () => { cropState.resolve(null); setCropState(null); },
  } : null;
  return { openCropper, cropperProps };
}

export default function TestimonialsManager() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', message: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const { openCropper, cropperProps } = useImageCrop();

  const load = useCallback(() => {
    (supabase.from('testimonials' as any).select('*').order('created_at', { ascending: false }) as any)
      .then(({ data }: any) => setItems(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleFile = async (file: File) => {
    const blob = await openCropper(file, 1, '1:1 Avatar');
    if (!blob) return;
    setUploading(true);
    const path = `testimonials/${Date.now()}-cropped.jpg`;
    const { error } = await supabase.storage.from('images').upload(path, blob, { contentType: 'image/jpeg' });
    setUploading(false);
    if (error) { toast.error('Upload failed'); return; }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    setForm(p => ({ ...p, image_url: data.publicUrl }));
  };

  const save = async () => {
    if (!form.name || !form.message) { toast.error('Name and message required'); return; }
    const payload = { name: form.name, message: form.message, image_url: form.image_url || null };
    if (editing) {
      await (supabase.from('testimonials' as any).update(payload).eq('id', editing.id) as any);
      toast.success('Updated');
    } else {
      await (supabase.from('testimonials' as any).insert([payload]) as any);
      toast.success('Added');
    }
    setForm({ name: '', message: '', image_url: '' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await (supabase.from('testimonials' as any).delete().eq('id', id) as any);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      {cropperProps && <ImageCropper {...cropperProps} />}
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Testimonials</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Person's name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Textarea placeholder="Testimonial message" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
          {form.image_url && (
            <div className="relative">
              <img src={form.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              <button onClick={() => setForm(p => ({ ...p, image_url: '' }))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={save} size="sm"><Plus className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Add'}</Button>
          {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ name: '', message: '', image_url: '' }); }}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-3">
        {items.map(t => (
          <div key={t.id} className="bg-card border rounded-lg p-4 flex items-start gap-4">
            {t.image_url ? <img src={t.image_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" /> : <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Quote className="w-5 h-5 text-primary/40" /></div>}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{t.name}</div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.message}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditing(t); setForm({ name: t.name, message: t.message, image_url: t.image_url || '' }); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(t.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
