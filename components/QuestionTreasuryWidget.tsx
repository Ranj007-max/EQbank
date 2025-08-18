
import { Database, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { MCQ } from '../types';
import { Badge } from './ui/badge';

interface QuestionTreasuryWidgetProps {
  questions: MCQ[];
}

const QuestionCard: React.FC<{ question: MCQ, index: number }> = ({ question, index }) => {
    return (
        <details className="group bg-card border rounded-lg overflow-hidden">
            <summary className="p-4 cursor-pointer flex justify-between items-center hover:bg-muted/50">
                <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm">{index + 1}.</span>
                    <p className="font-semibold flex-1">{question.question}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={question.difficulty === 'Hard' ? 'destructive' : question.difficulty === 'Medium' ? 'secondary' : 'outline'}>
                        {question.difficulty}
                    </Badge>
                    <ChevronDown className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
                </div>
            </summary>
            <div className="p-4 border-t bg-muted/20">
                <div className="space-y-2 mb-4">
                    {question.options.map((option, i) => (
                        <div key={i} className={cn("p-3 border rounded-md text-sm",
                            option === question.answer
                            ? 'bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300 font-semibold'
                            : 'bg-card'
                        )}>
                        {String.fromCharCode(65 + i)}. {option}
                        </div>
                    ))}
                </div>
                <div className="mt-4 p-4 bg-background rounded-lg border">
                    <p className="font-semibold text-foreground">Explanation:</p>
                    <p className="mt-1 text-muted-foreground text-sm">{question.explanation}</p>
                </div>
            </div>
        </details>
    )
}

export const QuestionTreasuryWidget: React.FC<QuestionTreasuryWidgetProps> = ({ questions }) => {
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Database size={48} className="mx-auto mb-4" />
        <h3 className="text-xl font-semibold">No Questions Found</h3>
        <p>Try adjusting your filters or importing more questions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
        ))}
    </div>
  );
};
