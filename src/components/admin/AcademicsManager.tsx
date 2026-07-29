import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const FORM_CATEGORIES = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];

interface ResultRow {
  id?: string;
  category: string;
  year: number;
  pass_rate: number;
  fail_rate: number;
}

export default function AcademicsManager() {
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const [enablePieCharts, setEnablePieCharts] = useState(false);
  const [enableComparison, setEnableComparison] = useState(false);
  const [formData, setFormData] = useState<Record<string, { pass: string; fail: string }>>({});
  const [oLevel, setOLevel] = useState({ currentPass: '', prevPass: '' });
  const [aLevel, setALevel] = useState({ currentPass: '', prevPass: '' });
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    const { data: settings } = await supabase.from('site_settings').select('key, value');
    if (settings) {
      settings.forEach(s => {
        if (s.key === 'academics_pie_charts') setEnablePieCharts(s.value === 'true');
        if (s.key === 'academics_comparison') setEnableComparison(s.value === 'true');
      });
    }
  }, []);

  const loadResults = useCallback(async () => {
    const { data } = await supabase.from('academic_results').select('*');
    if (!data) return;

    const fd: Record<string, { pass: string; fail: string }> = {};
    FORM_CATEGORIES.forEach(cat => { fd[cat] = { pass: '', fail: '' }; });

    const ol = { currentPass: '', prevPass: '' };
    const al = { currentPass: '', prevPass: '' };

    data.forEach((r: ResultRow) => {
      if (FORM_CATEGORIES.includes(r.category)) {
        fd[r.category] = { pass: String(r.pass_rate), fail: String(r.fail_rate) };
      }
      if (r.category === 'O-Level' && r.year === currentYear) ol.currentPass = String(r.pass_rate);
      if (r.category === 'O-Level' && r.year === prevYear) ol.prevPass = String(r.pass_rate);
      if (r.category === 'A-Level' && r.year === currentYear) al.currentPass = String(r.pass_rate);
      if (r.category === 'A-Level' && r.year === prevYear) al.prevPass = String(r.pass_rate);
    });

    setFormData(fd);
    setOLevel(ol);
    setALevel(al);
  }, [currentYear, prevYear]);

  useEffect(() => { loadSettings(); loadResults(); }, [loadSettings, loadResults]);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
    } else {
      await supabase.from('site_settings').insert([{ key, value }]);
    }
  };

  const togglePieCharts = async (val: boolean) => {
    setEnablePieCharts(val);
    await saveSetting('academics_pie_charts', String(val));
    toast.success(val ? 'Pie charts enabled' : 'Pie charts disabled');
  };

  const toggleComparison = async (val: boolean) => {
    setEnableComparison(val);
    await saveSetting('academics_comparison', String(val));
    toast.success(val ? 'Comparison charts enabled' : 'Comparison charts disabled');
  };

  const upsertResult = async (category: string, year: number, passRate: number) => {
    const failRate = Math.max(0, 100 - passRate);
    const { data: existing } = await supabase
      .from('academic_results')
      .select('id')
      .eq('category', category)
      .eq('year', year)
      .maybeSingle();
    if (existing) {
      await supabase.from('academic_results').update({ pass_rate: passRate, fail_rate: failRate, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('academic_results').insert([{ category, year, pass_rate: passRate, fail_rate: failRate }]);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Save form data
      for (const cat of FORM_CATEGORIES) {
        const pass = parseFloat(formData[cat]?.pass || '0') || 0;
        await upsertResult(cat, currentYear, Math.min(100, Math.max(0, pass)));
      }
      // O-Level
      if (oLevel.currentPass) await upsertResult('O-Level', currentYear, Math.min(100, Math.max(0, parseFloat(oLevel.currentPass))));
      if (oLevel.prevPass) await upsertResult('O-Level', prevYear, Math.min(100, Math.max(0, parseFloat(oLevel.prevPass))));
      // A-Level
      if (aLevel.currentPass) await upsertResult('A-Level', currentYear, Math.min(100, Math.max(0, parseFloat(aLevel.currentPass))));
      if (aLevel.prevPass) await upsertResult('A-Level', prevYear, Math.min(100, Math.max(0, parseFloat(aLevel.prevPass))));

      toast.success('Academic results saved');
      loadResults();
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const updateFormField = (cat: string, field: 'pass' | 'fail', val: string) => {
    setFormData(prev => {
      const passVal = field === 'pass' ? val : prev[cat]?.pass || '';
      const failVal = field === 'pass' ? String(Math.max(0, 100 - (parseFloat(val) || 0))) : val;
      return { ...prev, [cat]: { pass: passVal, fail: failVal } };
    });
  };

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Academics & Pass Rates</h2>

      {/* Toggle Controls */}
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-4">
        <h3 className="font-semibold text-sm text-foreground">Display Controls</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Enable Pass Rate Pie Charts</div>
            <div className="text-xs text-muted-foreground">Show Form 1–6 pie charts on Academics page</div>
          </div>
          <Switch checked={enablePieCharts} onCheckedChange={togglePieCharts} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Enable O-Level & A-Level Comparison</div>
            <div className="text-xs text-muted-foreground">Show year-over-year comparison charts</div>
          </div>
          <Switch checked={enableComparison} onCheckedChange={toggleComparison} />
        </div>
      </div>

      {/* Form 1-6 Pass Rates */}
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-4">
        <h3 className="font-semibold text-sm text-foreground">Form 1–6 Pass Rates ({currentYear})</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FORM_CATEGORIES.map(cat => (
            <div key={cat} className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{cat}</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number" min="0" max="100" step="0.1"
                    placeholder="Pass %"
                    value={formData[cat]?.pass || ''}
                    onChange={e => updateFormField(cat, 'pass', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number" min="0" max="100" step="0.1"
                    placeholder="Fail %"
                    value={formData[cat]?.fail || ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* O-Level */}
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-4">
        <h3 className="font-semibold text-sm text-foreground">O-Level Pass Rates (5+ subjects)</h3>
        <p className="text-xs text-muted-foreground">Pass = students with 5 or more subjects passed. Fail = students with fewer than 5 subjects.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Current Year ({currentYear}) Pass %</label>
            <Input type="number" min="0" max="100" step="0.1" placeholder="e.g. 78.5"
              value={oLevel.currentPass} onChange={e => setOLevel(p => ({ ...p, currentPass: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Previous Year ({prevYear}) Pass %</label>
            <Input type="number" min="0" max="100" step="0.1" placeholder="e.g. 72.0"
              value={oLevel.prevPass} onChange={e => setOLevel(p => ({ ...p, prevPass: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* A-Level */}
      <div className="bg-card border rounded-lg p-5 mb-6 space-y-4">
        <h3 className="font-semibold text-sm text-foreground">A-Level Pass Rates (≥2 subjects)</h3>
        <p className="text-xs text-muted-foreground">Pass = students with at least 2 subjects passed. Fail = students with fewer than 2 subjects.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Current Year ({currentYear}) Pass %</label>
            <Input type="number" min="0" max="100" step="0.1" placeholder="e.g. 85.0"
              value={aLevel.currentPass} onChange={e => setALevel(p => ({ ...p, currentPass: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Previous Year ({prevYear}) Pass %</label>
            <Input type="number" min="0" max="100" step="0.1" placeholder="e.g. 88.0"
              value={aLevel.prevPass} onChange={e => setALevel(p => ({ ...p, prevPass: e.target.value }))} />
          </div>
        </div>
      </div>

      <Button onClick={saveAll} disabled={saving} className="gap-2">
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Results'}
      </Button>
    </div>
  );
}
