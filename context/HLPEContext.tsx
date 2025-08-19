import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { HLPEAnalysisResult, HLPEWorkerMessage, HLPEWorkerResult } from '../hlpe/hlpeEngine.worker';
import { startHlpe, stopHlpe, postMessageToHlpe } from '../hlpe/hlpeManager';
import * as dataService from '../services/dataService';
import { useAnalytics } from './AnalyticsContext';

interface HLPEContextType {
  analysisResult: HLPEAnalysisResult | null;
  isAnalyzing: boolean;
  triggerAnalysis: (event: HLPEWorkerMessage['payload']) => void;
}

const HLPEContext = createContext<HLPEContextType | undefined>(undefined);

export const HLPEProvider = ({ children }: { children: ReactNode }) => {
  const [analysisResult, setAnalysisResult] = useState<HLPEAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  // We get the raw data from AnalyticsContext to avoid fetching it twice.
  const { batches, examHistory, loading } = useAnalytics();

  const handleWorkerMessage = useCallback(async (event: MessageEvent<HLPEWorkerResult>) => {
    const { type, payload } = event.data;

    if (type === 'ANALYSIS_COMPLETE') {
      console.log('HLPE Analysis Complete:', payload);
      setAnalysisResult(payload);
      setIsAnalyzing(false);
    }

    if (type === 'DATA_UPDATED') {
      console.log('HLPE Data Updated:', payload);
      if (payload.updatedMCQs.length > 0) {
        await dataService.batchUpdateQuestions(payload.updatedMCQs);
      }
      if (payload.updatedUserMetrics.userElo) {
        const currentMetrics = await dataService.getUserMetrics();
        await dataService.saveUserMetrics({ ...currentMetrics, ...payload.updatedUserMetrics });
      }
      // Optionally, refetch data in the main app after updates
    }
  }, []);

  useEffect(() => {
    if (loading) return; // Wait for the main data to be loaded

    const initializeHlpe = async () => {
      const worker = startHlpe();
      if (worker) {
        worker.addEventListener('message', handleWorkerMessage);

        const userMetrics = await dataService.getUserMetrics();

        postMessageToHlpe({
          type: 'INIT',
          payload: { batches, examHistory, userMetrics }
        });
        setIsAnalyzing(true);
      }
    };

    initializeHlpe();

    return () => {
      stopHlpe();
    };
  }, [loading, batches, examHistory, handleWorkerMessage]);

  const triggerAnalysis = useCallback((payload: HLPEWorkerMessage['payload']) => {
    postMessageToHlpe({ type: 'ANALYZE', payload });
    setIsAnalyzing(true);
  }, []);

  const value = { analysisResult, isAnalyzing, triggerAnalysis };

  return <HLPEContext.Provider value={value}>{children}</HLPEContext.Provider>;
};

export const useHLPE = () => {
  const context = useContext(HLPEContext);
  if (context === undefined) {
    throw new Error('useHLPE must be used within a HLPEProvider');
  }
  return context;
};
