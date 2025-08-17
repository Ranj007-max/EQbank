import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { PlusCircle, Zap } from 'lucide-react';

import StudyPanel from '../components/StudyPanel';
import { PerformanceCharts } from '../components/PerformanceCharts';
import { GoalTrackerWidget } from '../components/GoalTrackerWidget';
import { TopicsToWatchWidget } from '../components/TopicsToWatchWidget';
import { TagStatsWidget } from '../components/TagStatsWidget';

import { Button } from '../components/ui/button';

const BankDashboard: React.FC = () => {
  const { 
    topicsToWatch,
    performanceOverTime,
    performanceBySubject,
    tagStats
  } = useAnalytics();
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <StudyPanel isOpen={isPanelOpen} onOpenChange={setIsPanelOpen} />
      
      <div className="animate-fade-in space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-base">
              Welcome back! Here's a snapshot of your progress.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/bank/add">
                <PlusCircle size={18} className="mr-2" />
                Add Questions
              </Link>
            </Button>
            <Button onClick={() => setIsPanelOpen(true)} variant="gradient">
              <Zap size={18} className="mr-2" />
              Start Study Session
            </Button>
          </div>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column for charts */}
          <div className="lg:col-span-2">
             <PerformanceCharts timeData={performanceOverTime} subjectData={performanceBySubject} />
          </div>

          {/* Right sidebar for smaller widgets */}
          <div className="space-y-6">
            <GoalTrackerWidget />
            <TagStatsWidget stats={tagStats} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopicsToWatchWidget topics={topicsToWatch} />
        </div>
      </div>
    </>
  );
};

export default BankDashboard;
