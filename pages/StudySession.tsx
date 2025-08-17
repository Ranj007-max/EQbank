import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAnalytics } from '../context/AnalyticsContext';
import { StudyQuestion, StudySessionResult } from '../types';
import { Bookmark, Flame, RefreshCw, CheckCircle, XCircle, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';

type SessionState = {
    questions: StudyQuestion[];
    config: StudySessionResult['config'];
};

const StudySession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getBatchById, updateBatch, addStudySession, recordAnswer } = useAnalytics();

  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    const savedSession = sessionStorage.getItem('studySession');
    const savedAnswers = sessionStorage.getItem('studySessionAnswers');
    const savedIndex = sessionStorage.getItem('studySessionIndex');

    if (location.state) {
      const data = location.state as SessionState;
      sessionStorage.setItem('studySession', JSON.stringify(data));
      sessionStorage.removeItem('studySessionAnswers');
      sessionStorage.removeItem('studySessionIndex');
      setSessionState(data);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
    } else if (savedSession) {
      try {
        setSessionState(JSON.parse(savedSession));
        if (savedAnswers) setSelectedAnswers(JSON.parse(savedAnswers));
        if (savedIndex) setCurrentQuestionIndex(Number(savedIndex));
      } catch (e) {
        console.error("Failed to parse saved study session:", e);
        sessionStorage.removeItem('studySession');
        sessionStorage.removeItem('studySessionAnswers');
        sessionStorage.removeItem('studySessionIndex');
        navigate('/bank');
      }
    } else {
      navigate('/bank');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    sessionStorage.setItem('studySessionAnswers', JSON.stringify(selectedAnswers));
  }, [selectedAnswers]);

  useEffect(() => {
    sessionStorage.setItem('studySessionIndex', String(currentQuestionIndex));
  }, [currentQuestionIndex]);

  const currentQuestion = sessionState?.questions[currentQuestionIndex];
  const selectedOption = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;

  const handleSelectOption = (option: string) => {
    if (selectedOption || !currentQuestion) return;

    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    
    const isCorrect = option === currentQuestion.answer;
    recordAnswer(currentQuestion.batchId, currentQuestion.id, isCorrect);
  };

  const toggleTag = (tag: 'bookmarked' | 'hard' | 'revise') => {
    if (!currentQuestion) return;
    const batch = getBatchById(currentQuestion.batchId);
    if (batch) {
        const updatedQuestions = batch.questions.map(q => 
            q.id === currentQuestion.id ? { ...q, tags: { ...q.tags, [tag]: !q.tags[tag] } } : q
        );
        updateBatch({ ...batch, questions: updatedQuestions });
    }
  };
  
  const goToNext = () => {
    if (sessionState && currentQuestionIndex < sessionState.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      endSession();
    }
  };

  const endSession = () => {
    if (!sessionState) return;
    const { questions, config } = sessionState;
    const correctAnswers = questions.filter(q => selectedAnswers[q.id] === q.answer).length;
    const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    
    const sessionResult: StudySessionResult = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        score,
        accuracy: `${correctAnswers}/${questions.length}`,
        config,
    };
    addStudySession(sessionResult);
    
    sessionStorage.removeItem('studySession');
    sessionStorage.removeItem('studySessionAnswers');
    sessionStorage.removeItem('studySessionIndex');

    setSessionEnded(true);
  };
  
  const sessionStats = useMemo(() => {
    if (!sessionEnded || !sessionState) return null;
    const { questions } = sessionState;
    const correctCount = questions.reduce((acc, q) => selectedAnswers[q.id] === q.answer ? acc + 1 : acc, 0);
    const incorrectCount = questions.length - correctCount;
    const score = Math.round((correctCount / questions.length) * 100);
    return { correctCount, incorrectCount, score };
  }, [sessionEnded, sessionState, selectedAnswers]);

  if (sessionEnded) {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <Card className="p-8">
                <CardHeader>
                    <h1 className="text-3xl font-bold text-foreground text-center">Session Complete!</h1>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-around items-center my-8 p-6 bg-muted rounded-lg">
                        <div className="text-center">
                            <p className="text-4xl font-bold text-primary">{sessionStats?.score}%</p>
                            <p className="text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold text-green-500">{sessionStats?.correctCount}</p>
                            <p className="text-muted-foreground">Correct</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-bold text-red-500">{sessionStats?.incorrectCount}</p>
                            <p className="text-muted-foreground">Incorrect</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="text-center flex justify-center">
                    <Button onClick={() => navigate('/bank')} size="lg">
                        Back to Bank
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!sessionState || !currentQuestion) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoaderCircle className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const batchForTags = getBatchById(currentQuestion.batchId);
  const questionForTags = batchForTags?.questions.find(q => q.id === currentQuestion.id);
  const progressPercentage = ((currentQuestionIndex + 1) / sessionState.questions.length) * 100;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-muted-foreground">Question {currentQuestionIndex + 1} of {sessionState.questions.length}</p>
            <Button variant="link" className="text-destructive" onClick={endSession}>End Session</Button>
        </div>
        <Progress value={progressPercentage} />
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
                    else if (isSelected && !isCorrect) variant = "destructive";
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
              {currentQuestionIndex < sessionState.questions.length - 1 ? 'Next Question' : 'Finish Session'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default StudySession;