import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { X, Save, Lock, Plus, PencilRuler, ExternalLink, Trash2 } from 'lucide-react';
import { EDITABLE_GROUPS, EditableKey } from '@/lib/editableContent';

type Entry = { id?: string; content: string };

export default function QuickEditor() {
  const { user, isAdmin, signIn, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState('');
  const [extraKeys, setExtraKeys] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Ctrl+Shift+E toggles the editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const load = useCallback(() => {
    (supabase.from('site_content' as any).select('*') as any).then(({ data }: any) => {
      const map: Record<string, Entry> = {};
      (data || []).forEach((d: any) => { map[d.key] = { id: d.id, content: d.content }; });
      setEntries(map);
      const known = EDITABLE_GROUPS.flatMap(g => g.keys.map(k => k.key));
      setExtraKeys(Object.keys(map).filter(k => !known.includes(k)));
    });
  }, []);

  useEffect(() => { if (open && isAdmin) load(); }, [open, isAdmin, load]);

  const save = async (key: string) => {
    setSaving(key);
    const entry = entries[key];
    const payload = { content: entry?.content ?? '' };
    let error;
    if (entry?.id) {
      ({ error } = await (supabase.from('site_content' as any)
        .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', entry.id) as any));
    } else {
      ({ error } = await (supabase.from('site_content' as any).insert([{ key, ...payload }]) as any));
    }
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Saved — live on the site');
    load();
  };

  const remove = async (key: string) => {
    const entry = entries[key];
    if (!entry?.id) return;
    await (supabase.from('site_content' as any).delete().eq('id', entry.id) as any);
    toast.success('Removed');
    load();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError(null);
    const { error } = await signIn(email.trim(), password);
    setSigningIn(false);
    if (error) setAuthError(error.message);
    else setPassword('');
  };

  const addCustom = () => {
    const k = customKey.trim().toLowerCase().replace(/\s+/g, '_');
    if (!k) return;
    setEntries(p => ({ ...p, [k]: p[k] ?? { content: '' } }));
    setExtraKeys(p => (p.includes(k) ? p : [...p, k]));
    setCustomKey('');
  };

  if (!open) return null;

  const renderField = (k: EditableKey) => (
    <div key={k.key} className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{k.label}</div>
          {k.hint && <div className="text-xs text-muted-foreground">{k.hint}</div>}
          <div className="text-[11px] text-muted-foreground/70 font-mono truncate">{k.key}</div>
        </div>
        {entries[k.key]?.id && (
          <button onClick={() => remove(k.key)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive shrink-0" aria-label={`Clear ${k.label}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {k.multiline === false ? (
        <Input
          value={entries[k.key]?.content ?? ''}
          onChange={e => setEntries(p => ({ ...p, [k.key]: { ...p[k.key], content: e.target.value } }))}
        />
      ) : (
        <Textarea
          rows={k.multiline ? 3 : 1}
          value={entries[k.key]?.content ?? ''}
          onChange={e => setEntries(p => ({ ...p, [k.key]: { ...p[k.key], content: e.target.value } }))}
          placeholder={`Enter ${k.label.toLowerCase()}…`}
        />
      )}
      <Button size="sm" onClick={() => save(k.key)} disabled={saving === k.key}>
        <Save className="w-4 h-4 mr-1" /> {saving === k.key ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <aside className="relative h-full w-full sm:w-[420px] bg-background border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between h-14 px-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <PencilRuler className="w-4 h-4 text-primary" />
            <span className="font-display text-sm font-bold text-primary">Quick Page Editor</span>
          </div>
          <button onClick={() => setOpen(false)} className="h-10 w-10 -mr-2 inline-flex items-center justify-center rounded-md hover:bg-muted" aria-label="Close editor">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking access…</p>
          ) : !isAdmin ? (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="w-4 h-4" /> Admin sign in
              </div>
              <p className="text-xs text-muted-foreground">
                {user ? 'This account does not have admin access.' : 'Use your admin panel credentials to edit page content.'}
              </p>
              <Input type="email" placeholder="Email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
              {authError && <p className="text-xs text-destructive">{authError}</p>}
              <Button type="submit" className="w-full" disabled={signingIn}>
                {signingIn ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Edits publish instantly across the site. Press <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">Ctrl</kbd>+
                <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">Shift</kbd>+
                <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px]">E</kbd> to toggle this panel.
              </p>

              {EDITABLE_GROUPS.map(g => (
                <section key={g.group} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.group}</h3>
                  {g.keys.map(renderField)}
                </section>
              ))}

              {extraKeys.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom</h3>
                  {extraKeys.map(k => renderField({ key: k, label: k, multiline: true }))}
                </section>
              )}

              <div className="rounded-lg border bg-card p-3">
                <div className="text-sm font-medium mb-2">Add custom content key</div>
                <div className="flex gap-2">
                  <Input placeholder="e.g. sports_intro" value={customKey} onChange={e => setCustomKey(e.target.value)} />
                  <Button variant="outline" size="sm" onClick={addCustom}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                Open full admin panel <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
