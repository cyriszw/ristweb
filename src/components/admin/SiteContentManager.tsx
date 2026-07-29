import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Plus, Trash2 } from 'lucide-react';

const PRESET_KEYS = [
  { key: 'homepage_intro', label: 'Homepage Intro', hint: 'Text below the hero on the homepage' },
  { key: 'homepage_motto', label: 'Homepage Motto', hint: 'School motto/tagline' },
  { key: 'about_text', label: 'About Page Text', hint: 'Main text on the About page' },
  { key: 'admissions_info', label: 'Admissions Info', hint: 'Information shown on the Admissions page' },
  { key: 'fees_intro', label: 'Fees Page Intro', hint: 'Introductory text on the Fees page' },
  { key: 'contact_info', label: 'Contact Info', hint: 'Additional contact information' },
];

export default function SiteContentManager() {
  const [entries, setEntries] = useState<Record<string, { id?: string; content: string }>>({});
  const [customKey, setCustomKey] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    (supabase.from('site_content' as any).select('*') as any)
      .then(({ data }: any) => {
        const map: Record<string, { id: string; content: string }> = {};
        (data || []).forEach((d: any) => { map[d.key] = { id: d.id, content: d.content }; });
        setEntries(map);
      });
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveEntry = async (key: string) => {
    setSaving(key);
    const entry = entries[key];
    if (entry?.id) {
      await (supabase.from('site_content' as any).update({ content: entry.content, updated_at: new Date().toISOString() }).eq('id', entry.id) as any);
    } else {
      await (supabase.from('site_content' as any).insert([{ key, content: entry?.content || '' }]) as any);
    }
    toast.success(`"${key}" saved`);
    setSaving(null);
    load();
  };

  const removeEntry = async (key: string) => {
    const entry = entries[key];
    if (entry?.id) {
      await (supabase.from('site_content' as any).delete().eq('id', entry.id) as any);
      toast.success('Removed');
      load();
    }
  };

  const addCustom = () => {
    const k = customKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!k) return;
    setEntries(p => ({ ...p, [k]: { content: '' } }));
    setCustomKey('');
  };

  const allKeys = [...new Set([...PRESET_KEYS.map(p => p.key), ...Object.keys(entries)])];

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">Site Content Editor</h2>
      <p className="text-sm text-muted-foreground mb-6">Edit text content across the website. Changes appear instantly.</p>

      <div className="space-y-4">
        {allKeys.map(key => {
          const preset = PRESET_KEYS.find(p => p.key === key);
          const entry = entries[key];
          return (
            <div key={key} className="bg-card border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">{preset?.label || key}</div>
                  {preset?.hint && <div className="text-xs text-muted-foreground">{preset.hint}</div>}
                  {!preset && <div className="text-xs text-muted-foreground font-mono">key: {key}</div>}
                </div>
                {!preset && entry?.id && (
                  <button onClick={() => removeEntry(key)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <Textarea
                value={entry?.content || ''}
                onChange={e => setEntries(p => ({ ...p, [key]: { ...p[key], content: e.target.value } }))}
                placeholder={`Enter content for "${preset?.label || key}"...`}
                rows={3}
              />
              <Button onClick={() => saveEntry(key)} size="sm" disabled={saving === key}>
                <Save className="w-4 h-4 mr-1" /> {saving === key ? 'Saving...' : 'Save'}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-card border rounded-lg p-4">
        <div className="text-sm font-medium text-foreground mb-2">Add Custom Content Key</div>
        <div className="flex gap-2">
          <Input placeholder="e.g. sports_intro" value={customKey} onChange={e => setCustomKey(e.target.value)} />
          <Button onClick={addCustom} size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </div>
    </div>
  );
}
