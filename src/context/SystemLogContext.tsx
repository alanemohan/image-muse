import React, { createContext, useContext, useState, useCallback } from 'react';

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  timestamp: Date;
}

interface SystemLogContextType {
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry['type']) => void;
}

const SystemLogContext = createContext<SystemLogContextType>({
  logs: [],
  addLog: () => {},
});

export const useSystemLog = () => useContext(SystemLogContext);

export const SystemLogProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      { id: crypto.randomUUID(), message, type, timestamp: new Date() },
      ...prev.slice(0, 99),
    ]);
  }, []);

  return (
    <SystemLogContext.Provider value={{ logs, addLog }}>
      {children}
    </SystemLogContext.Provider>
  );
};
