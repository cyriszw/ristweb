import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function NotificationBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'notification_banner').maybeSingle()
      .then(({ data }) => { if (data?.value) setMessage(data.value); });

    const channel = supabase.channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload: any) => {
        if (payload.new?.key === 'notification_banner') {
          setMessage(payload.new.value || null);
          setDismissed(false);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!message || dismissed) return null;

  return (
    <div className="bg-secondary text-secondary-foreground px-4 py-2 text-center text-sm font-medium relative">
      <span>{message}</span>
      <button onClick={() => setDismissed(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary-foreground/10 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
