import { createContext, useContext, useMemo, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Batch, StudySessionResult, ExamSession, MCQ, Activity, AppData, UserGoal, StudyQuestion } from '../types';

interface AnalyticsContextType {
  batches: Batch[];
  addBatch: (batch: Batch) => void;
  getBatchById: (id: string) => Batch | undefined;
  updateBatch: (updatedBatch: Batch) => void;
  recordAnswer: (batchId: string, questionId: string, isCorrect: boolean) => void;
  recordMultipleAnswers: (answers: Array<{ batchId: string, questionId: string, isCorrect: boolean }>) => void;
  
  studyHistory: StudySessionResult[];
  addStudySession: (session: StudySessionResult) => void;

  examHistory: ExamSession[];
  addExamSession: (session: ExamSession) => void;
  getExamById: (id: string) => ExamSession | undefined;

  goal: UserGoal | null;
  setGoal: (goal: UserGoal | null) => void;

  // Derived Analytics
  allQuestions: MCQ[];
  dueReviewQuestions: StudyQuestion[];
  tagStats: { bookmarked: number; hard: number; revise: number; mistaked: number; };
  performanceBySubject: Array<{ subject: string; correct: number; total: number; accuracy: number; }>;
  topicsToWatch: Array<{ subject: string; accuracy: number; }>;
  recentActivity: Activity[];
  lastSession: { type: 'study', data: StudySessionResult } | { type: 'exam', data: ExamSession } | undefined;
  overallStats: {
    totalQuestions: number;
    attemptedQuestions: number;
    accuracy: number;
    totalSessions: number;
  };
  statsBySubject: Array<{ name: string; total: number; attempted: number; }>;
  statsByPlatform: Array<{ name: string; total: number; attempted: number; }>;
  statsByChapter: Array<{ name: string; total: number; attempted: number; }>;
  exportData: () => void;
  importData: (data: AppData) => boolean;
  weeklyGoalProgress: { count: number; percentage: number };
  performanceOverTime: Array<{ date: string; score: number; }>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const [batches, setBatches] = useLocalStorage<Batch[]>('pgqbank-batches', []);
  const [studyHistory, setStudyHistory] = useLocalStorage<StudySessionResult[]>('pgqbank-study-history', []);
  const [examHistory, setExamHistory] = useLocalStorage<ExamSession[]>('pgqbank-exam-history', []);
  const [goal, setGoal] = useLocalStorage<UserGoal | null>('pgqbank-goal', { type: 'weeklyQuestions', target: 100 });

