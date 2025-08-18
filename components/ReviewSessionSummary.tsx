import React from 'react';
import { StudyQuestion } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface ReviewSessionSummaryProps {
  sessionQuestions: StudyQuestion[];
  answers: Record<string, string>;
  onRestart: () => void;
  onExit: () => void;
}

export const ReviewSessionSummary: React.FC<ReviewSessionSummaryProps> = ({
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
      <Card className="p-6 sm:p-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight gradient-text">
            Review Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <Card>
              <CardHeader><CardTitle>Accuracy</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold">
                {accuracy.toFixed(0)}%
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Correct</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold text-green-500">
                {correctAnswers.length}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Incorrect</CardTitle></CardHeader>
              <CardContent className="text-3xl font-bold text-red-500">
                {incorrectAnswers.length}
              </CardContent>
            </Card>
          </div>

          {incorrectAnswers.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4">Incorrect Answers</h3>
              <div className="space-y-4">
                {incorrectAnswers.map(q => (
                  <Card key={q.id} className="p-4">
                    <p className="font-semibold">{q.question}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="text-red-500 font-semibold">Your Answer:</span> {answers[q.id]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="text-green-500 font-semibold">Correct Answer:</span> {q.answer}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <Button onClick={onRestart} variant="outline">Review Again</Button>
            <Button onClick={onExit} variant="gradient">Back to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
