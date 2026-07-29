import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  Newspaper, Image, FileText, CalendarDays, Users, Trophy, Lightbulb,
  MessageSquare, Settings, LogOut, Plus, Trash2, Pencil, Upload, X, BarChart3, DollarSign, GraduationCap, BookOpen, Shirt, Quote, Type
} from 'lucide-react';
import AcademicsManager from '@/components/admin/AcademicsManager';
import AdmissionsManager from '@/components/admin/AdmissionsManager';
import SubjectsManager from '@/components/admin/SubjectsManager';
import schoolLogo from '@/assets/school-logo.png';
import VisitorStats from '@/components/admin/VisitorStats';
import ImageCropper from '@/components/admin/ImageCropper';
import UniformsManager from '@/components/admin/UniformsManager';
import StationeryManager from '@/components/admin/StationeryManager';
import TestimonialsManager from '@/components/admin/TestimonialsManager';
import SiteContentManager from '@/components/admin/SiteContentManager';
import HomepageStatsManager from '@/components/admin/HomepageStatsManager';
import SocialMediaManager from '@/components/admin/SocialMediaManager';

type Tab = 'visitors' | 'posts' | 'gallery' | 'files' | 'events' | 'clubs' | 'innovations' | 'sports' | 'messages' | 'fees' | 'uniforms' | 'stationery' | 'academics' | 'admissions' | 'subjects' | 'testimonials' | 'site_content' | 'homepage_stats' | 'social_media' | 'settings';

// Shared hook for image cropping before upload
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
    open: true,
    imageSrc: cropState.src,
    aspect: cropState.aspect,
    aspectLabel: cropState.label,
    onComplete: (blob: Blob) => { cropState.resolve(blob); setCropState(null); },
    onCancel: () => { cropState.resolve(null); setCropState(null); },
  } : null;

  return { openCropper, cropperProps };
}

async function uploadCroppedImage(blob: Blob, folder: string): Promise<string> {
  const path = `${folder}/${Date.now()}-cropped.jpg`;
  const { error } = await supabase.storage.from('images').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) { toast.error('Upload failed'); return ''; }
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading, adminChecking, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('visitors');

  if (loading || adminChecking) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'visitors', label: 'Visitors', icon: BarChart3 },
    { key: 'posts', label: 'Posts', icon: Newspaper },
    { key: 'gallery', label: 'Gallery', icon: Image },
    { key: 'files', label: 'Files', icon: FileText },
    { key: 'events', label: 'Events', icon: CalendarDays },
    { key: 'clubs', label: 'Clubs', icon: Users },
    { key: 'innovations', label: 'Innovations', icon: Lightbulb },
    { key: 'sports', label: 'Sports', icon: Trophy },
    { key: 'fees', label: 'Fees', icon: DollarSign },
    { key: 'uniforms', label: 'Uniforms', icon: Shirt },
    { key: 'stationery', label: 'Stationery', icon: BookOpen },
    { key: 'academics', label: 'Academics', icon: GraduationCap },
    { key: 'admissions', label: 'Admissions', icon: FileText },
    { key: 'subjects', label: 'Subjects', icon: BookOpen },
    { key: 'testimonials', label: 'Testimonials', icon: Quote },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'site_content', label: 'Site Content', icon: Type },
    { key: 'homepage_stats', label: 'Homepage Stats', icon: BarChart3 },
    { key: 'social_media', label: 'Social Media', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <img src={schoolLogo} alt="Logo" className="w-8 h-8" />
          <span className="font-display text-sm font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-sidebar text-sidebar-foreground z-50 px-4 py-3 flex items-center justify-between">
        <span className="font-display text-sm font-bold">Admin</span>
        <button onClick={signOut} className="text-sidebar-foreground/70"><LogOut className="w-4 h-4" /></button>
      </div>
      <div className="md:hidden fixed top-12 inset-x-0 bg-sidebar z-40 px-2 py-2 flex gap-1 overflow-x-auto border-b border-sidebar-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium ${
              tab === t.key ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/60'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto mt-24 md:mt-0">
        <div className={tab === 'visitors' ? '' : 'hidden'}><VisitorStats /></div>
        <div className={tab === 'posts' ? '' : 'hidden'}><PostsManager /></div>
        <div className={tab === 'gallery' ? '' : 'hidden'}><GalleryManager /></div>
        <div className={tab === 'files' ? '' : 'hidden'}><FilesManager /></div>
        <div className={tab === 'events' ? '' : 'hidden'}><EventsManager /></div>
        <div className={tab === 'clubs' ? '' : 'hidden'}><ClubsManager /></div>
        <div className={tab === 'innovations' ? '' : 'hidden'}><InnovationsManager /></div>
        <div className={tab === 'sports' ? '' : 'hidden'}><SportsManager /></div>
        <div className={tab === 'fees' ? '' : 'hidden'}><FeesManager /></div>
        <div className={tab === 'uniforms' ? '' : 'hidden'}><UniformsManager /></div>
        <div className={tab === 'stationery' ? '' : 'hidden'}><StationeryManager /></div>
        <div className={tab === 'academics' ? '' : 'hidden'}><AcademicsManager /></div>
        <div className={tab === 'admissions' ? '' : 'hidden'}><AdmissionsManager /></div>
        <div className={tab === 'subjects' ? '' : 'hidden'}><SubjectsManager /></div>
        <div className={tab === 'testimonials' ? '' : 'hidden'}><TestimonialsManager /></div>
        <div className={tab === 'messages' ? '' : 'hidden'}><MessagesManager /></div>
        <div className={tab === 'site_content' ? '' : 'hidden'}><SiteContentManager /></div>
        <div className={tab === 'homepage_stats' ? '' : 'hidden'}><HomepageStatsManager /></div>
        <div className={tab === 'social_media' ? '' : 'hidden'}><SocialMediaManager /></div>
        <div className={tab === 'settings' ? '' : 'hidden'}><SettingsManager /></div>
      </main>
    </div>
  );
}

