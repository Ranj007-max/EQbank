import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as dataService from '../services/dataService';
import { Activity, Tag, UserGoal } from '../types';

// Define the shape of the analytics data
interface AnalyticsData {
  overallStats: {
    totalQuestions: number;
    attemptedQuestions: number;
    accuracy: number;
    totalSessions: number;
  };
  performanceBySubject: Array<{ subject: string; correct: number; total: number; accuracy: number; }>;
  tagStats: { [key in Tag]: number };
  recentActivity: Activity[];
  performanceOverTime: Array<{ date: string; score: number; }>;
  goal: UserGoal | null;
}

interface AnalyticsContextType extends AnalyticsData {
  loading: boolean;
  refreshAnalytics: () => Promise<void>;
  setGoal: (goal: UserGoal | null) => Promise<void>;
}

const defaultAnalyticsData: AnalyticsData = {
    overallStats: { totalQuestions: 0, attemptedQuestions: 0, accuracy: 0, totalSessions: 0 },
    performanceBySubject: [],
    tagStats: { bookmarked: 0, hard: 0, revise: 0, mistaked: 0, highYield: 0, caseBased: 0, pyq: 0 },
    recentActivity: [],
    performanceOverTime: [],
    goal: { type: 'weeklyQuestions', target: 100 },
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
        goal
    ] = await Promise.all([
        dataService.getOverallStats(),
        dataService.getPerformanceBySubject(),
        dataService.getTagStats(),
        dataService.getRecentActivity(),
        dataService.getPerformanceOverTime(),
        dataService.getGoal(),
    ]);

    setAnalyticsData({
        overallStats,
        performanceBySubject,
        tagStats,
        recentActivity,
        performanceOverTime,
        goal,
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

  const value: AnalyticsContextType = {
    ...analyticsData,
    loading,
    refreshAnalytics,
    setGoal,
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
