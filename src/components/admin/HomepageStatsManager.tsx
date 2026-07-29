import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, GripVertical, X } from 'lucide-react';

interface HomepageStat {
  id: string;
  title: string;
  value: string;
  icon: string | null;
  is_visible: boolean;
  order_index: number;
  created_at: string;
}

export default function HomepageStatsManager() {
  const [stats, setStats] = useState<HomepageStat[]>([]);
  const [editing, setEditing] = useState<HomepageStat | null>(null);
  const [form, setForm] = useState({ title: '', value: '', icon: '' });

  const load = useCallback(() => {
    (supabase.from('homepage_stats' as any).select('*').order('order_index', { ascending: true }) as any)
      .then(({ data }: any) => setStats(data || []));
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel('admin-homepage-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_stats' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const save = async () => {
    if (!form.title || !form.value) { toast.error('Title and value are required'); return; }
    const payload = { title: form.title, value: form.value, icon: form.icon || null };
    if (editing) {
      const { error } = await (supabase.from('homepage_stats' as any).update(payload).eq('id', editing.id) as any);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Stat updated');
    } else {
      const maxOrder = stats.length > 0 ? Math.max(...stats.map(s => s.order_index)) + 1 : 0;
      const { error } = await (supabase.from('homepage_stats' as any).insert([{ ...payload, order_index: maxOrder }]) as any);
      if (error) { toast.error('Failed to create'); return; }
      toast.success('Stat created');
    }
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    await (supabase.from('homepage_stats' as any).delete().eq('id', id) as any);
    toast.success('Stat deleted');
    load();
  };

  const toggleVisibility = async (stat: HomepageStat) => {
    await (supabase.from('homepage_stats' as any).update({ is_visible: !stat.is_visible }).eq('id', stat.id) as any);
    load();
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const current = stats[index];
    const prev = stats[index - 1];
    await Promise.all([
      (supabase.from('homepage_stats' as any).update({ order_index: prev.order_index }).eq('id', current.id) as any),
      (supabase.from('homepage_stats' as any).update({ order_index: current.order_index }).eq('id', prev.id) as any),
    ]);
    load();
  };

  const moveDown = async (index: number) => {
    if (index === stats.length - 1) return;
    const current = stats[index];
    const next = stats[index + 1];
    await Promise.all([
      (supabase.from('homepage_stats' as any).update({ order_index: next.order_index }).eq('id', current.id) as any),
      (supabase.from('homepage_stats' as any).update({ order_index: current.order_index }).eq('id', next.id) as any),
    ]);
    load();
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ title: '', value: '', icon: '' });
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Homepage Stats</h2>

      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input placeholder="Title (e.g. Students)" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Input placeholder="Value (e.g. 850+)" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
          <Input placeholder="Icon name (optional, e.g. Users)" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} />
        </div>
        <p className="text-xs text-muted-foreground">Icon names: Users, GraduationCap, Trophy, Calendar, Award, BookOpen, Star, Heart</p>
        <div className="flex gap-2">
          <Button onClick={save} size="sm"><Plus className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Add Stat'}</Button>
          {editing && <Button variant="outline" size="sm" onClick={resetForm}><X className="w-4 h-4 mr-1" />Cancel</Button>}
        </div>
      </div>

      <div className="space-y-2">
        {stats.map((stat, i) => (
          <div key={stat.id} className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▲</button>
              <button onClick={() => moveDown(i)} disabled={i === stats.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▼</button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{stat.title}</div>
              <div className="text-xs text-muted-foreground">{stat.value} {stat.icon && `• icon: ${stat.icon}`}</div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch checked={stat.is_visible} onCheckedChange={() => toggleVisibility(stat)} />
                {stat.is_visible ? 'Visible' : 'Hidden'}
              </label>
              <button onClick={() => { setEditing(stat); setForm({ title: stat.title, value: stat.value, icon: stat.icon || '' }); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(stat.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {stats.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No stats yet. Add your first stat above.</p>}
      </div>
    </div>
  );
}
