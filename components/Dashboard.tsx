import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useAnalytics } from '../context/AnalyticsContext';
import { useHLPE } from '../context/HLPEContext';
import { GoalTrackerWidget } from './GoalTrackerWidget';
import { HLPESuggestionsWidget } from './HLPESuggestionsWidget';
import { PerformanceCharts } from './PerformanceCharts';
import { CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ActivityItem } from './ActivityItem';

const Dashboard: React.FC = () => {
    // Assuming store structure due to file read issue.
    const { profile } = useAuthStore();
    const { recentActivity, performanceOverTime, performanceBySubject } = useAnalytics();
    const { analysisResult } = useHLPE();

    // Common classes for all bento box items for a consistent, premium feel
    const bentoBoxClasses = "glass-card p-4 md:p-6 rounded-2xl transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-bioluminescent-glow flex flex-col";

    const welcomeAnimation: {
        hidden: { opacity: number; y: number };
        visible: {
            opacity: number;
            y: number;
            transition: {
                type: "spring";
                damping: number;
                stiffness: number;
                delay: number;
            };
        };
    } = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 15,
                stiffness: 100,
                delay: 0.2,
            },
        },
    };

    // NOTE: A more dynamic suggestion could be implemented here later
    const suggestedTopic = "Cardiology";

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 auto-rows-[220px] gap-6">

                {/* Welcome Header */}
                <motion.div
                  className="lg:col-span-4 row-span-1 flex flex-col justify-center rounded-2xl p-6"
                  variants={welcomeAnimation}
                  initial="hidden"
                  animate="visible"
                >
                    <h1 className="text-4xl font-extrabold gradient-text">Welcome back, {profile?.display_name?.split(' ')[0] || 'Doctor'}!</h1>
                    <p className="text-muted-foreground mt-1 font-bold">Let's tackle <span className="text-primary">{suggestedTopic}</span> today.</p>
                </motion.div>

                {/* Performance Charts */}
                <div className={`lg:col-span-2 lg:row-span-2 ${bentoBoxClasses}`}>
                    <PerformanceCharts
                        timeData={performanceOverTime}
                        subjectData={performanceBySubject}
                        scoreTrend={analysisResult?.scoreTrend}
                    />
                </div>

                {/* Actions */}
                <div className={`lg:col-span-1 lg:row-span-1 ${bentoBoxClasses}`}>
                    <CardHeader className="p-0 mb-4">
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col gap-3 flex-grow justify-center">
                        <Button asChild size="lg">
                            <Link to="/exams" className="w-full">Start New Exam</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link to="/srs-review" className="w-full">Spaced Repetition</Link>
                        </Button>
                    </CardContent>
                </div>

                {/* Goal Tracker */}
                <div className={`lg:col-span-1 lg:row-span-1 ${bentoBoxClasses}`}>
                    <GoalTrackerWidget />
                </div>

                {/* HLPE Suggestions */}
                <div className={`lg:col-span-2 lg:row-span-1 ${bentoBoxClasses}`}>
                    <HLPESuggestionsWidget studyPlan={analysisResult?.studyPlan} />
                </div>

                {/* Recent Activity */}
                <div className={`lg:col-span-4 lg:row-span-2 ${bentoBoxClasses}`}>
                    <CardHeader className="p-0 mb-4">
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-grow overflow-y-auto custom-scrollbar">
                        {recentActivity.length > 0 ? (
                            <div className="divide-y divide-border">
                                {recentActivity.map((act) => <ActivityItem key={act.id + act.createdAt} activity={act} />)}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center">
                                <p>You haven't completed any sessions yet.</p>
                                <Button asChild className="mt-4">
                                    <Link to="/exams">Start Your First Exam</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;