import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { useBatches } from '../context/BatchContext';
import { CheckCircle, XCircle, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';
import { MCQ } from '../types';

const StudySession: React.FC = () => {
  const navigate = useNavigate();
  const { isStudying, studyQuestions, recordAnswer, endStudySession, getResults } = useStudy();
  const { updateQuestion } = useBatches();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isStudying) {
      navigate('/bank', { replace: true });
    }
  }, [isStudying, navigate]);

  const currentQuestion = studyQuestions[currentQuestionIndex];
  const selectedOption = currentQuestion ? answeredQuestions[currentQuestion.id] : undefined;

  const handleSelectOption = (option: string) => {
    if (selectedOption || !currentQuestion) return;

    const isCorrect = option === currentQuestion.answer;
    recordAnswer(currentQuestion.id, currentQuestion.batchId, isCorrect);
    if (navigator.vibrate) navigator.vibrate(10);
    setAnsweredQuestions(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const toggleTag = (tag: keyof MCQ['tags']) => {
    if (!currentQuestion) return;
    updateQuestion(currentQuestion.batchId, currentQuestion.id, {
      tags: { ...currentQuestion.tags, [tag]: !currentQuestion.tags[tag] },
    });
  };

  const goToNext = () => {
    if (currentQuestionIndex < studyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      endStudySession();
    }
  };

  if (!isStudying || !currentQuestion) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoaderCircle className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / studyQuestions.length) * 100;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-muted-foreground">Question {currentQuestionIndex + 1} of {studyQuestions.length}</p>
            <Button variant="link" size="sm" className="text-destructive" onClick={endStudySession}>End Session</Button>
        </div>
        <Progress value={progressPercentage} />
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
                <Button key={i} onClick={() => handleSelectOption(option)} disabled={!!selectedOption} variant={variant} className={cn("w-full justify-start h-auto py-3 whitespace-normal text-base")}>
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => toggleTag('bookmarked')} className={cn("btn-premium-label", currentQuestion.tags.bookmarked && "underline !text-yellow-400")}>Bookmark</Button>
            <Button variant="ghost" onClick={() => toggleTag('hard')} className={cn("btn-premium-label", currentQuestion.tags.hard && "underline !text-red-500")}>Mark as Hard</Button>
            <Button variant="ghost" onClick={() => toggleTag('revise')} className={cn("btn-premium-label", currentQuestion.tags.revise && "underline !text-blue-400")}>Revise</Button>
          </div>
          {selectedOption && (
            <Button onClick={goToNext} variant="gradient">
              {currentQuestionIndex < studyQuestions.length - 1 ? 'Next Question' : 'Finish Session'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default StudySession;