  // --- Core Data Mutators ---
  const addBatch = (batch: Batch) => {
    setBatches(prev => [...prev, batch].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };
  
  const updateBatch = (updatedBatch: Batch) => {
    setBatches(prev => prev.map(batch => batch.id === updatedBatch.id ? updatedBatch : batch));
  };

  const getBatchById = (id: string) => {
    return batches.find(batch => batch.id === id);
  };

  const addStudySession = (session: StudySessionResult) => {
    setStudyHistory(prev => [session, ...prev].slice(0, 20));
  };
  
  const addExamSession = (session: ExamSession) => {
    setExamHistory(prev => [session, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const getExamById = (id: string) => {
    return examHistory.find(session => session.id === id);
  };
  
  const recordAnswer = (batchId: string, questionId: string, isCorrect: boolean) => {
    setBatches(prevBatches => prevBatches.map(batch => {
      if (batch.id === batchId) {
        const updatedQuestions = batch.questions.map(q => {
          if (q.id === questionId) {
            const newSrsLevel = isCorrect ? (q.srsLevel || 0) + 1 : 1;
            const intervalDays = newSrsLevel > 0 ? 2 ** (newSrsLevel - 1) : 0;
            const nextReviewDate = new Date();
            nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
            return { ...q, lastAttemptCorrect: isCorrect, srsLevel: newSrsLevel, nextReviewDate: nextReviewDate.toISOString() };
          }
          return q;
        });
        return { ...batch, questions: updatedQuestions };
      }
      return batch;
    }));
  };

  const recordMultipleAnswers = (answers: Array<{ batchId: string, questionId: string, isCorrect: boolean }>) => {
    setBatches(prevBatches => {
      const answersMap = new Map<string, { isCorrect: boolean; batchId: string }>();
      answers.forEach(a => answersMap.set(a.questionId, { isCorrect: a.isCorrect, batchId: a.batchId }));
      
      return prevBatches.map(batch => {
        const hasUpdates = batch.questions.some(q => answersMap.has(q.id));
        if (!hasUpdates) return batch;

        const updatedQuestions = batch.questions.map(q => {
          if (answersMap.has(q.id)) {
            const { isCorrect } = answersMap.get(q.id)!;
            const newSrsLevel = isCorrect ? (q.srsLevel || 0) + 1 : 1;
            const intervalDays = newSrsLevel > 0 ? 2 ** (newSrsLevel - 1) : 0;
            const nextReviewDate = new Date();
            nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
            return { ...q, lastAttemptCorrect: isCorrect, srsLevel: newSrsLevel, nextReviewDate: nextReviewDate.toISOString() };
          }
          return q;
        });
        return { ...batch, questions: updatedQuestions };
      });
    });
  };

  // --- Computational Logic & Derived State (The "Engine") ---

  const allQuestions = useMemo(() => batches.flatMap(b => b.questions), [batches]);

  const tagStats = useMemo(() => {
    const stats = { bookmarked: 0, hard: 0, revise: 0, mistaked: 0 };
    allQuestions.forEach(q => {
      if (q.tags.bookmarked) stats.bookmarked++;
      if (q.tags.hard) stats.hard++;
      if (q.tags.revise) stats.revise++;
      if (q.lastAttemptCorrect === false) stats.mistaked++;
    });
    return stats;
  }, [allQuestions]);

  const dueReviewQuestions = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return batches.flatMap(batch => 
      batch.questions
        .filter(q => q.nextReviewDate && new Date(q.nextReviewDate) <= today)
        .map(q => ({...q, batchId: batch.id}))
    ).sort((a,b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime());
  }, [batches]);

  const performanceBySubject = useMemo(() => {
    const stats: { [key: string]: { correct: number; total: number } } = {};
    
    batches.forEach(batch => {
      batch.questions.forEach(q => {
        if (q.lastAttemptCorrect !== null) { // Has been attempted
          if (!stats[batch.subject]) {
            stats[batch.subject] = { correct: 0, total: 0 };
          }
          stats[batch.subject].total++;
          if (q.lastAttemptCorrect === true) {
            stats[batch.subject].correct++;
          }
        }
      });
    });

    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      ...data,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    })).sort((a,b) => b.total - a.total);
  }, [batches]);

  const topicsToWatch = useMemo(() => {
    return performanceBySubject
      .filter(s => s.total > 5) // Only suggest topics with a meaningful number of attempts
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
  }, [performanceBySubject]);

