import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Upload } from 'lucide-react';
import { useDocxImport } from '@/hooks/useDocxImport';
import DocxImportDialog from './DocxImportDialog';

export default function UniformsManager() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', price: '', quantity: '1' });
  const [visible, setVisible] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const docx = useDocxImport();

  const load = useCallback(() => {
    (supabase.from('uniforms' as any).select('*').order('created_at', { ascending: true }) as any)
      .then(({ data }: any) => setItems(data || []));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'uniforms_visible').maybeSingle()
      .then(({ data }) => { if (data) setVisible(data.value === 'true'); });
  }, []);

  const toggleVisibility = async (val: boolean) => {
    setVisible(val);
    const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'uniforms_visible').maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value: String(val), updated_at: new Date().toISOString() }).eq('key', 'uniforms_visible');
    } else {
      await supabase.from('site_settings').insert([{ key: 'uniforms_visible', value: String(val) }]);
    }
    toast.success(val ? 'Uniforms tab visible' : 'Uniforms tab hidden');
  };

  const save = async () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    const payload = { name: form.name, price: parseFloat(form.price), quantity: parseInt(form.quantity) || 1 };
    if (editing) {
      await (supabase.from('uniforms' as any).update(payload).eq('id', editing.id) as any);
      toast.success('Updated');
    } else {
      await (supabase.from('uniforms' as any).insert([payload]) as any);
      toast.success('Added');
    }
    setForm({ name: '', price: '', quantity: '1' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await (supabase.from('uniforms' as any).delete().eq('id', id) as any);
    toast.success('Deleted');
    load();
  };

  const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const handleImportConfirm = async () => {
    if (!docx.preview) return;
    const inserts = docx.preview.rows
      .filter(r => r[0]?.trim() && !isNaN(parseFloat(r[1])))
      .map(r => ({ name: r[0].trim(), price: parseFloat(r[1]), quantity: 1 }));
    if (inserts.length === 0) { toast.error('No valid items found'); return; }
    await (supabase.from('uniforms' as any).insert(inserts) as any);
    toast.success(`${inserts.length} uniform items imported`);
    setImportOpen(false);
    docx.reset();
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">Manage Uniforms</h2>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1">
          <Upload className="w-4 h-4" /> Import DOCX
        </Button>
      </div>

      <DocxImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Uniforms from DOCX"
        columns={['Item Name', 'Price']}
        parsing={docx.parsing}
        preview={docx.preview}
        error={docx.error}
        onFileSelect={f => docx.parseDocx(f, 2)}
        onConfirm={handleImportConfirm}
        onReset={docx.reset}
      />

      <div className="bg-card border rounded-lg p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">Show Uniforms Tab</div>
          <div className="text-xs text-muted-foreground">Toggle visibility on the public Fees page</div>
        </div>
        <Switch checked={visible} onCheckedChange={toggleVisibility} />
      </div>

      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Item name (e.g. Blazer)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Input type="number" placeholder="Price" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          <Input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <Button onClick={save} size="sm"><Plus className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Add'}</Button>
          {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ name: '', price: '', quantity: '1' }); }}>Cancel</Button>}
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium text-foreground">Item</th>
                <th className="text-right p-3 font-medium text-foreground">Price</th>
                <th className="text-right p-3 font-medium text-foreground">Qty</th>
                <th className="text-right p-3 font-medium text-foreground">Total</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t">
                  <td className="p-3 text-foreground">{i.name}</td>
                  <td className="p-3 text-right text-muted-foreground">${Number(i.price).toFixed(2)}</td>
                  <td className="p-3 text-right text-muted-foreground">{i.quantity}</td>
                  <td className="p-3 text-right font-medium text-foreground">${(i.price * i.quantity).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditing(i); setForm({ name: i.name, price: String(i.price), quantity: String(i.quantity) }); }} className="p-1 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(i.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={3} className="p-3 font-bold text-foreground">Overall Total</td>
                <td className="p-3 text-right font-bold text-primary">${total.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
