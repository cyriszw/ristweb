import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Instagram, Youtube, Facebook, Linkedin, Twitter, AtSign, Globe } from 'lucide-react';

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  'at-sign': AtSign,
};

function getIcon(iconName: string) {
  return PLATFORM_ICONS[iconName] || Globe;
}

export default function SocialMediaManager() {
  const [links, setLinks] = useState<any[]>([]);
  const [newPlatform, setNewPlatform] = useState('');

  const load = useCallback(() => {
    supabase.from('social_media_links').select('*').order('display_order').then(({ data }) => setLinks(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('social_media_links').update({ is_active: isActive }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: isActive } : l));
  };

  const updateUrl = async (id: string, url: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, platform_url: url } : l));
  };

  const saveUrl = async (id: string, url: string) => {
    const { error } = await supabase.from('social_media_links').update({ platform_url: url }).eq('id', id);
    if (error) toast.error('Failed to save URL');
    else toast.success('URL saved');
  };

  const addPlatform = async () => {
    if (!newPlatform.trim()) { toast.error('Platform name required'); return; }
    const maxOrder = links.reduce((max, l) => Math.max(max, l.display_order), -1);
    const { error } = await supabase.from('social_media_links').insert([{
      platform_name: newPlatform.trim(),
      icon_name: 'globe',
      display_order: maxOrder + 1,
    }]);
    if (error) { toast.error('Failed to add: ' + error.message); return; }
    toast.success('Platform added');
    setNewPlatform('');
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('social_media_links').delete().eq('id', id);
    toast.success('Platform removed');
    load();
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const updated = [...links];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    await Promise.all(updated.map((l, i) =>
      supabase.from('social_media_links').update({ display_order: i }).eq('id', l.id)
    ));
    load();
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">Social Media Links</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Toggle platforms on/off and set URLs. Active links appear on the Innovation Hub pages.
      </p>

      <div className="space-y-3 mb-6">
        {links.map((link, i) => {
          const Icon = getIcon(link.icon_name);
          return (
            <div key={link.id} className="bg-card border rounded-lg p-4 flex items-center gap-3">
              <button onClick={() => moveUp(i)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Move up">
                <GripVertical className="w-4 h-4" />
              </button>
              <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-foreground">{link.platform_name}</span>
                  <Switch checked={link.is_active} onCheckedChange={(v) => toggle(link.id, v)} />
                  <span className={`text-xs ${link.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {link.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <Input
                  placeholder={`https://${link.platform_name.toLowerCase()}.com/...`}
                  value={link.platform_url}
                  onChange={e => updateUrl(link.id, e.target.value)}
                  onBlur={e => saveUrl(link.id, e.target.value)}
                  className="text-sm"
                />
              </div>
              <button onClick={() => remove(link.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-card border rounded-lg p-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Add New Platform</label>
          <Input placeholder="Platform name (e.g. TikTok)" value={newPlatform} onChange={e => setNewPlatform(e.target.value)} />
        </div>
        <Button onClick={addPlatform} size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>
    </div>
  );
}
