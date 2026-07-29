import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  loading: boolean;
}

const MaintenanceContext = createContext<MaintenanceContextType>({ isMaintenanceMode: false, loading: true });

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle()
      .then(({ data }) => {
        setIsMaintenanceMode(data?.value === 'true');
        setLoading(false);
      });
  }, []);

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, loading }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  return useContext(MaintenanceContext);
}
