import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Bookmark, Flame, RefreshCw, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
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

  const toggleTag = (tag: 'bookmarked' | 'hard' | 'revise') => {
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
      <div className="animate-fade-in max-w-2xl mx-auto text-center">
        <Card className="p-12">
            <BrainCircuit size={64} className="mx-auto text-primary mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Spaced Repetition Review</h1>
            {questions.length > 0 ? (
            <>
                <p className="text-muted-foreground mb-8">You have <span className="font-bold text-primary">{questions.length}</span> questions due for review. This will help strengthen your memory.</p>
                <Button onClick={() => setSessionStarted(true)} size="lg">Start Review Session</Button>
            </>
            ) : (
            <>
                <p className="text-muted-foreground mb-8">You have no questions due for review right now. Great job! Come back later.</p>
                <Button onClick={() => navigate('/')} variant="secondary">Back to Dashboard</Button>
            </>
            )}
        </Card>
      </div>
    );
  }

  if (sessionEnded) {
    return (
        <div className="animate-fade-in max-w-2xl mx-auto text-center">
            <Card className="p-12">
                <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
                <h1 className="text-3xl font-bold text-foreground text-center">Review Complete!</h1>
                <p className="text-muted-foreground my-4">You've finished all your due questions for now. Keep up the great work!</p>
                <Button onClick={() => navigate('/')} size="lg" className="mt-4">Back to Dashboard</Button>
            </Card>
        </div>
    );
  }

  const batchForTags = getBatchById(currentQuestion.batchId);
  const questionForTags = batchForTags?.questions.find(q => q.id === currentQuestion.id);
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-4">
         <Progress value={progressPercentage} className="[&>*]:bg-green-500" />
        <p className="text-sm font-medium text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </div>

       <Card>
        <CardHeader>
            <p className="font-semibold text-lg text-foreground">{currentQuestion.question}</p>
        </CardHeader>
        <CardContent>
            <div className="space-y-3 mb-4">
            {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === option;
                const isCorrect = currentQuestion.answer === option;
                let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                if(selectedOption) {
                    if (isCorrect) variant = "default";
                    else if (isSelected) variant = "destructive";
                }
                
                return (
                <Button key={i} onClick={() => handleSelectOption(option)} disabled={!!selectedOption} variant={variant} className={cn("w-full justify-start h-auto py-3 whitespace-normal", {
                    "bg-green-600 hover:bg-green-700 text-primary-foreground": selectedOption && isCorrect,
                })}>
                    <span className="font-mono text-sm mr-3">{String.fromCharCode(65 + i)}.</span>
                    <span>{option}</span>
                </Button>
                );
            })}
            </div>
             {selectedOption && (
                <div className="mt-6 p-4 bg-muted rounded-lg border animate-fade-in">
                    <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    {selectedOption === currentQuestion.answer 
                        ? <CheckCircle className="text-green-500" size={20} /> 
                        : <XCircle className="text-red-500" size={20} />}
                    Explanation
                    </p>
                    <p className="text-muted-foreground">{currentQuestion.explanation}</p>
                </div>
                )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          {questionForTags ? <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" onClick={() => toggleTag('bookmarked')}>
                <Bookmark className={`transition-colors ${questionForTags.tags.bookmarked ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-500'}`}/>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toggleTag('hard')}>
                <Flame className={`transition-colors ${questionForTags.tags.hard ? 'text-red-500 fill-red-400' : 'text-muted-foreground hover:text-red-500'}`}/>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toggleTag('revise')}>
                <RefreshCw className={`transition-colors ${questionForTags.tags.revise ? 'text-blue-500 fill-blue-400' : 'text-muted-foreground hover:text-blue-500'}`}/>
            </Button>
          </div> : <div />}
          {selectedOption && (
            <Button onClick={goToNext}>
              {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish Review'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SrsReviewSession;