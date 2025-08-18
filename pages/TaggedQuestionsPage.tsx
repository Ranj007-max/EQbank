import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Tag, MCQ } from '../types';
import { QuestionItem } from '../components/QuestionItem';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const tagConfig: { [key in Tag]: { label: string } } = {
  bookmarked: { label: 'Bookmarked' },
  hard: { label: 'Hard' },
  revise: { label: 'Revise' },
  mistaked: { label: 'Mistaked' },
  highYield: { label: 'High-Yield' },
  caseBased: { label: 'Case-Based' },
  pyq: { label: 'PYQ' },
};


const TaggedQuestionsPage: React.FC = () => {
  const { tag } = useParams<{ tag: Tag }>();
  const { batches } = useAnalytics();

  const questions: MCQ[] = useMemo(() => {
    if (!tag) return [];

    const allQuestions = batches.flatMap(b => b.questions);

    return allQuestions.filter(q => {
        if (tag === 'mistaked') {
            return q.lastAttemptCorrect === false;
        }
        return q.tags[tag];
    });
  }, [tag, batches]);

  const pageTitle = tag ? tagConfig[tag]?.label || tag : 'Tagged Questions';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link to="/bank">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-4xl font-bold tracking-tighter gradient-text">
          {pageTitle} Questions ({questions.length})
        </h1>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map(q => <QuestionItem key={q.id} question={q} />)}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">
          No questions found for the tag "{pageTitle}".
        </p>
      )}
    </div>
  );
};

export default TaggedQuestionsPage;
