import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { History } from 'lucide-react';
import { cn } from '../lib/utils';

interface ExamHistoryTableProps {
  limit?: number;
}

export const ExamHistoryTable: React.FC<ExamHistoryTableProps> = ({ limit }) => {
  const { examHistory } = useAnalytics();
  const [isOpen, setIsOpen] = useState(true);

  const displayedHistory = limit ? examHistory.slice(0, limit) : examHistory;

  if (examHistory.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <History size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No Exam History</h3>
            <p>Your completed exams will appear here.</p>
        </div>
    );
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
    <Card className={cn("glass-card", "glow-border")}>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center text-2xl">
          <History size={24} className="mr-3 text-primary" />
          Exam History
        </CardTitle>
        <Button variant="ghost" className="btn-premium-label text-sm">
            {isOpen ? 'Collapse' : 'Expand'}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-border/30">
              {/* Header */}
              <div className="grid grid-cols-5 gap-4 p-4 font-semibold text-muted-foreground">
                <div>Exam Name</div>
                <div className="text-center">Date</div>
                <div className="text-center">Questions</div>
                <div className="text-center">Time Taken</div>
                <div className="text-right">Score</div>
              </div>
              {/* Body */}
              <div className="divide-y divide-border/20">
                {displayedHistory.map(exam => (
                  <Link
                    key={exam.id}
                    to={`/exam/results/${exam.id}`}
                    className="grid grid-cols-5 gap-4 p-4 transition-colors items-center hover:bg-primary/10"
                  >
                    <div className="font-medium">{`Exam - ${exam.config.subjects.join(', ')}`}</div>
                    <div className="text-center text-sm text-muted-foreground">{formatDate(exam.createdAt)}</div>
                    <div className="text-center">{exam.totalQuestions}</div>
                    <div className="text-center">{formatTime(exam.timeTaken)}</div>
                    <div className="text-right font-bold text-2xl text-primary">{exam.score}%</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}
       {isOpen && limit && examHistory.length > limit && (
        <CardFooter className="justify-center border-t pt-4">
            <Button variant="link" asChild>
                <Link to="/review/history">View All History</Link>
            </Button>
        </CardFooter>
      )}
    </Card>
  );
};
