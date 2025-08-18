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

interface PreviewQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: { id: string; text: string }[];
}

const PreviewQuestionsModal: React.FC<PreviewQuestionsModalProps> = ({ isOpen, onClose, questions }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card text-white" style={{ background: 'rgba(10, 10, 10, 0.8)' }}>
        <DialogHeader>
          <DialogTitle>Preview Questions</DialogTitle>
          <DialogDescription>
            Here are some of the questions that match your filter criteria.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.id} className="p-2 border-b border-gray-700">
                {q.text}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewQuestionsModal;
