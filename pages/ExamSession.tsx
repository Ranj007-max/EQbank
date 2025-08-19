import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { useBatches } from '../context/BatchContext';
import type { MCQ } from '../types';
import { ChevronLeft, ChevronRight, LoaderCircle, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { useSound } from '../hooks/useSound';
import Confetti from '../components/Confetti';
import ConfirmationModal from '../components/ConfirmationModal';
import { useDrag } from '@use-gesture/react';

const ExamSession: React.FC = () => {
  const navigate = useNavigate();
  const {
    isExamActive,
    examSession,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    userAnswers,
    timeRemaining,
    answerQuestion,
    setCurrentQuestionIndex,
    endExam,
    updateQuestionInSession,
  } = useExam();

  const { updateQuestion } = useBatches();
  
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isEndExamModalOpen, setIsEndExamModalOpen] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const playCorrectSound = useSound('/sounds/correct-ding.mp3');

  useEffect(() => {
    if (!isExamActive) {
      navigate('/exams', { replace: true });
    }
  }, [isExamActive, navigate]);

  useEffect(() => {
    setFeedback(null);
  }, [currentQuestionIndex]);

  const bind = useDrag(({ down, movement: [mx], direction: [xDir], cancel }) => {
    if (down && Math.abs(mx) > window.innerWidth / 4) {
      cancel();
      if (xDir > 0) {
        changeQuestion(currentQuestionIndex - 1);
      } else {
        changeQuestion(currentQuestionIndex + 1);
      }
    }
  });

  const changeQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion) return;
    const isAlreadyAnswered = userAnswers[currentQuestion.id] !== null;
    if (isAlreadyAnswered) return;

    answerQuestion(currentQuestion.id, option);
    if (navigator.vibrate) navigator.vibrate(10);

    if (option === currentQuestion.answer) {
      setFeedback('correct');
      playCorrectSound();
    } else {
      setFeedback('incorrect');
    }
  };

  const toggleTag = (tag: keyof MCQ['tags']) => {
    if (!currentQuestion) return;
    const newTags = { ...currentQuestion.tags, [tag]: !currentQuestion.tags?.[tag] };
    updateQuestion(currentQuestion.batchId, currentQuestion.id, {
      tags: newTags,
    });
    updateQuestionInSession(currentQuestion.id, { tags: newTags });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  if (!isExamActive || !currentQuestion || !examSession) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderCircle className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isAnswered = userAnswers[currentQuestion.id] !== null;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {feedback === 'correct' && <Confetti />}

      <header className="h-16 border-b bg-card text-card-foreground flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg text-primary">
            {`Q ${currentQuestionIndex + 1}/${totalQuestions}`}
          </span>
        </div>
        <div className="font-mono text-2xl font-bold text-primary">{`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={() => setIsEndExamModalOpen(true)}>End Exam</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main {...bind()} className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-4 sm:p-6 touch-none">
          <div key={currentQuestion.id} className="animate-question-change w-full max-w-4xl">
            <Card>
              <CardContent className="p-6 md:p-8">
                <p className="text-xl md:text-2xl font-bold leading-relaxed">{currentQuestion.question}</p>
                {currentQuestion.imageURL && <img src={currentQuestion.imageURL} alt="Question illustration" className="mt-4 rounded-lg" />}
              </CardContent>
              <CardFooter className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = userAnswers[currentQuestion.id] === option;
                  return (
                    <Button
                      key={i}
                      variant={isSelected ? 'default' : 'outline'}
                      className="h-auto min-h-[4rem] text-left p-4 text-lg justify-start whitespace-normal"
                      onClick={() => handleSelectAnswer(option)}
                      disabled={isAnswered}
                    >
                      <span className="font-mono mr-4 opacity-70">{String.fromCharCode(65 + i)}.</span>
                      {option}
                    </Button>
                  );
                })}
              </CardFooter>
            </Card>
          </div>
           <div className="w-full max-w-4xl mt-4">
             <p className="text-sm text-muted-foreground">
               <span className="font-bold">Explanation: </span>
               {isAnswered ? currentQuestion.explanation : 'Answer the question to see the explanation.'}
             </p>
           </div>
        </main>

        <aside className="w-96 border-l bg-card text-card-foreground p-4 flex flex-col shrink-0">
          <h3 className="font-bold text-lg mb-4">Review Panel</h3>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
              {examSession.questions.map((q, index) => {
                const status = userAnswers[q.questionData.id] === null
                  ? 'unanswered'
                  : userAnswers[q.questionData.id] === q.questionData.answer
                    ? 'correct'
                    : 'incorrect';

                return (
                  <Button
                    key={q.questionData.id}
                    variant={
                      currentQuestionIndex === index ? 'default' :
                      status === 'unanswered' ? 'outline' : 'secondary'
                    }
                    className={`h-12 w-12 relative ${markedForReview.includes(q.questionData.id) ? 'ring-2 ring-yellow-500' : ''}`}
                    onClick={() => changeQuestion(index)}
                  >
                    {index + 1}
                    {status !== 'unanswered' && (
                      <div className="absolute -top-1 -right-1">
                        {status === 'correct' ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">Marked for Review</h4>
              {markedForReview.length > 0 ? (
                <ul className="space-y-2">
                  {markedForReview.map(qid => {
                    const qIndex = examSession.questions.findIndex(q => q.questionData.id === qid);
                    return (
                      <li key={qid} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                        Question {qIndex + 1}
                        <Button variant="ghost" size="sm" onClick={() => changeQuestion(qIndex)}>Go to</Button>
                      </li>
                    )
                  })}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No questions marked for review.</p>}
            </div>
          </div>
        </aside>
      </div>

      <footer className="h-16 border-t bg-card text-card-foreground flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => toggleTag('revise')}>Revise Later</Button>
          <Button variant="ghost" onClick={() => toggleTag('hard')}>Mark as Hard</Button>
          <Button variant={currentQuestion.tags?.bookmarked ? 'secondary' : 'ghost'} onClick={() => toggleTag('bookmarked')}>Bookmark</Button>
          <Button variant={markedForReview.includes(currentQuestion.id) ? "secondary" : "ghost"} onClick={() => toggleMarkForReview(currentQuestion.id)}>
            Mark for Review
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => changeQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}>
            <ChevronLeft size={20} className="mr-2" /> Prev
          </Button>
          <Button onClick={() => changeQuestion(currentQuestionIndex + 1)} disabled={isLastQuestion}>
            Next <ChevronRight size={20} className="ml-2" />
          </Button>
        </div>
      </footer>

      <ConfirmationModal
        isOpen={isEndExamModalOpen}
        onClose={() => setIsEndExamModalOpen(false)}
        onConfirm={endExam}
        title="End Exam"
        description="Are you sure you want to end the exam? Your session will be saved and scored."
      />
    </div>
  );
};

export default ExamSession;