  const recentActivity = useMemo((): Activity[] => {
    const batchActivities: Activity[] = batches.map(b => ({
      type: 'batch', id: b.id, name: b.name, questionCount: b.questions.length, createdAt: b.createdAt,
    }));
    const studyActivities: Activity[] = studyHistory.map(s => ({
      type: 'study', id: s.id, score: s.score, subjects: s.config.subjects, createdAt: s.createdAt,
    }));
    const examActivities: Activity[] = examHistory.map(e => ({
      type: 'exam', id: e.id, score: e.score, subjects: e.config.subjects, createdAt: e.createdAt,
    }));

    return [...batchActivities, ...studyActivities, ...examActivities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [batches, studyHistory, examHistory]);
  
  const lastSession = useMemo(() => {
    const lastStudy = studyHistory[0];
    const lastExam = examHistory[0];
    if (!lastStudy && !lastExam) return undefined;
    if (!lastStudy) return { type: 'exam', data: lastExam } as const;
    if (!lastExam) return { type: 'study', data: lastStudy } as const;

    return new Date(lastStudy.createdAt) > new Date(lastExam.createdAt)
      ? { type: 'study', data: lastStudy } as const
      : { type: 'exam', data: lastExam } as const;
  }, [studyHistory, examHistory]);

  const overallStats = useMemo(() => {
    const attemptedQuestions = allQuestions.filter(q => q.lastAttemptCorrect !== null);
    const correctAttempts = attemptedQuestions.filter(q => q.lastAttemptCorrect === true).length;
    const totalSessions = studyHistory.length + examHistory.length;
    const accuracy = attemptedQuestions.length > 0 ? Math.round((correctAttempts / attemptedQuestions.length) * 100) : 0;
    
    return {
      totalQuestions: allQuestions.length,
      attemptedQuestions: attemptedQuestions.length,
      accuracy,
      totalSessions,
    };
  }, [allQuestions, studyHistory, examHistory]);

  const statsBySubject = useMemo(() => {
    const stats: { [key: string]: { total: number; attempted: number } } = {};
    batches.forEach(batch => {
      if (!stats[batch.subject]) {
        stats[batch.subject] = { total: 0, attempted: 0 };
      }
      stats[batch.subject].total += batch.questions.length;
      stats[batch.subject].attempted += batch.questions.filter(q => q.lastAttemptCorrect !== null).length;
    });
    return Object.entries(stats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total);
  }, [batches]);

  const statsByPlatform = useMemo(() => {
    const stats: { [key: string]: { total: number; attempted: number } } = {};
    batches.forEach(batch => {
      if (!stats[batch.platform]) {
        stats[batch.platform] = { total: 0, attempted: 0 };
      }
      stats[batch.platform].total += batch.questions.length;
      stats[batch.platform].attempted += batch.questions.filter(q => q.lastAttemptCorrect !== null).length;
    });
    return Object.entries(stats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total);
  }, [batches]);

  const statsByChapter = useMemo(() => {
    const stats: { [key: string]: { total: number; attempted: number } } = {};
    batches.forEach(batch => {
      const chapterKey = `${batch.subject} - ${batch.chapter}`;
      if (!stats[chapterKey]) {
        stats[chapterKey] = { total: 0, attempted: 0 };
      }
      stats[chapterKey].total += batch.questions.length;
      stats[chapterKey].attempted += batch.questions.filter(q => q.lastAttemptCorrect !== null).length;
    });
    return Object.entries(stats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total);
  }, [batches]);
  
  const weeklyGoalProgress = useMemo(() => {
    if (!goal) return { count: 0, percentage: 0 };
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const questionsInStudyHistory = studyHistory
      .filter(s => new Date(s.createdAt) >= oneWeekAgo)
      .reduce((sum, s) => sum + s.config.questionCount, 0);

    const questionsInExamHistory = examHistory
      .filter(e => new Date(e.createdAt) >= oneWeekAgo)
      .reduce((sum, e) => sum + e.questions.length, 0);

    const questionsAnswered = questionsInStudyHistory + questionsInExamHistory;

    return {
        count: questionsAnswered,
        percentage: (goal.target > 0) ? Math.min(100, Math.round((questionsAnswered / goal.target) * 100)) : 0,
    };
  }, [examHistory, studyHistory, goal]);

  const performanceOverTime = useMemo(() => {
    const sessionHistory = [...studyHistory, ...examHistory]
        .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (sessionHistory.length === 0) return [];
    return sessionHistory.map(session => ({
        date: new Date(session.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
        score: session.score,
    }));
  }, [studyHistory, examHistory]);
  
  const exportData = () => {
    const data: AppData = {
      batches,
      studyHistory,
      examHistory,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `pgqbank_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importData = (data: AppData): boolean => {
    if (!data || !Array.isArray(data.batches) || !Array.isArray(data.studyHistory) || !Array.isArray(data.examHistory)) {
        alert('Invalid data format. Import failed.');
        return false;
    }
    try {
        setBatches(data.batches);
        setStudyHistory(data.studyHistory);
        setExamHistory(data.examHistory);
        alert('Data imported successfully! The page will now reload.');
        window.location.reload();
        return true;
    } catch (e) {
        console.error("Failed to import data:", e);
        alert('An error occurred during import. Check console for details.');
        return false;
    }
  };
  
  const value: AnalyticsContextType = {
    batches, addBatch, getBatchById, updateBatch, recordAnswer, recordMultipleAnswers,
    studyHistory, addStudySession,
    examHistory, addExamSession, getExamById,
    goal, setGoal,
    allQuestions, dueReviewQuestions, tagStats, performanceBySubject, topicsToWatch, recentActivity, lastSession, overallStats,
    

    statsBySubject, statsByPlatform, statsByChapter, exportData, importData, weeklyGoalProgress, performanceOverTime


  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
