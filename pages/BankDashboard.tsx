import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { PlusCircle, Zap, BrainCircuit } from 'lucide-react';

import StudyPanel from '../components/StudyPanel';
import { GoalTrackerWidget } from '../components/GoalTrackerWidget';
import { TopicsToWatchWidget } from '../components/TopicsToWatchWidget';
import { TagStatsWidget } from '../components/TagStatsWidget';
import { QuestionTreasuryWidget } from '../components/QuestionTreasuryWidget';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const BankDashboard: React.FC = () => {
  const { 
    topicsToWatch,
    tagStats,
    statsByPlatform,
    statsBySubject,
    statsByChapter
  } = useAnalytics();
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <StudyPanel isOpen={isPanelOpen} onOpenChange={setIsPanelOpen} />
      
      <div className="animate-fade-in space-y-12">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-bold tracking-tighter gradient-text">
              Question Bank
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl">
              Your central hub for managing, reviewing, and mastering questions. Analyze your performance and dive into targeted study sessions.
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <Button variant="outline" asChild className="glass-card">
              <Link to="/bank/add">
                <PlusCircle size={18} className="mr-2" />
                Add Questions
              </Link>
            </Button>
            <Button onClick={() => setIsPanelOpen(true)} className="btn-gradient">
              <Zap size={18} className="mr-2" />
              Start Study Session
            </Button>
          </div>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <QuestionTreasuryWidget
                statsByPlatform={statsByPlatform}
                statsBySubject={statsBySubject}
                statsByChapter={statsByChapter}
              />
          </div>

          <div className="space-y-8">
            <GoalTrackerWidget />
            <TagStatsWidget stats={tagStats} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TopicsToWatchWidget topics={topicsToWatch} />
          {/* Consider replacing this with a different widget for variety */}
          <div className={cn("glass-card", "p-6 rounded-lg")}>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <BrainCircuit size={22} className="mr-3 text-secondary" />
              Coming Soon
            </h3>
            <p className="text-muted-foreground">
              More advanced analytics and visualizations will be available here to further enhance your study patterns.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BankDashboard;
