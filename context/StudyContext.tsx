import { createContext, useContext, useState, ReactNode } from 'react';
import { StudyQuestion, StudySessionResult } from '../types';
import * as dataService from '../services/dataService';
import { useNavigate } from 'react-router-dom';

interface StudyContextType {
  isStudying: boolean;
  studyQuestions: StudyQuestion[];
  startStudySession: (questions: StudyQuestion[], config: StudySessionResult['config']) => void;
  recordAnswer: (questionId: string, batchId: string, isCorrect: boolean) => void;
  endStudySession: () => void;
  getResults: () => { correct: number; total: number; };

  // SRS specific state and functions
  isSrsReviewActive: boolean;
  srsQuestions: StudyQuestion[];
  startSrsSession: (questions: StudyQuestion[]) => void;
  endSrsSession: () => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  // State for regular study sessions
  const [studyQuestions, setStudyQuestions] = useState<StudyQuestion[]>([]);
  const [sessionConfig, setSessionConfig] = useState<StudySessionResult['config'] | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  // State for SRS sessions
  const [srsQuestions, setSrsQuestions] = useState<StudyQuestion[]>([]);

  const isStudying = studyQuestions.length > 0;
  const isSrsReviewActive = srsQuestions.length > 0;

  const startStudySession = (questions: StudyQuestion[], config: StudySessionResult['config']) => {
    setSrsQuestions([]); // Ensure no SRS session is active
    setStudyQuestions(questions);
    setSessionConfig(config);
    setAnswers({});
    navigate('/study');
  };

  const startSrsSession = (questions: StudyQuestion[]) => {
    setStudyQuestions([]); // Ensure no regular study session is active
    setSrsQuestions(questions);
    setAnswers({}); // Also track answers for SRS
    navigate('/srs-review');
  };

  const recordAnswer = (questionId: string, batchId: string, isCorrect: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: isCorrect }));
    dataService.recordAnswerAndUpdateSrs(batchId, questionId, isCorrect);
  };

  const getResults = () => {
      const total = Object.keys(answers).length;
      const correct = Object.values(answers).filter(Boolean).length;
      return { correct, total };
  };

  const endStudySession = () => {
    if (!sessionConfig) return;

    const { correct, total } = getResults();
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const sessionResult: StudySessionResult = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      score,
      accuracy: `${correct}/${total}`,
      config: sessionConfig,
    };

    dataService.addStudySession(sessionResult);

    setStudyQuestions([]);
    setAnswers({});
    setSessionConfig(null);
    navigate('/bank');
  };

  const endSrsSession = () => {
    setSrsQuestions([]);
    setAnswers({});
    navigate('/review'); // Navigate to the review hub
  };

  const value: StudyContextType = {
    isStudying,
    studyQuestions,
    startStudySession,
    recordAnswer,
    endStudySession,
    getResults,
    isSrsReviewActive,
    srsQuestions,
    startSrsSession,
    endSrsSession,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
