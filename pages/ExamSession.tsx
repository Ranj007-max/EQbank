import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAnalytics } from '../context/AnalyticsContext';
import type { ExamQuestion, ExamSession } from '../types';
import { ChevronLeft, ChevronRight, Flag, Power, LoaderCircle } from 'lucide-react';
import Timer from '../components/Timer';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { cn } from '../lib/utils';

interface SessionState {
  questions: ExamQuestion[];
  config: ExamSession['config'];
  answers: Record<string, string>;
  markedForReview: string[];
  visited: string[];
  startTime: number;
}

const ExamSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addExamSession, recordMultipleAnswers } = useAnalytics();
  
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const savedSession = sessionStorage.getItem('examSession');
    const savedIndex = sessionStorage.getItem('examSessionIndex');

    if (location.state?.questions) {
      const initialState: SessionState = {
        questions: location.state.questions,
        config: location.state.config,
        answers: {},
        markedForReview: [],
        visited: [location.state.questions[0]?.id],
        startTime: Date.now(),
      };
      setSessionState(initialState);
      setCurrentIndex(0);
    } else if (savedSession) {
      try {
        setSessionState(JSON.parse(savedSession));
        if (savedIndex) setCurrentIndex(Number(savedIndex));
      } catch (e) {
        console.error("Failed to parse saved exam session:", e);
        sessionStorage.clear();
        navigate('/exams');
      }
    } else {
      navigate('/exams');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (sessionState) {
      sessionStorage.setItem('examSession', JSON.stringify(sessionState));
    }
  }, [sessionState]);

  useEffect(() => {
    sessionStorage.setItem('examSessionIndex', String(currentIndex));
  }, [currentIndex]);
  
  const currentQuestion = sessionState?.questions[currentIndex];

  const handleEndExam = () => {
    if (!sessionState) return;
    if (!window.confirm('Are you sure you want to end the exam? This action cannot be undone.')) return;
    
    const { questions, config, answers, startTime } = sessionState;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correctAnswers = questions.filter(q => answers[q.id] === q.answer);
    
    const answeredQuestions = questions
      .filter(q => answers[q.id] !== undefined)
      .map(q => ({ batchId: q.batchId, questionId: q.id, isCorrect: answers[q.id] === q.answer }));
    
    if (answeredQuestions.length > 0) recordMultipleAnswers(answeredQuestions);
    
    const session: ExamSession = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      timeTaken,
      config,
      questions: questions.map(q => ({ questionData: q, userAnswer: answers[q.id] || null, isCorrect: answers[q.id] === q.answer })),
      score: Math.round((correctAnswers.length / questions.length) * 100),
      accuracy: `${correctAnswers.length}/${questions.length}`,
      correctAnswers: correctAnswers.length,
      totalQuestions: questions.length,
    };

    addExamSession(session);
    sessionStorage.removeItem('examSession');
    sessionStorage.removeItem('examSessionIndex');
    navigate(`/exam/results/${session.id}`);
  };

  const changeQuestion = (index: number) => {
    if (sessionState && index >= 0 && index < sessionState.questions.length) {
      setCurrentIndex(index);
      const newQuestionId = sessionState.questions[index].id;
      if (!sessionState.visited.includes(newQuestionId)) {
        setSessionState(prev => prev ? { ...prev, visited: [...prev.visited, newQuestionId] } : null);
      }
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion) return;
    setSessionState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQuestion.id]: option } } : null);
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    setSessionState(prev => {
        if (!prev) return null;
        const isMarked = prev.markedForReview.includes(currentQuestion.id);
        const newMarked = isMarked 
            ? prev.markedForReview.filter(id => id !== currentQuestion.id)
            : [...prev.markedForReview, currentQuestion.id];
        return { ...prev, markedForReview: newMarked };
    });
  };
  
  if (!sessionState || !currentQuestion) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoaderCircle className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const isLastQuestion = currentIndex === sessionState.questions.length - 1;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex-row justify-between items-center border-b p-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Question {currentIndex + 1}</h2>
            <p className="text-sm text-muted-foreground">{currentQuestion.subject} | {currentQuestion.platform}</p>
          </div>
          <Timer initialSeconds={(sessionState.config.durationMinutes * 60) - Math.floor((Date.now() - sessionState.startTime)/1000)} onTimeUp={handleEndExam} isPaused={false} />
        </CardHeader>
        
        <CardContent className="flex-grow overflow-y-auto p-6">
            <p className="text-lg font-semibold text-foreground mb-6 leading-relaxed">{currentQuestion.question}</p>
            <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
                <label key={i} className={cn('p-3 border rounded-lg transition-all flex items-center gap-4 cursor-pointer', sessionState.answers[currentQuestion.id] === option ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'bg-muted/30 border-border hover:border-primary/50')}>
                    <input type="radio" name={`q_${currentQuestion.id}`} value={option} checked={sessionState.answers[currentQuestion.id] === option} onChange={() => handleSelectAnswer(option)} className="h-5 w-5 accent-primary" />
                    <span className="font-medium text-base">{option}</span>
                </label>
            ))}
            </div>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center border-t p-3 bg-muted/30">
          <Button onClick={toggleMarkForReview} variant={sessionState.markedForReview.includes(currentQuestion.id) ? 'warning' : 'outline'}>
            <Flag size={18} className="mr-2"/>
            {sessionState.markedForReview.includes(currentQuestion.id) ? 'Marked' : 'Mark for Review'}
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => changeQuestion(currentIndex - 1)} disabled={currentIndex === 0} variant="outline">
              <ChevronLeft size={20} className="mr-2" /> Previous
            </Button>
            <Button onClick={() => isLastQuestion ? handleEndExam() : changeQuestion(currentIndex + 1)} variant={isLastQuestion ? 'gradient' : 'default'}>
              {isLastQuestion ? 'Finish & Submit' : 'Save & Next'} <ChevronRight size={20} className="ml-2" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card className="w-full lg:w-72 flex-shrink-0 p-4 flex flex-col">
        <h3 className="font-bold text-foreground mb-3 text-center">Question Palette</h3>
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-5 gap-2 flex-grow overflow-y-auto content-start">
          {sessionState.questions.map((q, index) => {
            const isMarked = sessionState.markedForReview.includes(q.id);
            const isAnswered = sessionState.answers[q.id] !== undefined;
            const isCurrent = index === currentIndex;
            
            let variant: "success" | "warning" | "default" | "outline" = 'outline';
            if (isAnswered) variant = 'success';
            if (isMarked) variant = 'warning';
            if (!isAnswered && !isMarked && sessionState.visited.includes(q.id)) variant = 'default';

            return (
              <Button key={q.id} onClick={() => changeQuestion(index)} variant={variant} size="icon" className={cn("h-10 w-10", isCurrent && 'ring-2 ring-ring ring-offset-2 ring-offset-background')}>
                {index + 1}
              </Button>
            );
          })}
        </div>
        <Button onClick={handleEndExam} variant="destructive" className="w-full mt-4">
          <Power size={18} className="mr-2"/> End Exam
        </Button>
      </Card>
    </div>
  );
};

export default ExamSession;