// =====================
// POSTS MANAGER (with crop)
// =====================
function PostsManager() {
  const [posts, setPosts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'notices', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const { openCropper, cropperProps } = useImageCrop();

  const load = useCallback(() => {
    supabase.from('posts').select('*').order('created_at', { ascending: false }).then(({ data }) => setPosts(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleFile = async (file: File) => {
    const blob = await openCropper(file, 16/9, '16:9');
    if (!blob) return;
    setUploading(true);
    const url = await uploadCroppedImage(blob, 'posts');
    setUploading(false);
    if (url) setForm(p => ({ ...p, image_url: url }));
  };

  const save = async () => {
    if (!form.title || !form.content) { toast.error('Title and content are required'); return; }
    if (editing) {
      const { error } = await supabase.from('posts').update(form).eq('id', editing.id);
      if (error) { toast.error('Failed to update: ' + error.message); return; }
      toast.success('Post updated');
    } else {
      const { error } = await supabase.from('posts').insert([form]);
      if (error) { toast.error('Failed to create: ' + error.message); return; }
      toast.success('Post created');
    }
    setForm({ title: '', content: '', category: 'notices', image_url: '' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    toast.success('Post deleted');
    load();
  };

  return (
    <div>
      {cropperProps && <ImageCropper {...cropperProps} />}
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Posts</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <Textarea placeholder="Content" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} />
        <div className="flex gap-3 flex-wrap items-center">
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="px-3 py-2 border rounded-md text-sm bg-background">
            {['notices', 'events', 'exams', 'sports'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (f) handleFile(f);
            }} />
          </label>
          {form.image_url && <img src={form.image_url} alt="" className="w-12 h-12 object-cover rounded" />}
        </div>
        <div className="flex gap-2">
          <Button onClick={save} size="sm"><Plus className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Create'}</Button>
          {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ title: '', content: '', category: 'notices', image_url: '' }); }}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="bg-card border rounded-lg p-4 flex items-start gap-4">
            {p.image_url && <img src={p.image_url} alt="" className="w-16 h-16 object-cover rounded shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.category} • {new Date(p.created_at).toLocaleDateString()}</div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.content}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditing(p); setForm({ title: p.title, content: p.content, category: p.category, image_url: p.image_url || '' }); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// GALLERY MANAGER (with crop)
// =====================
function GalleryManager() {
  const [images, setImages] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const { openCropper, cropperProps } = useImageCrop();

  const load = useCallback(() => {
    supabase.from('gallery').select('*').order('uploaded_at', { ascending: false }).then(({ data }) => setImages(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleFile = async (file: File) => {
    const blob = await openCropper(file, 1, '1:1 Square');
    if (!blob) return;
    setUploading(true);
    const url = await uploadCroppedImage(blob, 'gallery');
    if (url) {
      await supabase.from('gallery').insert([{ image_url: url, caption, category }]);
      toast.success('Image added to gallery');
      setCaption('');
      load();
    }
    setUploading(false);
  };

  const remove = async (id: string) => {
    await supabase.from('gallery').delete().eq('id', id);
    toast.success('Image removed');
    load();
  };

  return (
    <div>
      {cropperProps && <ImageCropper {...cropperProps} />}
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Gallery</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} />
        <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-background w-full">
          {['general', 'sports', 'events', 'academics'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map(img => (
          <div key={img.id} className="relative group rounded-lg overflow-hidden">
            <img src={img.image_url} alt={img.caption || ''} className="aspect-square object-cover w-full" />
            <button onClick={() => remove(img.id)} className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-3 h-3" />
            </button>
            {img.caption && <div className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1 text-xs text-white">{img.caption}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// FILES MANAGER (unchanged)
// =====================
function FilesManager() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  const load = useCallback(() => {
    supabase.from('files').select('*').order('uploaded_at', { ascending: false }).then(({ data }) => setFiles(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const path = `documents/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('files').upload(path, file);
    if (error) { toast.error('Upload failed: ' + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('files').getPublicUrl(path);
    const displayName = fileName.trim() || file.name;
    const { error: dbErr } = await supabase.from('files').insert([{ file_name: displayName, file_url: data.publicUrl }]);
    if (dbErr) { toast.error('Failed to save file record: ' + dbErr.message); setUploading(false); return; }
    toast.success('File uploaded');
    setFileName('');
    setUploading(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('files').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('File removed');
    load();
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['ppt', 'pptx'].includes(ext || '')) return '📑';
    return '📁';
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Files</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Display name (optional — defaults to file name)" value={fileName} onChange={e => setFileName(e.target.value)} />
        <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload (PDF, Word, Excel, images, etc.)'}</span>
          <input type="file" className="hidden" disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
        </label>
      </div>
      <div className="space-y-2">
        {files.map(f => (
          <div key={f.id} className="bg-card border rounded-lg p-4 flex items-center gap-3">
            <span className="text-xl shrink-0">{getFileIcon(f.file_name)}</span>
            <div className="flex-1 min-w-0">
              <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:underline block truncate">{f.file_name}</a>
              <span className="text-xs text-muted-foreground">{new Date(f.uploaded_at).toLocaleDateString()}</span>
            </div>
            <a href={f.file_url} download className="p-1.5 rounded hover:bg-muted text-primary" title="Download"><FileText className="w-4 h-4" /></a>
            <button onClick={() => remove(f.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// EVENTS MANAGER (unchanged)
// =====================
function EventsManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', event_date: '' });

  const load = useCallback(() => {
    supabase.from('events').select('*').order('event_date', { ascending: true }).then(({ data }) => setEvents(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.event_date) { toast.error('Title and date required'); return; }
    if (editing) {
      const { error } = await supabase.from('events').update(form).eq('id', editing.id);
      if (error) { toast.error('Failed: ' + error.message); return; }
      toast.success('Event updated');
    } else {
      const { error } = await supabase.from('events').insert([form]);
      if (error) { toast.error('Failed: ' + error.message); return; }
      toast.success('Event created');
    }
    setForm({ title: '', description: '', event_date: '' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    toast.success('Event deleted');
    load();
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Events</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Event title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
        <Input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} />
        <div className="flex gap-2">
          <Button onClick={save} size="sm"><Plus className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Create'}</Button>
          {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ title: '', description: '', event_date: '' }); }}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-2">
        {events.map(e => (
          <div key={e.id} className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <div className="text-center shrink-0 w-14">
              <div className="text-xs font-bold text-secondary uppercase">{new Date(e.event_date).toLocaleDateString('en', { month: 'short' })}</div>
              <div className="text-lg font-bold text-foreground">{new Date(e.event_date).getDate()}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{e.title}</div>
              {e.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{e.description}</div>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditing(e); setForm({ title: e.title, description: e.description || '', event_date: e.event_date }); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(e.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// CLUBS MANAGER (with crop)
// =====================
function ClubsManager() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', meeting_days: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const { openCropper, cropperProps } = useImageCrop();

  const load = useCallback(() => {
    supabase.from('clubs').select('*').order('name').then(({ data }) => setClubs(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleFile = async (file: File) => {
    const blob = await openCropper(file, 16/9, '16:9');
    if (!blob) return;
    setUploading(true);
    const url = await uploadCroppedImage(blob, 'clubs');
    setUploading(false);
    if (url) setForm(p => ({ ...p, image_url: url }));
  };

  const save = async () => {
    if (!form.name) { toast.error('Club name is required'); return; }
    if (editing) {
      const { error } = await supabase.from('clubs').update(form).eq('id', editing.id);
      if (error) { toast.error('Failed to update: ' + error.message); return; }
      toast.success('Club updated');
    } else {
      const { error } = await supabase.from('clubs').insert([form]);
      if (error) { toast.error('Failed to create: ' + error.message); return; }
      toast.success('Club created');
    }
    setForm({ name: '', description: '', meeting_days: '', image_url: '' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('clubs').delete().eq('id', id);
    toast.success('Club deleted');
    load();
  };

  return (
    <div>
      {cropperProps && <ImageCropper {...cropperProps} />}
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Clubs</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Club name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
        <Input placeholder="Meeting days (e.g. Tuesdays & Thursdays)" value={form.meeting_days} onChange={e => setForm(p => ({ ...p, meeting_days: e.target.value }))} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Image'}
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (f) handleFile(f);
            }} />
          </label>
          {form.image_url && (
            <div className="relative">
              <img src={form.image_url} alt="" className="w-12 h-12 object-cover rounded" />
              <button onClick={() => setForm(p => ({ ...p, image_url: '' }))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={save} size="sm"><Plus className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Create'}</Button>
          {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ name: '', description: '', meeting_days: '', image_url: '' }); }}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-3">
        {clubs.map(c => (
          <div key={c.id} className="bg-card border rounded-lg p-4 flex items-center gap-4">
            {c.image_url ? <img src={c.image_url} alt="" className="w-14 h-14 object-cover rounded shrink-0" /> : <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center shrink-0"><Users className="w-6 h-6 text-primary/40" /></div>}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{c.name}</div>
              {c.meeting_days && <div className="text-xs text-muted-foreground">{c.meeting_days}</div>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || '', meeting_days: c.meeting_days || '', image_url: c.image_url || '' }); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// INNOVATIONS MANAGER (with crop)
// =====================
function InnovationsManager() {
  const [innovations, setInnovations] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'general', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const { openCropper, cropperProps } = useImageCrop();

  const load = useCallback(() => {
    supabase.from('innovations').select('*').order('created_at', { ascending: false }).then(({ data }) => setInnovations(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleThumbFile = async (file: File) => {
    const blob = await openCropper(file, 16/9, '16:9');
    if (!blob) return;
    setUploading(true);
    const url = await uploadCroppedImage(blob, 'innovations');
    setUploading(false);
    if (url) setForm(p => ({ ...p, image_url: url }));
  };

  const startEdit = async (item: any) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description || '', category: item.category || 'general', image_url: item.image_url || '' });
    const { data } = await supabase.from('innovation_images').select('*').eq('innovation_id', item.id).order('sort_order');
    setExistingImages(data || []);
    setGalleryFiles([]);
    await loadSocialLinks(item.id);
  };

  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  const loadSocialLinks = async (innovationId: string) => {
    const { data } = await supabase.from('innovation_social_links').select('*').eq('innovation_id', innovationId).order('display_order');
    setSocialLinks(data || []);
  };

  const addSocialLink = () => {
    setSocialLinks(prev => [...prev, { id: `new-${Date.now()}`, platform_name: '', platform_url: '', icon_name: 'globe', display_order: prev.length, _isNew: true }]);
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    setSocialLinks(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(prev => prev.filter((_, i) => i !== index));
  };

  const saveSocialLinks = async (innovationId: string) => {
    await supabase.from('innovation_social_links').delete().eq('innovation_id', innovationId);
    const toInsert = socialLinks.filter(l => l.platform_name && l.platform_url).map((l, i) => ({
      innovation_id: innovationId,
      platform_name: l.platform_name,
      platform_url: l.platform_url,
      icon_name: l.icon_name || 'globe',
      display_order: i,
    }));
    if (toInsert.length > 0) {
      await supabase.from('innovation_social_links').insert(toInsert);
    }
  };

  const save = async () => {
    if (!form.name) { toast.error('Project name is required'); return; }

    let innovationId = editing?.id;
    if (editing) {
      const { error } = await supabase.from('innovations').update(form).eq('id', editing.id);
      if (error) { toast.error('Failed to update: ' + error.message); return; }
      toast.success('Innovation updated');
    } else {
      const { data, error } = await supabase.from('innovations').insert([form]).select().single();
      if (error) { toast.error('Failed to create: ' + error.message); return; }
      innovationId = data.id;
      toast.success('Innovation created');
    }

    if (galleryFiles.length > 0 && innovationId) {
      setUploadingGallery(true);
      const currentCount = existingImages.length;
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        const path = `innovations/gallery/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('images').upload(path, file);
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data } = supabase.storage.from('images').getPublicUrl(path);
        await supabase.from('innovation_images').insert([{
          innovation_id: innovationId,
          image_url: data.publicUrl,
          sort_order: currentCount + i,
        }]);
      }
      setUploadingGallery(false);
    }

    if (innovationId) {
      await saveSocialLinks(innovationId);
    }

    setForm({ name: '', description: '', category: 'general', image_url: '' });
    setEditing(null);
    setGalleryFiles([]);
    setExistingImages([]);
    setSocialLinks([]);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('innovations').delete().eq('id', id);
    toast.success('Innovation deleted');
    load();
  };

  const removeGalleryImage = async (imgId: string) => {
    await supabase.from('innovation_images').delete().eq('id', imgId);
    setExistingImages(prev => prev.filter(i => i.id !== imgId));
    toast.success('Image removed');
  };

  const totalImages = existingImages.length + galleryFiles.length;
  const canAddMore = totalImages < 4;

  return (
    <div>
      {cropperProps && <ImageCropper {...cropperProps} />}
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Innovation Hub</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Project name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Textarea placeholder="Full description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} />
        <Input placeholder="Category (e.g. Tech, Science, Arts)" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Thumbnail Image'}
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (f) handleThumbFile(f);
            }} />
          </label>
          {form.image_url && (
            <div className="relative">
              <img src={form.image_url} alt="" className="w-12 h-12 object-cover rounded" />
              <button onClick={() => setForm(p => ({ ...p, image_url: '' }))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Gallery Images (2–4 images)</label>
          {existingImages.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {existingImages.map(img => (
                <div key={img.id} className="relative">
                  <img src={img.image_url} alt="" className="w-16 h-16 object-cover rounded" />
                  <button onClick={() => removeGalleryImage(img.id)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
          {galleryFiles.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {galleryFiles.map((f, i) => (
                <div key={i} className="relative">
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">{f.name.slice(0, 8)}…</div>
                  <button onClick={() => setGalleryFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
          {canAddMore && (
            <label className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground">
              <Plus className="w-4 h-4" /> Add gallery image ({totalImages}/4)
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (f && totalImages < 4) setGalleryFiles(prev => [...prev, f]);
              }} />
            </label>
          )}
        </div>

        {/* Social Media Links per Innovation */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Social Media Links</label>
          <div className="space-y-2">
            {socialLinks.map((link, i) => (
              <div key={link.id} className="flex gap-2 items-center">
                <Input placeholder="Platform (e.g. YouTube)" value={link.platform_name} onChange={e => updateSocialLink(i, 'platform_name', e.target.value)} className="flex-1" />
                <Input placeholder="https://..." value={link.platform_url} onChange={e => updateSocialLink(i, 'platform_url', e.target.value)} className="flex-[2]" />
                <select value={link.icon_name} onChange={e => updateSocialLink(i, 'icon_name', e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="globe">Globe</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="at-sign">Threads</option>
                </select>
                <button onClick={() => removeSocialLink(i)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={addSocialLink} className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-4 h-4" /> Add social link
          </button>
        </div>

        <div className="flex gap-2">
          <Button onClick={save} size="sm" disabled={uploadingGallery}>
            <Plus className="w-4 h-4 mr-1" />{uploadingGallery ? 'Uploading...' : editing ? 'Update' : 'Create'}
          </Button>
          {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ name: '', description: '', category: 'general', image_url: '' }); setGalleryFiles([]); setExistingImages([]); setSocialLinks([]); }}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-3">
        {innovations.map(item => (
          <div key={item.id} className="bg-card border rounded-lg p-4 flex items-center gap-4">
            {item.image_url ? <img src={item.image_url} alt="" className="w-14 h-14 object-cover rounded shrink-0" /> : <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center shrink-0"><Lightbulb className="w-6 h-6 text-primary/40" /></div>}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{item.name}</div>
              {item.category && <div className="text-xs text-muted-foreground">{item.category}</div>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(item.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// SPORTS MANAGER (with crop)
// =====================
function SportsManager() {
  const [sports, setSports] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', season: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const { openCropper, cropperProps } = useImageCrop();

  const load = useCallback(() => {
    supabase.from('sports').select('*').order('name').then(({ data }) => setSports(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleFile = async (file: File) => {
    const blob = await openCropper(file, 16/9, '16:9');
    if (!blob) return;
    setUploading(true);
    const url = await uploadCroppedImage(blob, 'sports');
    setUploading(false);
    if (url) setForm(p => ({ ...p, image_url: url }));
  };

  const save = async () => {
    if (!form.name) { toast.error('Sport name is required'); return; }
    if (editing) {
      const { error } = await supabase.from('sports').update(form).eq('id', editing.id);
      if (error) { toast.error('Failed to update: ' + error.message); return; }
      toast.success('Sport updated');
    } else {
      const { error } = await supabase.from('sports').insert([form]);
      if (error) { toast.error('Failed to create: ' + error.message); return; }
      toast.success('Sport created');
    }
    setForm({ name: '', description: '', season: '', image_url: '' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('sports').delete().eq('id', id);
    toast.success('Sport deleted');
    load();
  };

  return (
    <div>
      {cropperProps && <ImageCropper {...cropperProps} />}
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Sports</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Sport name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
        <Input placeholder="Season (e.g. Term 1)" value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Image'}
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files?.[0]; if (f) handleFile(f);
            }} />
          </label>
          {form.image_url && (
            <div className="relative">
              <img src={form.image_url} alt="" className="w-12 h-12 object-cover rounded" />
              <button onClick={() => setForm(p => ({ ...p, image_url: '' }))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={save} size="sm"><Plus className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Create'}</Button>
          {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ name: '', description: '', season: '', image_url: '' }); }}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-3">
        {sports.map(s => (
          <div key={s.id} className="bg-card border rounded-lg p-4 flex items-center gap-4">
            {s.image_url ? <img src={s.image_url} alt="" className="w-14 h-14 object-cover rounded shrink-0" /> : <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center shrink-0"><Trophy className="w-6 h-6 text-primary/40" /></div>}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{s.name}</div>
              {s.season && <div className="text-xs text-muted-foreground">Season: {s.season}</div>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditing(s); setForm({ name: s.name, description: s.description || '', season: s.season || '', image_url: s.image_url || '' }); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(s.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// FEES MANAGER
// =====================
function FeesManager() {
  const [fees, setFees] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', amount: '', file_url: '' });
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    (supabase.from('fees' as any).select('*').order('created_at', { ascending: true }) as any)
      .then(({ data }: any) => setFees(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const uploadPdf = async (file: File) => {
    setUploading(true);
    const path = `fees/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('files').upload(path, file);
    setUploading(false);
    if (error) { toast.error('Upload failed'); return ''; }
    const { data } = supabase.storage.from('files').getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    const payload = { title: form.title, description: form.description || null, amount: form.amount || null, file_url: form.file_url || null };
    if (editing) {
      const { error } = await (supabase.from('fees' as any).update(payload).eq('id', editing.id) as any);
      if (error) { toast.error('Failed: ' + error.message); return; }
      toast.success('Fee item updated');
    } else {
      const { error } = await (supabase.from('fees' as any).insert([payload]) as any);
      if (error) { toast.error('Failed: ' + error.message); return; }
      toast.success('Fee item created');
    }
    setForm({ title: '', description: '', amount: '', file_url: '' });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    await (supabase.from('fees' as any).delete().eq('id', id) as any);
    toast.success('Fee item deleted');
    load();
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Manage Fees & Costs</h2>
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <Input placeholder="Title (e.g. Tuition Fee)" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
        <Input placeholder="Amount (e.g. $500 / term)" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Attach PDF'}
            <input type="file" accept=".pdf" className="hidden" onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              const url = await uploadPdf(f); if (url) setForm(p => ({ ...p, file_url: url }));
            }} />
          </label>
          {form.file_url && <span className="text-xs text-primary">📄 PDF attached</span>}
        </div>
        <div className="flex gap-2">
          <Button onClick={save} size="sm"><Plus className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Create'}</Button>
          {editing && <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ title: '', description: '', amount: '', file_url: '' }); }}>Cancel</Button>}
        </div>
      </div>
      <div className="space-y-3">
        {fees.map((f: any) => (
          <div key={f.id} className="bg-card border rounded-lg p-4 flex items-center gap-4">
            <DollarSign className="w-6 h-6 text-primary/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{f.title}</div>
              {f.amount && <div className="text-xs text-muted-foreground">{f.amount}</div>}
              {f.file_url && <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">📄 View PDF</a>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditing(f); setForm({ title: f.title, description: f.description || '', amount: f.amount || '', file_url: f.file_url || '' }); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(f.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================
// MESSAGES MANAGER (unchanged)
// =====================
function MessagesManager() {
  const [messages, setMessages] = useState<any[]>([]);

  const load = useCallback(() => {
    supabase.from('messages').select('*').order('created_at', { ascending: false }).then(({ data }) => setMessages(data || []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    await supabase.from('messages').delete().eq('id', id);
    toast.success('Message deleted');
    load();
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Contact Messages</h2>
      {messages.length === 0 ? <p className="text-muted-foreground">No messages yet.</p> : (
        <div className="space-y-3">
          {messages.map(m => (
            <div key={m.id} className="bg-card border rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm text-foreground">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email} • {new Date(m.created_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => remove(m.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================
// SETTINGS MANAGER (with crop for banners)
// =====================
const BANNER_PAGES = [
  { key: 'about', label: 'About' },
  { key: 'academics', label: 'Academics' },
  { key: 'admissions', label: 'Admissions' },
  { key: 'news', label: 'News' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'innovation_hub', label: 'Innovation Hub' },
  { key: 'sports', label: 'Sports' },
  { key: 'contact', label: 'Contact' },
  { key: 'fees', label: 'Fees' },
];

function SettingsManager() {
  const [banner, setBanner] = useState('');
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [banners, setBanners] = useState<Record<string, string>>({});
  const [uploadingBanner, setUploadingBanner] = useState<string | null>(null);
  const { openCropper, cropperProps } = useImageCrop();

  useEffect(() => {
    supabase.from('site_settings').select('key, value').then(({ data }) => {
      if (!data) return;
      const b: Record<string, string> = {};
      data.forEach(d => {
        if (d.key === 'notification_banner') setBanner(d.value || '');
        if (d.key === 'maintenance_mode') setMaintenanceMode(d.value === 'true');
        if (d.key.startsWith('banner_')) b[d.key.replace('banner_', '')] = d.value || '';
      });
      setBanners(b);
    });
  }, []);

  const toggleMaintenance = async (val: boolean) => {
    setMaintenanceMode(val);
    const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'maintenance_mode').maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value: String(val), updated_at: new Date().toISOString() }).eq('key', 'maintenance_mode');
    } else {
      await supabase.from('site_settings').insert([{ key: 'maintenance_mode', value: String(val) }]);
    }
    toast.success(val ? '🔒 Maintenance mode enabled — site is now locked' : '🔓 Maintenance mode disabled — site is live');
  };

  const saveBanner = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'notification_banner').maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value: banner, updated_at: new Date().toISOString() }).eq('key', 'notification_banner');
    } else {
      await supabase.from('site_settings').insert([{ key: 'notification_banner', value: banner }]);
    }
    setSaving(false);
    toast.success('Notification banner updated');
  };

  const uploadBannerImage = async (pageKey: string, file: File) => {
    const blob = await openCropper(file, 21/9, '21:9 Banner');
    if (!blob) return;
    setUploadingBanner(pageKey);
    const url = await uploadCroppedImage(blob, 'banners');
    if (!url) { setUploadingBanner(null); return; }
    const settingKey = `banner_${pageKey}`;
    const { data: existing } = await supabase.from('site_settings').select('id').eq('key', settingKey).maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value: url, updated_at: new Date().toISOString() }).eq('key', settingKey);
    } else {
      await supabase.from('site_settings').insert([{ key: settingKey, value: url }]);
    }
    setBanners(p => ({ ...p, [pageKey]: url }));
    setUploadingBanner(null);
    toast.success(`${pageKey} banner updated`);
  };

  const removeBanner = async (pageKey: string) => {
    const settingKey = `banner_${pageKey}`;
    await supabase.from('site_settings').update({ value: '', updated_at: new Date().toISOString() }).eq('key', settingKey);
    setBanners(p => { const n = { ...p }; delete n[pageKey]; return n; });
    toast.success(`${pageKey} banner removed`);
  };

  return (
    <div>
      {cropperProps && <ImageCropper {...cropperProps} />}
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Site Settings</h2>

      {/* Maintenance Mode */}
      <div className={`border rounded-lg p-5 space-y-4 mb-8 ${maintenanceMode ? 'bg-destructive/5 border-destructive/30' : 'bg-card'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground flex items-center gap-2">
              {maintenanceMode && <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />}
              Maintenance Mode
            </div>
            <div className="text-xs text-muted-foreground">When enabled, the entire site shows a maintenance page. Only admins can access the dashboard via /login → /admin.</div>
          </div>
          <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
        </div>
      </div>

      <div className="bg-card border rounded-lg p-5 space-y-4 mb-8">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Notification Banner</label>
          <p className="text-xs text-muted-foreground mb-2">This message appears at the top of the website. Leave empty to hide it.</p>
          <Input value={banner} onChange={e => setBanner(e.target.value)} placeholder="e.g. School reopens on 15 January 2026" />
        </div>
        <Button onClick={saveBanner} disabled={saving} size="sm">{saving ? 'Saving...' : 'Save'}</Button>
      </div>

      <h3 className="font-display text-lg font-bold text-foreground mb-4">Page Banners</h3>
      <p className="text-xs text-muted-foreground mb-4">Upload a banner image for each page. It will replace the default colored header.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {BANNER_PAGES.map(page => (
          <div key={page.key} className="bg-card border rounded-lg p-4 space-y-3">
            <div className="font-medium text-sm text-foreground">{page.label}</div>
            {banners[page.key] ? (
              <div className="relative">
                <img src={banners[page.key]} alt="" className="w-full h-24 object-cover rounded" />
                <button onClick={() => removeBanner(page.key)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
                <Upload className="w-4 h-4" />
                {uploadingBanner === page.key ? 'Uploading...' : 'Upload banner'}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingBanner === page.key}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadBannerImage(page.key, f); }} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
