import React from 'react';
import { ExamQuestion } from '../types';
import QuestionItem from './QuestionItem';

interface TreasuryContentProps {
  questions: ExamQuestion[];
}

const TreasuryContent: React.FC<TreasuryContentProps> = ({ questions }) => {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border border-dashed rounded-lg">
        <h2 className="text-2xl font-semibold text-muted-foreground">No Questions Found</h2>
        <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <QuestionItem key={question.id} question={question} />
      ))}
    </div>
  );
};

export default TreasuryContent;
