import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBatches } from '../context/BatchContext';
import * as dataService from '../services/dataService';
import { StudyQuestion } from '../types';
import { BrainCircuit, History, BookCopy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { ExamHistoryTable } from '../components/ExamHistoryTable';

const ReviewHub: React.FC = () => {
  const { batches } = useBatches();
  const [dueReviewQuestions, setDueReviewQuestions] = useState<StudyQuestion[]>([]);

  useEffect(() => {
    const fetchDueQuestions = async () => {
      const questions = await dataService.getDueReviewQuestions();
      setDueReviewQuestions(questions);
    };
    fetchDueQuestions();
  }, []);

  return (
    <div className="animate-fade-in space-y-12">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tighter gradient-text">
          Review Hub
        </h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
          Your central command for reinforcing knowledge. Dive into spaced repetition, review past exams, or browse your question batches.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BrainCircuit className="text-primary" />
            <span>Spaced Repetition (SRS)</span>
          </CardTitle>
          <CardDescription>
            Reinforce your memory with questions scheduled for you by the algorithm.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-6xl font-bold text-foreground mb-4">
            {dueReviewQuestions.length}
          </p>
          <p className="text-muted-foreground mb-6">
            questions are due for review.
          </p>
          <Button size="lg" asChild className="btn-gradient" disabled={dueReviewQuestions.length === 0}>
            <Link to="/srs-review">Start SRS Review</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BookCopy />
              <span>Question Batches</span>
            </CardTitle>
            <CardDescription>
              Review all questions from a specific batch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {batches.slice(0, 5).map(batch => (
                <Link to={`/bank/review/${batch.id}`} key={batch.id} className="block p-3 rounded-lg hover:bg-muted">
                  <p className="font-semibold">{batch.name}</p>
                  <p className="text-sm text-muted-foreground">{batch.questions.length} questions</p>
                </Link>
              ))}
            </div>
            {batches.length > 5 && (
              <div className="text-center mt-4">
                <Button variant="link" asChild>
                  <Link to="/bank">View All Batches</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <History />
              <span>Recent Exams</span>
            </CardTitle>
            <CardDescription>
              Review your performance on past exams.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ExamHistoryTable limit={5} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewHub;
