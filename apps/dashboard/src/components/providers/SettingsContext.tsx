'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { MOCK_SETTINGS } from '@/lib/mock-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PracticeProfile {
  name: string;
  entity: string;
}

interface SettingsContextValue {
  /** Live practice name — displayed in the sidebar brand block. */
  profile: PracticeProfile;
  /** Update name + entity; sidebar re-renders immediately. */
  updateProfile: (patch: Partial<PracticeProfile>) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile?: PracticeProfile;
}) {
  const [profile, setProfile] = useState<PracticeProfile>(
    initialProfile ?? { name: MOCK_SETTINGS.name, entity: MOCK_SETTINGS.entity },
  );

  const updateProfile = useCallback((patch: Partial<PracticeProfile>) => {
    setProfile(prev => ({ ...prev, ...patch }));
  }, []);

  return (
    <SettingsContext.Provider value={{ profile, updateProfile }}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Use inside any client component in the (dashboard) tree. */
export function usePracticeProfile(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('usePracticeProfile must be used inside <SettingsProvider>');
  return ctx;
}
