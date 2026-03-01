import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { SearchAPI, OperatingMode } from '../api';
import { getOnlineAPI } from '../api/online';

interface OperatingModeContextValue {
  /** Current operating mode */
  mode: OperatingMode;
  /** Whether corpus files exist locally */
  corpusDownloaded: boolean;
  /** Loading state during initialization */
  loading: boolean;
  /** The API instance to use for data access */
  api: SearchAPI;
  /** Set the operating mode */
  setMode: (mode: 'online' | 'offline') => void;
  /** Check and update corpus existence status */
  refreshCorpusStatus: () => Promise<void>;
}

const OperatingModeContext = createContext<OperatingModeContextValue | null>(null);

interface OperatingModeProviderProps {
  children: ReactNode;
}

export function OperatingModeProvider({ children }: OperatingModeProviderProps) {
  const [mode, setModeState] = useState<OperatingMode>('online');
  const [loading, setLoading] = useState(true);
  const [api] = useState<SearchAPI>(getOnlineAPI());

  // Initialize: always online mode for web
  useEffect(() => {
    setModeState('online');
    setLoading(false);
  }, []);

  const setMode = useCallback((newMode: 'online' | 'offline') => {
    setModeState(newMode);
  }, []);

  const refreshCorpusStatus = useCallback(async () => {
    // No-op for web target
  }, []);

  const value: OperatingModeContextValue = {
    mode,
    corpusDownloaded: false,
    loading,
    api,
    setMode,
    refreshCorpusStatus,
  };

  return (
    <OperatingModeContext.Provider value={value}>
      {children}
    </OperatingModeContext.Provider>
  );
}

export function useOperatingMode(): OperatingModeContextValue {
  const context = useContext(OperatingModeContext);
  if (!context) {
    throw new Error('useOperatingMode must be used within an OperatingModeProvider');
  }
  return context;
}

// Re-export helper functions for saving user preferences (no-ops for web)
export async function saveOnlineModePreference(_skipPrompt: boolean): Promise<void> {
  // No-op for web target (always online)
}

export async function clearModePreference(): Promise<void> {
  // No-op for web target (always online)
}
