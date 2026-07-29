import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubjectRow {
  id: string;
  name: string;
  level: string;
  category: string | null;
  stream: string | null;
  sort_order: number;
}

export interface OLevelGroup {
  group: string;
  subjects: string[];
}

export function useSubjects() {
  const [oLevelGroups, setOLevelGroups] = useState<OLevelGroup[]>([]);
  const [aLevelSubjects, setALevelSubjects] = useState<string[]>([]);
  const [streamMap, setStreamMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!data) { setLoading(false); return; }

      const rows = data as SubjectRow[];

      // Build O-Level groups
      const groupMap: Record<string, string[]> = {};
      rows.filter(r => r.level === 'o-level').forEach(r => {
        const cat = r.category || 'Other';
        if (!groupMap[cat]) groupMap[cat] = [];
        groupMap[cat].push(r.name);
      });
      setOLevelGroups(Object.entries(groupMap).map(([group, subjects]) => ({ group, subjects })));

      // Build A-Level list and stream map
      const aLevel = rows.filter(r => r.level === 'a-level');
      setALevelSubjects(aLevel.map(r => r.name));

      const streams: Record<string, string> = {};
      aLevel.forEach(r => { if (r.stream) streams[r.name] = r.stream; });
      setStreamMap(streams);

      setLoading(false);
    };
    load();
  }, []);

  return { oLevelGroups, aLevelSubjects, streamMap, loading };
}
