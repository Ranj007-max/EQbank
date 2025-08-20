import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { useBatches } from '../context/BatchContext';
import { ChevronLeft, ChevronRight, LoaderCircle, Bookmark, Heart, RefreshCw } from 'lucide-react';
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

    // Allow changing answer, but give immediate feedback only once.
    if (userAnswers[currentQuestion.id] === null) {
        if (option === currentQuestion.answer) {
            setFeedback('correct');
            playCorrectSound();
        } else {
            setFeedback('incorrect');
        }
    }

    answerQuestion(currentQuestion.id, option);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const toggleTag = (tag: string) => {
    if (!currentQuestion) return;
    const currentTags = currentQuestion.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    updateQuestion(currentQuestion.batchId, currentQuestion.id, { tags: newTags });
    updateQuestionInSession(currentQuestion.id, { tags: newTags });
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
        <div className="font-bold text-lg text-primary">
          {`Q ${currentQuestionIndex + 1}/${totalQuestions}`}
        </div>
        <div className="font-mono text-2xl font-bold text-primary">{`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</div>
        <Button variant="destructive" onClick={() => setIsEndExamModalOpen(true)}>End Exam</Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main {...bind()} className="flex-1 flex flex-col items-center justify-center overflow-y-auto p-4 sm:p-6 touch-none">
          <div key={currentQuestion.id} className="animate-question-change w-full max-w-4xl">
            <Card>
              <CardContent className="p-6 md:p-8">
                <p className="text-xl md:text-2xl font-bold leading-relaxed">{currentQuestion.question}</p>
                {currentQuestion.imageURL && <img src={currentQuestion.imageURL} alt="Question illustration" className="mt-4 rounded-lg" />}
              </CardContent>
              <CardFooter className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, i) => (
                  <Button
                    key={i}
                    variant="neumorphic"
                    className="h-auto min-h-[4rem] text-left p-4 text-lg justify-start whitespace-normal"
                    onClick={() => handleSelectAnswer(option)}
                    isSelected={userAnswers[currentQuestion.id] === option}
                    isDestructive={userAnswers[currentQuestion.id] === option && option !== currentQuestion.answer}
                    aria-label={`Option ${String.fromCharCode(65 + i)}, ${option}${userAnswers[currentQuestion.id] === option ? ', Selected' : ''}`}
                  >
                    <span className="font-mono mr-4 opacity-70">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </Button>
                ))}
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
      </div>

      <footer className="h-20 border-t bg-card text-card-foreground flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="neumorphic"
            onClick={() => toggleTag('hard')}
            isSelected={(currentQuestion.tags || []).includes('hard')}
            className="flex items-center gap-2"
          >
            <Heart size={20} /> Hard
          </Button>
          <Button
            variant="neumorphic"
            onClick={() => toggleTag('revise')}
            isSelected={(currentQuestion.tags || []).includes('revise')}
            className="flex items-center gap-2"
          >
            <RefreshCw size={20} /> Revise
          </Button>
          <Button
            variant="neumorphic"
            onClick={() => toggleTag('bookmarked')}
            isSelected={(currentQuestion.tags || []).includes('bookmarked')}
            className="flex items-center gap-2"
          >
            <Bookmark size={20} className={(currentQuestion.tags || []).includes('bookmarked') ? 'text-yellow-400' : ''} /> Bookmark
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