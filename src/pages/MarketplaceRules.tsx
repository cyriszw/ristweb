import { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck } from 'lucide-react';

export default function MarketplaceRules() {
  const [content, setContent] = useState('');
  useEffect(()=>{
    supabase.from('marketplace_rules' as any).select('content').limit(1).maybeSingle().then(({data})=>{ if(data) setContent(data.content); });
  },[]);
  return (
    <Layout>
      <section className="bg-primary py-10">
        <div className="container max-w-3xl">
          <p className="text-xs tracking-[0.2em] text-white/70 uppercase flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Marketplace Rules</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Marketplace Rules & Disclaimer</h1>
        </div>
      </section>
      <div className="container max-w-3xl py-8">
        <div className="bg-card border rounded-xl p-6">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">{content || 'Loading rules...'}</div>
        </div>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          The school reserves the right to review, reject, remove or suspend marketplace activity according to its policies. Contact administration for queries.
        </div>
      </div>
    </Layout>
  );
}
