import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(215,70%,35%)', 'hsl(200,60%,55%)', 'hsl(35,80%,50%)', 'hsl(150,50%,45%)', 'hsl(0,60%,50%)'];

export default function VisitorStats() {
  const [logs, setLogs] = useState<any[]>([]);
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const load = useCallback(async () => {
    let query = supabase.from('visitor_logs').select('*').order('created_at', { ascending: false });
    const now = new Date();
    if (range === 'today') {
      query = query.gte('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
    } else if (range === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (range === 'month') {
      const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('created_at', monthAgo.toISOString());
    }
    const { data } = await query;
    setLogs(data || []);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const grouped = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.visitor_type] = (acc[l.visitor_type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(grouped).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = logs.length;

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-6">Visitor Statistics</h2>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['today', 'week', 'month', 'all'] as const).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              range === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
            {r === 'all' ? 'All Time' : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {chartData.map((d, i) => (
          <div key={d.name} className="bg-card border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold font-display" style={{ color: COLORS[i % COLORS.length] }}>{d.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{d.name}</div>
          </div>
        ))}
        <div className="bg-card border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold font-display text-foreground">{total}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Visits</div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">By Visitor Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartData.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No visitor data recorded yet.</p>
      )}
    </div>
  );
}
