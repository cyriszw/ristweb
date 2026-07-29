import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, GraduationCap, Upload } from 'lucide-react';
import { useDocxImport } from '@/hooks/useDocxImport';
import DocxImportDialog from './DocxImportDialog';

interface Subject {
  id: string;
  name: string;
  level: string;
  category: string | null;
  stream: string | null;
  sort_order: number;
}

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tab, setTab] = useState<'o-level' | 'a-level'>('o-level');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newStream, setNewStream] = useState('sciences');
  const [importOpen, setImportOpen] = useState(false);
  const [importLevel, setImportLevel] = useState<'o-level' | 'a-level'>('o-level');
  const docx = useDocxImport();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('sort_order', { ascending: true });
    setSubjects((data as Subject[]) || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = subjects.filter(s => s.level === tab);

  // Group O-Level by category
  const oLevelGroups = filtered.reduce<Record<string, Subject[]>>((acc, s) => {
    const cat = s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const addSubject = async () => {
    if (!newName.trim()) { toast.error('Enter a subject name'); return; }
    const maxOrder = subjects.filter(s => s.level === tab).reduce((m, s) => Math.max(m, s.sort_order), 0);
    const insertData: any = {
      name: newName.trim(),
      level: tab,
      sort_order: maxOrder + 1,
    };
    if (tab === 'o-level') {
      insertData.category = newCategory.trim() || 'Other';
    } else {
      insertData.stream = newStream;
    }
    const { error } = await supabase.from('subjects').insert([insertData]);
    if (error) { toast.error('Failed to add subject'); return; }
    toast.success(`${newName.trim()} added`);
    setNewName('');
    setNewCategory('');
    load();
  };

  const removeSubject = async (id: string, name: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) { toast.error('Failed to remove'); return; }
    toast.success(`${name} removed`);
    load();
  };

  const existingCategories = [...new Set(subjects.filter(s => s.level === 'o-level').map(s => s.category).filter(Boolean))] as string[];

  const VALID_COMBINATIONS: Record<string, string> = {
    'art': 'arts',
    'commercial': 'commercials',
    'science': 'sciences',
  };

  const handleImportConfirm = async () => {
    if (!docx.preview) return;
    const maxOrder = subjects.filter(s => s.level === importLevel).reduce((m, s) => Math.max(m, s.sort_order), 0);

    if (importLevel === 'a-level') {
      // Validate combination values
      const invalidRow = docx.preview.rows.find(r => {
        const combo = (r[1] || '').trim().toLowerCase();
        return !VALID_COMBINATIONS[combo];
      });
      if (invalidRow) {
        toast.error('Invalid combination value. Must be Art, Commercial, or Science.');
        return;
      }
    }

    const inserts = docx.preview.rows
      .filter(r => r[0]?.trim())
      .map((r, i) => ({
        name: r[0].trim(),
        level: importLevel,
        sort_order: maxOrder + i + 1,
        ...(importLevel === 'o-level'
          ? { category: 'Imported' }
          : { stream: VALID_COMBINATIONS[(r[1] || '').trim().toLowerCase()] }),
      }));
    if (inserts.length === 0) { toast.error('No valid subjects found'); return; }
    const { error } = await supabase.from('subjects').insert(inserts);
    if (error) { toast.error('Import failed'); return; }
    toast.success(`${inserts.length} subjects imported`);
    setImportOpen(false);
    docx.reset();
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-foreground">Manage Subjects</h2>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1">
          <Upload className="w-4 h-4" /> Import DOCX
        </Button>
      </div>

      <DocxImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import Subjects from DOCX"
        columns={importLevel === 'a-level' ? ['Subject Name', 'Combination'] : ['Subject Name']}
        parsing={docx.parsing}
        preview={docx.preview}
        error={docx.error}
        onFileSelect={f => docx.parseDocx(f, importLevel === 'a-level' ? 2 : 1)}
        onConfirm={handleImportConfirm}
        onReset={docx.reset}
      >
        <div className="mb-2 space-y-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Import as</label>
            <select
              value={importLevel}
              onChange={e => { setImportLevel(e.target.value as any); docx.reset(); }}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="o-level">O-Level</option>
              <option value="a-level">A-Level</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            {importLevel === 'a-level'
              ? 'A-Level DOCX must contain 2 columns: Subject Name and Combination (Art, Commercial, or Science)'
              : 'O-Level DOCX must contain 1 column: Subject Name'}
          </p>
        </div>
      </DocxImportDialog>

      {/* Level tabs */}
      <div className="flex gap-2 mb-6">
        <Button variant={tab === 'o-level' ? 'default' : 'outline'} size="sm" onClick={() => setTab('o-level')}>
          O-Level Subjects
        </Button>
        <Button variant={tab === 'a-level' ? 'default' : 'outline'} size="sm" onClick={() => setTab('a-level')}>
          A-Level Subjects
        </Button>
      </div>

      {/* Add subject form */}
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Add New {tab === 'o-level' ? 'O-Level' : 'A-Level'} Subject</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-xs font-medium text-foreground">Subject Name</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Geography" />
          </div>
          {tab === 'o-level' ? (
            <div className="w-48 space-y-1.5">
              <label className="text-xs font-medium text-foreground">Category</label>
              <div className="relative">
                <Input
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="e.g. Sciences"
                  list="category-options"
                />
                <datalist id="category-options">
                  {existingCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
          ) : (
            <div className="w-40 space-y-1.5">
              <label className="text-xs font-medium text-foreground">Stream</label>
              <select
                value={newStream}
                onChange={e => setNewStream(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="sciences">Sciences</option>
                <option value="commercials">Commercials</option>
                <option value="arts">Arts</option>
              </select>
            </div>
          )}
          <Button onClick={addSubject} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
      </div>

      {/* Subject list */}
      {tab === 'o-level' ? (
        <div className="space-y-4">
          {Object.entries(oLevelGroups).map(([category, subs]) => (
            <div key={category} className="bg-card border rounded-lg p-4">
              <h4 className="text-sm font-semibold text-primary mb-3">{category}</h4>
              <div className="space-y-1">
                {subs.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{s.name}</span>
                    </div>
                    <button
                      onClick={() => removeSubject(s.id, s.name)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-lg p-4">
          <div className="space-y-1">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{s.name}</span>
                  {s.stream && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.stream === 'sciences' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      s.stream === 'commercials' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}>
                      {s.stream}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeSubject(s.id, s.name)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {filtered.length} {tab === 'o-level' ? 'O-Level' : 'A-Level'} subjects configured
      </p>
    </div>
  );
}
