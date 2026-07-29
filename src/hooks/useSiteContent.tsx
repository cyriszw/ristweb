import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const contentCache: Record<string, string> = {};
const listeners: Record<string, Set<(val: string) => void>> = {};

// Subscribe to realtime changes once
let realtimeSetup = false;
function setupRealtime() {
  if (realtimeSetup) return;
  realtimeSetup = true;
  supabase.channel('site-content-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, (payload: any) => {
      const row = payload.new as any;
      if (row?.key) {
        contentCache[row.key] = row.content || '';
        listeners[row.key]?.forEach(fn => fn(row.content || ''));
      }
    })
    .subscribe();
}

export function useSiteContent(key: string, fallback: string): string {
  const [content, setContent] = useState(() => contentCache[key] ?? fallback);

  useEffect(() => {
    setupRealtime();

    if (!listeners[key]) listeners[key] = new Set();
    listeners[key].add(setContent);

    if (!(key in contentCache)) {
      (supabase.from('site_content' as any).select('content').eq('key', key).maybeSingle() as any)
        .then(({ data }: any) => {
          const val = data?.content || fallback;
          contentCache[key] = val;
          listeners[key]?.forEach(fn => fn(val));
        });
    }

    return () => { listeners[key]?.delete(setContent); };
  }, [key, fallback]);

  return content || fallback;
}
