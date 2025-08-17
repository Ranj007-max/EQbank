import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Bookmark, Flame, CheckCircle, XCircle, BrainCircuit, Notebook, Flag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';

const SrsReviewSession: React.FC = () => {
  const navigate = useNavigate();
  const { dueReviewQuestions, getBatchById, updateBatch, recordAnswer } = useAnalytics();
  
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [sessionEnded, setSessionEnded] = useState(false);

  const questions = useMemo(() => dueReviewQuestions, [dueReviewQuestions]);
  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  
  const handleSelectOption = (option: string) => {
    if (selectedOption) return; 

    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    
    const isCorrect = option === currentQuestion.answer;
    recordAnswer(currentQuestion.batchId, currentQuestion.id, isCorrect);
  };

  const toggleTag = (tag: 'bookmarked' | 'hard') => {
    if(!currentQuestion) return;
    const batch = getBatchById(currentQuestion.batchId);
    if (batch) {
      const updatedQuestions = batch.questions.map(q => 
        q.id === currentQuestion.id ? { ...q, tags: { ...q.tags, [tag]: !q.tags[tag] } } : q
      );
      updateBatch({ ...batch, questions: updatedQuestions });
    }
  };
  
  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setSessionEnded(true);
    }
  };

  if (!sessionStarted) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto text-center flex flex-col justify-center h-full">
        <Card className="p-8 sm:p-12">
            <BrainCircuit size={56} className="mx-auto text-primary mb-6" />
            <h1 className="text-3xl font-extrabold tracking-tight gradient-text mb-4">Spaced Repetition</h1>
            {questions.length > 0 ? (
            <>
                <p className="text-muted-foreground mb-8 text-lg">You have <span className="font-bold text-primary">{questions.length}</span> questions due for review.</p>
                <Button onClick={() => setSessionStarted(true)} size="lg" variant="gradient">Start Review Session</Button>
            </>
            ) : (
            <>
                <p className="text-muted-foreground mb-8 text-lg">You have no questions due for review. Great job!</p>
                <Button onClick={() => navigate('/')} variant="outline">Back to Dashboard</Button>
            </>
            )}
        </Card>
      </div>
    );
  }

  if (sessionEnded) {
    return (
        <div className="animate-fade-in max-w-2xl mx-auto text-center flex flex-col justify-center h-full">
            <Card className="p-8 sm:p-12">
                <CheckCircle size={56} className="mx-auto text-green-500 mb-6" />
                <h1 className="text-3xl font-extrabold tracking-tight gradient-text text-center">Review Complete!</h1>
                <p className="text-muted-foreground my-6 text-lg">You've finished all your due questions for now. Keep up the great work!</p>
                <Button onClick={() => navigate('/')} size="lg" variant="gradient">Back to Dashboard</Button>
            </Card>
        </div>
    );
  }

  if (!currentQuestion) {
      // Should not happen if sessionStarted is true and questions.length > 0
      return (
        <div className="animate-fade-in max-w-2xl mx-auto text-center">
             <p className="text-muted-foreground mb-8">Loading question...</p>
        </div>
      )
  }

  const batchForTags = getBatchById(currentQuestion.batchId);
  const questionForTags = batchForTags?.questions.find(q => q.id === currentQuestion.id);
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
       <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-muted-foreground">Reviewing Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <Progress value={progressPercentage} className="[&>*]:bg-green-500" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-6">
            <p className="font-semibold text-xl text-foreground leading-relaxed">{currentQuestion.question}</p>
        </CardHeader>
        <CardContent className="p-6">
            <div className="space-y-3">
            {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === option;
                const isCorrect = currentQuestion.answer === option;
                let variant: "outline" | "success" | "destructive" = "outline";
                let icon = null;
                if(selectedOption) {
                    if (isCorrect) {
                      variant = "success";
                      icon = <CheckCircle className="mr-2" />;
                    }
                    else if (isSelected && !isCorrect) {
                      variant = "destructive";
                      icon = <XCircle className="mr-2" />;
                    }
                }
                
                return (
                <Button key={i} onClick={() => handleSelectOption(option)} disabled={!!selectedOption} variant={variant} className={cn("w-full justify-start h-auto py-3 whitespace-normal text-base", {
                    "border-primary ring-2 ring-primary": isSelected && !selectedOption,
                })}>
                    {icon}
                    <span className="font-mono text-sm mr-4 opacity-70">{String.fromCharCode(65 + i)}.</span>
                    <span className="text-left">{option}</span>
                </Button>
                );
            })}
            </div>
             {selectedOption && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border animate-fade-in">
                    <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={20} />
                      Explanation
                    </p>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                      {currentQuestion.explanation}
                    </div>
                </div>
                )}
        </CardContent>
        <CardFooter className="bg-muted/30 border-t px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-1">
            {questionForTags && <>
              <Button variant="ghost" size="icon" onClick={() => toggleTag('bookmarked')} title="Bookmark">
                  <Bookmark className={`transition-colors ${questionForTags.tags.bookmarked ? 'text-yellow-400 fill-yellow-400/50' : 'text-muted-foreground hover:text-yellow-400'}`}/>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => toggleTag('hard')} title="Mark as Hard">
                  <Flame className={`transition-colors ${questionForTags.tags.hard ? 'text-red-500 fill-red-500/50' : 'text-muted-foreground hover:text-red-500'}`}/>
              </Button>
            </>}
            <Button variant="ghost" size="icon" title="Notes (coming soon)" disabled>
                <Notebook className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" title="Report Issue (coming soon)" disabled>
                <Flag className="text-muted-foreground" />
            </Button>
          </div>
          {selectedOption && (
            <Button onClick={goToNext} variant="gradient">
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Review'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SrsReviewSession;