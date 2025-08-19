import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as dataService from '../services/dataService';
import { Activity, AppData, Batch, ExamSession, UserGoal } from '../types';

// Define the shape of the analytics data
interface AnalyticsData {
  overallStats: {
    totalQuestions: number;
    attemptedQuestions: number;
    accuracy: number;
    totalSessions: number;
  };
  performanceBySubject: Array<{ subject: string; correct: number; total: number; accuracy: number; }>;
  tagStats: Array<{ tag: string; count: number }>;
  recentActivity: Activity[];
  performanceOverTime: Array<{ date: string; score: number; }>;
  goal: UserGoal | null;
  examHistory: ExamSession[];
  weeklyGoalProgress: { count: number, percentage: number };
  batches: Batch[];
  statsBySubject: Array<{ name: string }>;
  statsByPlatform: Array<{ name: string }>;
}

interface AnalyticsContextType extends AnalyticsData {
  loading: boolean;
  refreshAnalytics: () => Promise<void>;
  setGoal: (goal: UserGoal | null) => Promise<void>;
  exportData: () => void;
  importData: (data: AppData) => Promise<void>;
  updateBatch: (batch: Batch) => Promise<void>;
  getBatchById: (id: string) => Batch | undefined;
}

const defaultAnalyticsData: AnalyticsData = {
    overallStats: { totalQuestions: 0, attemptedQuestions: 0, accuracy: 0, totalSessions: 0 },
    performanceBySubject: [],
    tagStats: [],
    recentActivity: [],
    performanceOverTime: [],
    goal: { type: 'weeklyQuestions', target: 100 },
    examHistory: [],
    weeklyGoalProgress: { count: 0, percentage: 0 },
    batches: [],
    statsBySubject: [],
    statsByPlatform: [],
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(defaultAnalyticsData);
  const [loading, setLoading] = useState(true);

  const refreshAnalytics = useCallback(async () => {
    setLoading(true);
    const [
        overallStats,
        performanceBySubject,
        tagStats,
        recentActivity,
        performanceOverTime,
        goal,
        examHistory,
        weeklyGoalProgress,
        batches,
        statsBySubject,
        statsByPlatform,
    ] = await Promise.all([
        dataService.getOverallStats(),
        dataService.getPerformanceBySubject(),
        dataService.getTagStats(),
        dataService.getRecentActivity(),
        dataService.getPerformanceOverTime(),
        dataService.getGoal(),
        dataService.getExamHistory(),
        dataService.getWeeklyGoalProgress(),
        dataService.getBatches(),
        dataService.getStatsBySubject(),
        dataService.getStatsByPlatform(),
    ]);

    setAnalyticsData({
        overallStats,
        performanceBySubject,
        tagStats,
        recentActivity,
        performanceOverTime,
        goal,
        examHistory,
        weeklyGoalProgress,
        batches,
        statsBySubject,
        statsByPlatform,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  const setGoal = async (goal: UserGoal | null) => {
    await dataService.setGoal(goal);
    await refreshAnalytics();
  };

  const exportData = () => {
    dataService.exportData();
  }

  const importData = async (data: AppData) => {
    await dataService.importAppData(data);
    await refreshAnalytics();
  }

  const updateBatch = async (batch: Batch) => {
    await dataService.updateBatch(batch);
    await refreshAnalytics();
  }

  const getBatchById = (id: string) => {
    return analyticsData.batches.find(b => b.id === id);
  }

  const value: AnalyticsContextType = {
    ...analyticsData,
    loading,
    refreshAnalytics,
    setGoal,
    exportData,
    importData,
    updateBatch,
    getBatchById,
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
