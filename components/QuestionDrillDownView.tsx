import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { MCQ } from '../types';
import { QuestionItem } from './QuestionItem';

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
      
export default QuestionDrillDownView;
