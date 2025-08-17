import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Batch, MCQ } from '../types';

interface BatchContextType {
  batches: Batch[];
  addBatch: (batch: Batch) => void;
  getBatchById: (id: string) => Batch | undefined;
  updateBatch: (updatedBatch: Batch) => void;
}

const BatchContext = createContext<BatchContextType | undefined>(undefined);

export const BatchProvider = ({ children }: { children: ReactNode }) => {
  const [batches, setBatches] = useLocalStorage<Batch[]>('pgqbank-batches', []);

  const addBatch = (batch: Batch) => {
    setBatches(prevBatches => [...prevBatches, batch].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const getBatchById = (id: string) => {
    return batches.find(batch => batch.id === id);
  };
  
  const updateBatch = (updatedBatch: Batch) => {
    setBatches(prevBatches => 
      prevBatches.map(batch => batch.id === updatedBatch.id ? updatedBatch : batch)
    );
  };

  return (
    <BatchContext.Provider value={{ batches, addBatch, getBatchById, updateBatch }}>
      {children}
    </BatchContext.Provider>
  );
};

export const useBatches = () => {
  const context = useContext(BatchContext);
  if (context === undefined) {
    throw new Error('useBatches must be used within a BatchProvider');
  }
  return context;
};
