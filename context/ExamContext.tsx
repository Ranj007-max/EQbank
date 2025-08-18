/// <reference types="vite/client" />
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ExamSession, ExamQuestion } from '../types';
import * as dataService from '../services/dataService';
import { useNavigate } from 'react-router-dom';

interface ExamConfig {
  questionCount: number;
  durationMinutes: number;
  subjects: string[];
  platforms: string[];
  statuses: string[];
}

interface ExamContextType {
  examSession: ExamSession | null;
  isExamActive: boolean;
  startExam: (config: ExamConfig, questions: ExamQuestion[]) => void;
  answerQuestion: (questionId: string, userAnswer: string | null) => void;
  endExam: () => Promise<void>;
  currentQuestion: ExamQuestion | undefined;
  userAnswers: { [questionId: string]: string | null };
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  totalQuestions: number;
  timeRemaining: number;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const isExamActive = examSession !== null && timeRemaining > 0;

  const stopTimer = useCallback(() => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  }, [timerId]);

  const startExam = (config: ExamConfig, questions: ExamQuestion[]) => {
    const session: ExamSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      config,
      questions: questions.map(q => ({
        questionData: q,
        userAnswer: null,
        isCorrect: false,
      })),
      timeTaken: 0,
      score: 0,
      accuracy: "0/0",
      correctAnswers: 0,
      totalQuestions: questions.length,
    };
    setExamSession(session);
    setCurrentQuestionIndex(0);

    if (timerId) clearInterval(timerId);
    setTimeRemaining(config.durationMinutes * 60);
    const newTimerId = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(newTimerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerId(newTimerId);

    navigate('/exam/session');
  };

  const answerQuestion = (questionId: string, userAnswer: string | null) => {
    setExamSession(prevSession => {
      if (!prevSession) return null;
      return {
        ...prevSession,
        questions: prevSession.questions.map(q =>
          q.questionData.id === questionId ? { ...q, userAnswer } : q
        ),
      };
    });
  };

  const endExam = useCallback(async () => {
    stopTimer();
    if (!examSession) return;

    let correctAnswers = 0;
    const finalQuestions = examSession.questions.map(q => {
      const isCorrect = q.userAnswer === q.questionData.answer;
      if (isCorrect) correctAnswers++;
      return { ...q, isCorrect };
    });

    const timeTaken = (examSession.config.durationMinutes * 60) - timeRemaining;

    const finalSession: ExamSession = {
      ...examSession,
      questions: finalQuestions,
      correctAnswers,
      totalQuestions: examSession.questions.length,
      score: Math.round((correctAnswers / examSession.questions.length) * 100),
      accuracy: `${correctAnswers}/${examSession.questions.length}`,
      timeTaken,
    };

    await dataService.addExamSession(finalSession);
    setExamSession(finalSession);
    navigate(`/exam/results/${finalSession.id}`);
  }, [examSession, timeRemaining, navigate, stopTimer]);

  useEffect(() => {
    if (isExamActive && timeRemaining <= 0) {
      endExam();
    }
  }, [timeRemaining, isExamActive, endExam]);

  useEffect(() => {
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [timerId]);

  const currentQuestion = examSession?.questions[currentQuestionIndex]?.questionData;
  const userAnswers = examSession?.questions.reduce((acc, q) => {
    if(q.questionData) acc[q.questionData.id] = q.userAnswer;
    return acc;
  }, {} as { [questionId: string]: string | null }) || {};

  const value: ExamContextType = {
    examSession,
    isExamActive,
    startExam,
    answerQuestion,
    endExam,
    currentQuestion,
    userAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    totalQuestions: examSession?.questions.length || 0,
    timeRemaining,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};
