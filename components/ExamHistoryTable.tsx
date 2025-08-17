import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const ExamHistoryTable: React.FC = () => {
  const { examHistory } = useAnalytics();
  const [isOpen, setIsOpen] = useState(true);

  if (examHistory.length === 0) {
    return null; // Don't show the card if there's no history
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle>Exam History</CardTitle>
        <Button variant="ghost" size="icon">
            {isOpen ? <ChevronDown /> : <ChevronRight />}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="rounded-md border">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 p-3 font-semibold bg-muted/50">
              <div>Exam Name</div>
              <div className="text-center">Date</div>
              <div className="text-center">Questions</div>
              <div className="text-center">Time Taken</div>
              <div className="text-right">Score</div>
            </div>
            {/* Body */}
            <div className="divide-y">
              {examHistory.map(exam => (
                <Link
                  key={exam.id}
                  to={`/exam/results/${exam.id}`}
                  className="grid grid-cols-5 gap-4 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>{`Exam - ${exam.config.subjects.join(', ')}`}</div>
                  <div className="text-center text-sm text-muted-foreground">{formatDate(exam.createdAt)}</div>
                  <div className="text-center">{exam.totalQuestions}</div>
                  <div className="text-center">{formatTime(exam.timeTaken)}</div>
                  <div className="text-right font-bold text-primary">{exam.score}%</div>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
