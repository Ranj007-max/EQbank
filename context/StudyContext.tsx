import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { StudySessionResult } from '../types';

interface StudyContextType {
  studyHistory: StudySessionResult[];
  addStudySession: (session: StudySessionResult) => void;
  getLatestSession: () => StudySessionResult | undefined;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider = ({ children }: { children: ReactNode }) => {
  const [studyHistory, setStudyHistory] = useLocalStorage<StudySessionResult[]>('pgqbank-study-history', []);

  const addStudySession = (session: StudySessionResult) => {
    // Keep only the last 10 sessions to prevent localStorage from growing too large
    setStudyHistory(prev => [session, ...prev].slice(0, 10));
  };

  const getLatestSession = () => {
    return studyHistory.length > 0 ? studyHistory[0] : undefined;
  };

  return (
    <StudyContext.Provider value={{ studyHistory, addStudySession, getLatestSession }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
