import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ResultRow {
  category: string;
  year: number;
  pass_rate: number;
  fail_rate: number;
}

const SCHOOL_COLORS = {
  pass: 'hsl(var(--primary))',
  fail: 'hsl(var(--destructive))',
  passSoft: 'hsl(var(--secondary))',
};

const FORM_CATEGORIES = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];

function SmallPie({ title, pass, fail }: { title: string; pass: number; fail: number }) {
  const data = [
    { name: 'Pass', value: pass },
    { name: 'Fail', value: fail },
  ];
  const COLORS = [SCHOOL_COLORS.pass, SCHOOL_COLORS.fail];

  return (
    <div className="bg-card border rounded-lg p-4 text-center">
      <h4 className="font-display text-sm font-semibold text-foreground mb-2">{title}</h4>
      <div className="w-full h-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value" animationDuration={800}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[0] }} /> Pass {pass.toFixed(1)}%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[1] }} /> Fail {fail.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function ExamPie({ title, pass, fail, passLabel, failLabel }: { title: string; pass: number; fail: number; passLabel: string; failLabel: string }) {
  const data = [
    { name: passLabel, value: pass },
    { name: failLabel, value: fail },
  ];
  const COLORS = [SCHOOL_COLORS.pass, SCHOOL_COLORS.fail];

  return (
    <div className="bg-card border rounded-lg p-5">
      <h4 className="font-display text-base font-semibold text-foreground mb-3 text-center">{title}</h4>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" animationDuration={800} label={({ name, value }) => `${value.toFixed(1)}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[0] }} /> {passLabel}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[1] }} /> {failLabel}</span>
      </div>
    </div>
  );
}

function ComparisonChart({ title, currentYear, prevYear, currentPass, prevPass }: {
  title: string; currentYear: number; prevYear: number; currentPass: number; prevPass: number;
}) {
  const data = [
    { year: String(prevYear), pass: prevPass },
    { year: String(currentYear), pass: currentPass },
  ];
  const diff = currentPass - prevPass;

  return (
    <div className="bg-card border rounded-lg p-5">
      <h4 className="font-display text-base font-semibold text-foreground mb-1 text-center">{title}</h4>
      <div className="flex items-center justify-center gap-1 mb-3">
        {diff > 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : diff < 0 ? <TrendingDown className="w-4 h-4 text-red-500" /> : null}
        <span className={`text-xs font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}% from {prevYear}
        </span>
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="pass" name="Pass Rate %" fill={SCHOOL_COLORS.pass} radius={[4, 4, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InsightBadge({ text, positive }: { text: string; positive: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm ${
      positive ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300'
               : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300'
    }`}>
      {positive ? <TrendingUp className="w-4 h-4 shrink-0" /> : <TrendingDown className="w-4 h-4 shrink-0" />}
      {text}
    </div>
  );
}

export default function AcademicsCharts() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [pieEnabled, setPieEnabled] = useState(false);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  useEffect(() => {
    Promise.all([
      supabase.from('site_settings').select('key, value').in('key', ['academics_pie_charts', 'academics_comparison']),
      supabase.from('academic_results').select('*'),
    ]).then(([settingsRes, resultsRes]) => {
      if (settingsRes.data) {
        settingsRes.data.forEach(s => {
          if (s.key === 'academics_pie_charts') setPieEnabled(s.value === 'true');
          if (s.key === 'academics_comparison') setComparisonEnabled(s.value === 'true');
        });
      }
      setResults(resultsRes.data as ResultRow[] || []);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  const formResults = FORM_CATEGORIES.map(cat => {
    const r = results.find(x => x.category === cat && x.year === currentYear);
    return r ? { category: cat, pass: r.pass_rate, fail: r.fail_rate } : null;
  }).filter(Boolean) as { category: string; pass: number; fail: number }[];

  const oLevelCurrent = results.find(r => r.category === 'O-Level' && r.year === currentYear);
  const oLevelPrev = results.find(r => r.category === 'O-Level' && r.year === prevYear);
  const aLevelCurrent = results.find(r => r.category === 'A-Level' && r.year === currentYear);
  const aLevelPrev = results.find(r => r.category === 'A-Level' && r.year === prevYear);

  const hasFormData = formResults.length > 0;
  const hasOLevel = !!oLevelCurrent;
  const hasALevel = !!aLevelCurrent;
  const hasComparison = (!!oLevelCurrent && !!oLevelPrev) || (!!aLevelCurrent && !!aLevelPrev);

  // Generate insights
  const insights: { text: string; positive: boolean }[] = [];
  if (oLevelCurrent && oLevelPrev) {
    const diff = oLevelCurrent.pass_rate - oLevelPrev.pass_rate;
    if (diff !== 0) insights.push({
      text: `O-Level pass rate ${diff > 0 ? 'increased' : 'declined'} by ${Math.abs(diff).toFixed(1)}% from ${prevYear}`,
      positive: diff > 0,
    });
  }
  if (aLevelCurrent && aLevelPrev) {
    const diff = aLevelCurrent.pass_rate - aLevelPrev.pass_rate;
    if (diff !== 0) insights.push({
      text: `A-Level pass rate ${diff > 0 ? 'increased' : 'declined'} by ${Math.abs(diff).toFixed(1)}% from ${prevYear}`,
      positive: diff > 0,
    });
  }

  if (!pieEnabled && !comparisonEnabled) return null;

  return (
    <div className="space-y-12">
      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((ins, i) => <InsightBadge key={i} text={ins.text} positive={ins.positive} />)}
        </div>
      )}

      {/* Form 1-6 Pie Charts */}
      {pieEnabled && (
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Pass Rates by Form ({currentYear})</h2>
          {hasFormData ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formResults.map(r => (
                <SmallPie key={r.category} title={r.category} pass={r.pass} fail={r.fail} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data available</p>
          )}
        </div>
      )}

      {/* O-Level & A-Level Pie Charts */}
      {pieEnabled && (hasOLevel || hasALevel) && (
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">National Exam Results ({currentYear})</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {hasOLevel && (
              <ExamPie
                title="O-Level Pass Rate"
                pass={oLevelCurrent!.pass_rate}
                fail={oLevelCurrent!.fail_rate}
                passLabel="Pass (5+ subjects)"
                failLabel="Fail (<5 subjects)"
              />
            )}
            {hasALevel && (
              <ExamPie
                title="A-Level Pass Rate"
                pass={aLevelCurrent!.pass_rate}
                fail={aLevelCurrent!.fail_rate}
                passLabel="Pass (≥2 subjects)"
                failLabel="Fail (<2 subjects)"
              />
            )}
          </div>
        </div>
      )}

      {/* Year Comparison */}
      {comparisonEnabled && hasComparison && (
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Year-over-Year Comparison</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {oLevelCurrent && oLevelPrev && (
              <ComparisonChart
                title="O-Level Comparison"
                currentYear={currentYear}
                prevYear={prevYear}
                currentPass={oLevelCurrent.pass_rate}
                prevPass={oLevelPrev.pass_rate}
              />
            )}
            {aLevelCurrent && aLevelPrev && (
              <ComparisonChart
                title="A-Level Comparison"
                currentYear={currentYear}
                prevYear={prevYear}
                currentPass={aLevelCurrent.pass_rate}
                prevPass={aLevelPrev.pass_rate}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
