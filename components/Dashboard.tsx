import { CheckCircle, FilePlus2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Activity } from '../types';
import { GoalTrackerWidget } from './GoalTrackerWidget';
import { PerformanceCharts } from './PerformanceCharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';

const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "just now";
    };

    const renderIcon = () => {
        switch (activity.type) {
            case 'batch':
                return <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full"><FilePlus2 className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>;
            case 'exam':
            case 'study':
                return <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full"><CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /></div>;
            default:
                return null;
        }
    };

    const renderText = () => {
         switch (activity.type) {
            case 'batch':
                return <>Added {activity.questionCount} questions <span className="text-muted-foreground">&middot; {activity.name}</span></>;
            case 'exam':
            case 'study':
                return <>Completed {activity.type} session ({activity.score}%) <span className="text-muted-foreground">&middot; {activity.subjects.join(', ')}</span></>;
            default:
                return null;
        }
    };

    return (
        <div className="flex items-center gap-4 py-3">
            {renderIcon()}
            <div>
                <p className="font-medium text-foreground">{renderText()}</p>
                <p className="text-sm text-muted-foreground">{timeAgo(activity.createdAt)}</p>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { recentActivity, performanceOverTime, performanceBySubject } = useAnalytics();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h1 className="text-6xl font-bold gradient-text">Welcome to PgQbank</h1>
                    <p className="text-muted-foreground mt-1">Your intelligent MCQ practice partner.</p>
                </div>

                <PerformanceCharts timeData={performanceOverTime} subjectData={performanceBySubject} />

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <div className="divide-y divide-border">
                                {recentActivity.map((act) => <ActivityItem key={act.id + act.createdAt} activity={act} />)}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                <p>You haven't completed any sessions yet.</p>
                                <Button asChild className="mt-4">
                                    <Link to="/exams">Start Your First Exam</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8 lg:sticky lg:top-24">
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <Button asChild size="lg">
                            <Link to="/exams" className="w-full">Start New Exam</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link to="/srs-review" className="w-full">Spaced Repetition</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link to="/bank" className="w-full">Question Bank</Link>
                        </Button>
                    </CardContent>
                </Card>

                <GoalTrackerWidget />
            </div>
        </div>
    );
};

export default Dashboard;