import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import type { ExamQuestion } from '../types';

interface QuickReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: ExamQuestion[];
  answers: Record<string, string>;
  markedForReview: string[];
  currentIndex: number;
  onQuestionSelect: (index: number) => void;
}

const QuickReviewModal: React.FC<QuickReviewModalProps> = ({
  isOpen,
  onClose,
  questions,
  answers,
  markedForReview,
  currentIndex,
  onQuestionSelect
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card text-white" style={{ background: 'rgba(10, 10, 10, 0.8)' }}>
        <DialogHeader>
          <DialogTitle>Quick Review</DialogTitle>
          <DialogDescription>Jump to any question.</DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-5 gap-2">
          {questions.map((q, index) => {
            const isMarked = markedForReview.includes(q.id);
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = index === currentIndex;

            let statusClass = 'bg-gray-700 hover:bg-gray-600';
            if (isAnswered) statusClass = 'bg-blue-500 hover:bg-blue-400';
            if (isMarked) statusClass = 'bg-yellow-500 hover:bg-yellow-400';
            if (isCurrent) statusClass = 'ring-2 ring-white';

            return (
              <button
                key={q.id}
                onClick={() => {
                  onQuestionSelect(index);
                  onClose();
                }}
                className={cn("h-12 w-12 rounded-full flex items-center justify-center font-bold", statusClass)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickReviewModal;
