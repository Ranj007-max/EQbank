import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Batch, MCQ } from '../types';
import * as dataService from '../services/dataService';

interface BatchContextType {
  batches: Batch[];
  loading: boolean;
  addBatch: (batch: Omit<Batch, 'id' | 'createdAt'>) => Promise<void>;
  updateQuestion: (batchId: string, questionId: string, updates: Partial<MCQ>) => Promise<void>;
  updateQuestionNotes: (batchId: string, questionId: string, notes: string) => Promise<void>;
  getBatchById: (id: string) => Batch | undefined;
  refreshBatches: () => Promise<void>;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export const BatchProvider = ({ children }: { children: ReactNode }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshBatches = useCallback(async () => {
    setLoading(true);
    const fetchedBatches = await dataService.getBatches();
    setBatches(fetchedBatches);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshBatches();
  }, [refreshBatches]);

  const addBatch = async (batchData: Omit<Batch, 'id' | 'createdAt'>) => {
    const newBatch: Batch = {
      ...batchData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      questions: batchData.questions || [], // ensure questions is not undefined
    };
    await dataService.addBatch(newBatch);
    await refreshBatches(); // Re-fetch all batches to ensure state is in sync
  };

  const updateQuestion = async (batchId: string, questionId: string, updates: Partial<MCQ>) => {
    await dataService.updateQuestion(batchId, questionId, updates);
    // Optimistic update for faster UI response
    setBatches(prevBatches =>
      prevBatches.map(batch => {
        if (batch.id === batchId) {
          return {
            ...batch,
            questions: batch.questions.map(q =>
              q.id === questionId ? { ...q, ...updates } : q
            ),
          };
        }
        return batch;
      })
    );
  };

  const updateQuestionNotes = async (batchId: string, questionId: string, notes: string) => {
    await dataService.updateQuestionNotes(batchId, questionId, notes);
    setBatches(prevBatches =>
      prevBatches.map(batch => {
        if (batch.id === batchId) {
          return {
            ...batch,
            questions: batch.questions.map(q =>
              q.id === questionId ? { ...q, notes } : q
            ),
          };
        }
        return batch;
      })
    );
  };

  const getBatchById = (id: string) => {
    return batches.find(batch => batch.id === id);
  };

  const value = {
    batches,
    loading,
    addBatch,
    updateQuestion,
    updateQuestionNotes,
    getBatchById,
    refreshBatches,
  };

  return <BatchContext.Provider value={value}>{children}</BatchContext.Provider>;
};

export const useBatches = () => {
  const context = useContext(BatchContext);
  if (context === undefined) {
    throw new Error('useBatches must be used within a BatchProvider');
  }
  return context;
};
