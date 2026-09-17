import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Seller = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  seller_type: string;
  violation_count: number;
};
export type Store = {
  id: string;
  seller_id: string;
  slug: string;
  store_name: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  location: string | null;
  business_hours: any;
  social_links: any;
  status: string;
};

interface SellerContextType {
  seller: Seller | null;
  store: Store | null;
  loading: boolean;
  refresh: () => Promise<void>;
  isSeller: boolean;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export function SellerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) { setSeller(null); setStore(null); setLoading(false); return; }
    setLoading(true);
    const { data: s } = await supabase.from('marketplace_sellers' as any).select('*').eq('user_id', user.id).maybeSingle();
    if (s) {
      setSeller(s as any);
      const { data: st } = await supabase.from('marketplace_stores' as any).select('*').eq('seller_id', s.id).maybeSingle();
      setStore(st as any || null);
    } else {
      setSeller(null); setStore(null);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  return <SellerContext.Provider value={{ seller, store, loading, refresh, isSeller: !!seller }}>{children}</SellerContext.Provider>;
}

export function useSeller() {
  const ctx = useContext(SellerContext);
  if (!ctx) throw new Error('useSeller must be within SellerProvider');
  return ctx;
}
