import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Eye, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { MCQ } from '../types';

interface QuestionDrillDownViewProps {
  trigger: React.ReactNode;
  title: string;
  questions: MCQ[];
}

const QuestionDrillDownView: React.FC<QuestionDrillDownViewProps> = ({ trigger, title, questions }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col glass-card">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold gradient-text">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
            {questions && questions.length > 0 ? (
                questions.map(q => <QuestionItem key={q.id} question={q} />)
            ) : (
                <p className="text-muted-foreground text-center py-10">No questions found for this selection.</p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface QuestionItemProps {
  question: MCQ;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div className="p-4 rounded-lg bg-card border border-border/20 space-y-4">
            <p className="font-semibold text-lg">{question.question}</p>
            {!isRevealed && (
                <Button onClick={() => setIsRevealed(true)} className="neumorphic-button">
                    <Eye className="mr-2 h-4 w-4" />
                    Reveal Answer
                </Button>
            )}
            {isRevealed && (
                <div className="space-y-2 animate-fade-in">
                    {question.options.map((option: string, i: number) => (
                        <div key={i} className={cn("p-3 border rounded-md text-sm",
                            option === question.answer
                            ? 'bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300 font-semibold'
                            : 'bg-card'
                        )}>
                        {String.fromCharCode(65 + i)}. {option}
                        </div>
                    ))}
                    <div className="mt-4 p-4 bg-background rounded-lg border">
                        <p className="font-semibold text-foreground">Explanation:</p>
                        <p className="mt-1 text-muted-foreground text-sm">{question.explanation}</p>
                    </div>
                     <div className="flex items-center gap-4 pt-2">
                        <Button variant="outline" size="sm">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Add to Study Session
                        </Button>
                     </div>
                </div>
            )}
        </div>
    )
}

export default QuestionDrillDownView;
