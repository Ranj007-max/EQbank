import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ExamSession } from '../types';

interface ExamContextType {
  examHistory: ExamSession[];
  addExamSession: (session: ExamSession) => void;
  getExamById: (id: string) => ExamSession | undefined;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider = ({ children }: { children: ReactNode }) => {
  const [examHistory, setExamHistory] = useLocalStorage<ExamSession[]>('pgqbank-exam-history', []);

  const addExamSession = (session: ExamSession) => {
    setExamHistory(prev => [session, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const getExamById = (id: string) => {
    return examHistory.find(session => session.id === id);
  };

  return (
    <ExamContext.Provider value={{ examHistory, addExamSession, getExamById }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExams = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExams must be used within a ExamProvider');
  }
  return context;
};