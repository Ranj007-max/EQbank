import React from 'react';
import { StudyQuestion } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { ProgressRing } from './ui/progress-ring';

interface ReviewSessionSummaryProps {
  sessionQuestions: StudyQuestion[];
  answers: Record<string, string>;
  onRestart: () => void;
  onExit: () => void;
}

const ReviewSessionSummary: React.FC<ReviewSessionSummaryProps> = ({
  sessionQuestions,
  answers,
  onRestart,
  onExit,
}) => {
  const correctAnswers = sessionQuestions.filter(q => answers[q.id] === q.answer);
  const incorrectAnswers = sessionQuestions.filter(q => answers[q.id] && answers[q.id] !== q.answer);
  const accuracy = sessionQuestions.length > 0 ? (correctAnswers.length / sessionQuestions.length) * 100 : 0;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto py-8">
      <Card className="p-6 sm:p-8 glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-extrabold tracking-tight gradient-text">
            Review Complete!
          </CardTitle>
          <CardDescription>
            Great job on completing your review session. Here's your summary:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-around gap-8 p-6 bg-muted/50 rounded-xl">
            <div className="relative">
              <ProgressRing progress={accuracy} size={140} strokeWidth={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{accuracy.toFixed(0)}%</span>
                <span className="text-muted-foreground">Accuracy</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-center">
                <div className="p-4 rounded-lg">
                    <p className="text-3xl font-bold text-green-500">{correctAnswers.length}</p>
                    <p className="text-sm font-medium text-muted-foreground">Correct</p>
                </div>
                <div className="p-4 rounded-lg">
                    <p className="text-3xl font-bold text-red-500">{incorrectAnswers.length}</p>
                    <p className="text-sm font-medium text-muted-foreground">Incorrect</p>
                </div>
            </div>
          </div>

          {incorrectAnswers.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-center">Items to Review</h3>
              <div className="space-y-4">
                {incorrectAnswers.map(q => (
                  <Card key={q.id} className="p-4 border-l-4 border-red-500">
                    <p className="font-semibold">{q.question}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4">
                        <p className="text-sm text-muted-foreground">
                            <span className="text-red-500 font-semibold">Your Answer:</span> {answers[q.id]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-green-500 font-semibold">Correct Answer:</span> {q.answer}
                        </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <Button onClick={onRestart} variant="outline" className="rounded-full">Review Again</Button>
            <Button onClick={onExit} className="btn-gradient rounded-full">Back to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default ReviewSessionSummary;
