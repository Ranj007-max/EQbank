import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { MCQ } from '../types';
import { CheckCircle, XCircle, Clock, Hash, Percent, Bookmark, Flame, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const ExamResults: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { getExamById, getBatchById, updateBatch } = useAnalytics();
  
  const examSession = useMemo(() => sessionId ? getExamById(sessionId) : undefined, [sessionId, getExamById]);

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

  const timeTakenFormatted = `${Math.floor(examSession.timeTaken / 60)}m ${examSession.timeTaken % 60}s`;

  const stats = [
    { label: 'Score', value: examSession.score, icon: Percent, color: 'text-primary' },
    { label: 'Accuracy', value: examSession.accuracy, icon: Hash, color: 'text-green-500' },
    { label: 'Time Taken', value: timeTakenFormatted, icon: Clock, color: 'text-amber-500' },
  ];

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <Card className="mb-8">
        <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold">Exam Results</CardTitle>
            <CardDescription>Review your performance for the session completed on {new Date(examSession.createdAt).toLocaleDateString()}.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                {stats.map(stat => (
                    <Card key={stat.label} className="bg-muted/50">
                        <CardContent className="p-6">
                            <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                            <p className="text-3xl font-bold text-foreground">{stat.value}{stat.label === 'Score' && '%'}</p>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CardContent>
      </Card>
      
      <h2 className="text-2xl font-bold text-foreground mb-4">Question Review</h2>
      <div className="space-y-6">
        {examSession.questions.map(({ questionData, userAnswer, isCorrect }, index) => {
          const currentBatch = getBatchById(questionData.batchId);
          const currentQuestionFromBatch = currentBatch?.questions.find(q => q.id === questionData.id);

          return (
            <Card key={questionData.id}>
                <CardHeader>
                    <p className="font-semibold text-foreground">{index + 1}. {questionData.question}</p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 mb-4">
                    {questionData.options.map((option, i) => {
                        const isUserAnswer = userAnswer === option;
                        const isCorrectAnswer = questionData.answer === option;
                        let optionClass = 'bg-muted/50 border-border';
                        if (isCorrectAnswer) {
                            optionClass = 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300 font-semibold';
                        }
                        if (isUserAnswer && !isCorrect) {
                            optionClass = 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300';
                        }
                        
                        return (
                        <div key={i} className={`p-3 border rounded-md transition-colors flex items-center gap-3 ${optionClass}`}>
                            {isUserAnswer && (isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />)}
                            <span className={isCorrectAnswer ? 'font-bold' : ''}>{option}</span>
                        </div>
                        );
                    })}
                    </div>

                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                        <p className="font-semibold text-foreground">Explanation:</p>
                        <p className="mt-1 text-muted-foreground">{questionData.explanation}</p>
                    </div>

                    {currentQuestionFromBatch && <div className="flex justify-end items-center gap-1 border-t pt-4 mt-4">
                        <Button variant="ghost" size="icon" onClick={() => toggleTag(questionData.id, questionData.batchId, 'bookmarked')}>
                            <Bookmark className={`transition-colors ${currentQuestionFromBatch.tags.bookmarked ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-500'}`}/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleTag(questionData.id, questionData.batchId, 'hard')}>
                            <Flame className={`transition-colors ${currentQuestionFromBatch.tags.hard ? 'text-red-500 fill-red-400' : 'text-muted-foreground hover:text-red-500'}`}/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleTag(questionData.id, questionData.batchId, 'revise')}>
                            <RefreshCw className={`transition-colors ${currentQuestionFromBatch.tags.revise ? 'text-blue-500 fill-blue-400' : 'text-muted-foreground hover:text-blue-500'}`}/>
                        </Button>
                    </div>}
                </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <Button size="lg" asChild>
          <Link to="/exams">Create Another Exam</Link>
        </Button>
      </div>
    </div>
  );
};

export default ExamResults;