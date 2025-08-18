import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { MCQ } from '../types';
import { CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ExamHistoryTable } from '../components/ExamHistoryTable';
import { ProgressRing } from '../components/ui/progress-ring';
import { cn } from '../lib/utils';
import { useCountUp } from '../hooks/useCountUp';

const ExamResults: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { getExamById, getBatchById, updateBatch } = useAnalytics();
  const [isExplanationOpen, setIsExplanationOpen] = useState<Record<string, boolean>>({});

  const examSession = useMemo(() => sessionId ? getExamById(sessionId) : undefined, [sessionId, getExamById]);
  const animatedScore = useCountUp(examSession?.score || 0, 1000);
  const animatedCorrect = useCountUp(examSession?.correctAnswers || 0, 1000);
  const animatedIncorrect = useCountUp((examSession?.totalQuestions || 0) - (examSession?.correctAnswers || 0), 1000);


  if (!examSession) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground">Exam session not found</h2>
        <Button asChild className="mt-4">
          <Link to="/exams">Return to Exam Setup</Link>
        </Button>
      </div>
    );
  }

  const toggleTag = (mcqId: string, batchId: string, tag: keyof MCQ['tags']) => {
    const batch = getBatchById(batchId);
    if (batch) {
      const updatedQuestions = batch.questions.map(q => {
        if (q.id === mcqId) {
          return { ...q, tags: { ...q.tags, [tag]: !q.tags[tag] } };
        }
        return q;
      });
      updateBatch({ ...batch, questions: updatedQuestions });
    }
  };

  const toggleExplanation = (id: string) => {
    setIsExplanationOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const timeTakenFormatted = `${Math.floor(examSession.timeTaken / 60)}m ${examSession.timeTaken % 60}s`;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold tracking-tighter gradient-text">Exam Results</h1>
        <p className="text-muted-foreground text-lg">
          Review your performance for the session completed on {new Date(examSession.createdAt).toLocaleDateString()}.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative">
            <ProgressRing progress={animatedScore} size={160} strokeWidth={12} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{animatedScore}</span>
              <span className="text-muted-foreground">Score</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-center">
            <div className="p-4 rounded-lg">
              <p className="text-3xl font-bold text-green-500">{animatedCorrect}</p>
              <p className="text-sm font-medium text-muted-foreground">Correct</p>
            </div>
            <div className="p-4 rounded-lg">
              <p className="text-3xl font-bold text-red-500">{animatedIncorrect}</p>
              <p className="text-sm font-medium text-muted-foreground">Incorrect</p>
            </div>
            <div className="p-4 rounded-lg">
              <p className="text-3xl font-bold">{examSession.accuracy}</p>
              <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
            </div>
            <div className="p-4 rounded-lg">
              <p className="text-3xl font-bold">{timeTakenFormatted}</p>
              <p className="text-sm font-medium text-muted-foreground">Time Taken</p>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Question Review</h2>
        <div className="space-y-4">
          {examSession.questions.map(({ questionData, userAnswer, isCorrect }, index) => {
            const currentBatch = getBatchById(questionData.batchId);
            const currentQuestionFromBatch = currentBatch?.questions.find(q => q.id === questionData.id);

            return (
              <Card key={questionData.id} className={cn("overflow-hidden", isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500')}>
                  <CardHeader className="flex flex-row justify-between items-start">
                      <p className="font-semibold text-foreground flex-1 pr-4">{index + 1}. {questionData.question}</p>
                      {currentQuestionFromBatch && <div className="flex items-center gap-2">
                          <Button variant="ghost" onClick={() => toggleTag(questionData.id, questionData.batchId, 'bookmarked')} className={cn("btn-premium-label", currentQuestionFromBatch.tags.bookmarked && "underline !text-yellow-400")}>
                              Bookmark
                          </Button>
                          <Button variant="ghost" onClick={() => toggleTag(questionData.id, questionData.batchId, 'hard')} className={cn("btn-premium-label", currentQuestionFromBatch.tags.hard && "underline !text-red-500")}>
                              Mark as Hard
                          </Button>
                          <Button variant="ghost" onClick={() => toggleTag(questionData.id, questionData.batchId, 'revise')} className={cn("btn-premium-label", currentQuestionFromBatch.tags.revise && "underline !text-blue-400")}>
                              Revise Later
                          </Button>
                      </div>}
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-2 mb-4">
                      {questionData.options.map((option, i) => {
                          const isUserAnswer = userAnswer === option;
                          const isCorrectAnswer = questionData.answer === option;

                          return (
                          <div key={i} className={cn("p-3 border rounded-md flex items-center gap-3 text-sm", {
                            "bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300": isCorrectAnswer,
                            "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300": isUserAnswer && !isCorrect,
                            "bg-muted/50": !isCorrectAnswer && !(isUserAnswer && !isCorrect)
                          })}>
                              {isUserAnswer && (isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />)}
                              {!isUserAnswer && isCorrectAnswer && <CheckCircle size={16} className="opacity-50" />}
                              <span className={cn(isCorrectAnswer && "font-bold")}>{option}</span>
                          </div>
                          );
                      })}
                      </div>

                      <details className="mt-4 group" onToggle={() => toggleExplanation(questionData.id)}>
                          <summary className="cursor-pointer flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                              <p className="font-semibold text-foreground">Explanation</p>
                              <ChevronDown className={cn("transition-transform group-open:rotate-180", isExplanationOpen[questionData.id] && "rotate-180")} />
                          </summary>
                          <div className="mt-2 p-4 bg-muted/50 rounded-lg border">
                              <p className="text-muted-foreground">{questionData.explanation}</p>
                          </div>
                      </details>
                  </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Exam History</CardTitle>
        </CardHeader>
        <CardContent>
          <ExamHistoryTable />
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Button size="lg" asChild className="btn-gradient rounded-full">
          <Link to="/exams">Create Another Exam</Link>
        </Button>
      </div>
    </div>
  );
};

export default ExamResults;