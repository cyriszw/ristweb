import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/shared/PageHeader';
import { CardGridSkeleton } from '@/components/shared/Skeletons';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useSiteContent } from '@/hooks/useSiteContent';
import { FileText, Download, Shirt, BookOpen } from 'lucide-react';

function S({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return <div ref={ref} className={`${visible ? 'animate-reveal' : 'opacity-0'} ${className}`}>{children}</div>;
}

type FeeTab = 'tuition' | 'uniforms' | 'stationery';

export default function Fees() {
  const [fees, setFees] = useState<any[]>([]);
  const [uniforms, setUniforms] = useState<any[]>([]);
  const [stationery, setStationery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeeTab>('tuition');
  const [uniformsVisible, setUniformsVisible] = useState(true);
  const [stationeryVisible, setStationeryVisible] = useState(true);
  const intro = useSiteContent('fees_intro', '');

  useEffect(() => {
    Promise.all([
      (supabase.from('fees' as any).select('*').order('created_at', { ascending: true }) as any),
      (supabase.from('uniforms' as any).select('*').order('created_at', { ascending: true }) as any),
      (supabase.from('stationery' as any).select('*').order('created_at', { ascending: true }) as any),
      supabase.from('site_settings').select('key, value').in('key', ['uniforms_visible', 'stationery_visible']),
    ]).then(([feesRes, uniformsRes, stationeryRes, settingsRes]: any) => {
      setFees(feesRes.data || []);
      setUniforms(uniformsRes.data || []);
      setStationery(stationeryRes.data || []);
      (settingsRes.data || []).forEach((s: any) => {
        if (s.key === 'uniforms_visible') setUniformsVisible(s.value !== 'false');
        if (s.key === 'stationery_visible') setStationeryVisible(s.value !== 'false');
      });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const channel = supabase.channel('fees-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fees' }, () => {
        (supabase.from('fees' as any).select('*').order('created_at', { ascending: true }) as any)
          .then(({ data }: any) => { if (data) setFees(data); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uniforms' }, () => {
        (supabase.from('uniforms' as any).select('*').order('created_at', { ascending: true }) as any)
          .then(({ data }: any) => { if (data) setUniforms(data); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stationery' }, () => {
        (supabase.from('stationery' as any).select('*').order('created_at', { ascending: true }) as any)
          .then(({ data }: any) => { if (data) setStationery(data); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        supabase.from('site_settings').select('key, value').in('key', ['uniforms_visible', 'stationery_visible'])
          .then(({ data }) => {
            (data || []).forEach((s: any) => {
              if (s.key === 'uniforms_visible') setUniformsVisible(s.value !== 'false');
              if (s.key === 'stationery_visible') setStationeryVisible(s.value !== 'false');
            });
          });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const tabs: { key: FeeTab; label: string; icon: any; visible: boolean }[] = [
    { key: 'tuition', label: 'Tuition', icon: FileText, visible: true },
    { key: 'uniforms', label: 'Uniforms', icon: Shirt, visible: uniformsVisible },
    { key: 'stationery', label: 'Stationery', icon: BookOpen, visible: stationeryVisible },
  ];

  const visibleTabs = tabs.filter(t => t.visible);

  // Auto-select first visible tab if current is hidden
  useEffect(() => {
    if (!visibleTabs.find(t => t.key === activeTab) && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].key);
    }
  }, [uniformsVisible, stationeryVisible]);

  const uniformTotal = uniforms.reduce((s, i) => s + (i.price * i.quantity), 0);
  const stationeryTotal = stationery.reduce((s, i) => s + (i.price * i.quantity), 0);

  return (
    <Layout>
      <PageHeader title="Fees & Costs" subtitle="School fee structure and financial information" bannerKey="fees" />
      <section className="py-16">
        <div className="container max-w-4xl">
          {intro && (
            <S className="mb-8">
              <p className="text-muted-foreground text-center leading-relaxed">{intro}</p>
            </S>
          )}

          {loading ? <CardGridSkeleton count={6} /> : (
            <>
              {/* Tabs */}
              {visibleTabs.length > 1 && (
                <div className="flex gap-1 mb-8 bg-muted/50 p-1 rounded-lg w-fit mx-auto">
                  {visibleTabs.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === t.key
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Tuition Tab */}
              {activeTab === 'tuition' && (
                fees.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">Fee information will be published here soon.</p>
                ) : (
                  <div className="space-y-4">
                    {fees.map(fee => (
                      <S key={fee.id}>
                        <div className="bg-card border rounded-lg p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display text-lg font-semibold text-foreground">{fee.title}</h3>
                              {fee.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{fee.description}</p>}
                            </div>
                            {fee.amount && (
                              <div className="shrink-0 text-right">
                                <span className="text-lg font-bold text-primary">{fee.amount}</span>
                              </div>
                            )}
                          </div>
                          {fee.file_url && (
                            <a href={fee.file_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:underline">
                              <FileText className="w-4 h-4" /> <Download className="w-3 h-3" /> Download PDF
                            </a>
                          )}
                        </div>
                      </S>
                    ))}
                  </div>
                )
              )}

              {/* Uniforms Tab */}
              {activeTab === 'uniforms' && (
                uniforms.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">Uniform information will be published here soon.</p>
                ) : (
                  <S>
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-semibold text-foreground">Item</th>
                            <th className="text-right p-4 font-semibold text-foreground">Price</th>
                            <th className="text-right p-4 font-semibold text-foreground">Qty</th>
                            <th className="text-right p-4 font-semibold text-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uniforms.map(u => (
                            <tr key={u.id} className="border-t">
                              <td className="p-4 text-foreground font-medium">{u.name}</td>
                              <td className="p-4 text-right text-muted-foreground">${Number(u.price).toFixed(2)}</td>
                              <td className="p-4 text-right text-muted-foreground">{u.quantity}</td>
                              <td className="p-4 text-right font-semibold text-foreground">${(u.price * u.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t bg-primary/5">
                            <td colSpan={3} className="p-4 font-bold text-foreground text-lg">Overall Total</td>
                            <td className="p-4 text-right font-bold text-primary text-lg">${uniformTotal.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </S>
                )
              )}

              {/* Stationery Tab */}
              {activeTab === 'stationery' && (
                stationery.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">Stationery information will be published here soon.</p>
                ) : (
                  <S>
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-semibold text-foreground">Item</th>
                            <th className="text-right p-4 font-semibold text-foreground">Price</th>
                            <th className="text-right p-4 font-semibold text-foreground">Qty</th>
                            <th className="text-right p-4 font-semibold text-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stationery.map(s => (
                            <tr key={s.id} className="border-t">
                              <td className="p-4 text-foreground font-medium">{s.name}</td>
                              <td className="p-4 text-right text-muted-foreground">${Number(s.price).toFixed(2)}</td>
                              <td className="p-4 text-right text-muted-foreground">{s.quantity}</td>
                              <td className="p-4 text-right font-semibold text-foreground">${(s.price * s.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t bg-primary/5">
                            <td colSpan={3} className="p-4 font-bold text-foreground text-lg">Overall Total</td>
                            <td className="p-4 text-right font-bold text-primary text-lg">${stationeryTotal.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </S>
                )
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
