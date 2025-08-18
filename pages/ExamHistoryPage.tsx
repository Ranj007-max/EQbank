import { ExamHistoryTable } from '../components/ExamHistoryTable';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ExamHistoryPage = () => {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-8">
        <Button variant="ghost" asChild className="flex items-center gap-2 text-sm pl-0 mb-4">
            <Link to="/review">
                <ArrowLeft size={16} />
                Back to Review Hub
            </Link>
        </Button>
      <h1 className="text-4xl font-bold gradient-text">Full Exam History</h1>
      <ExamHistoryTable />
    </div>
  );
};

export default ExamHistoryPage;
