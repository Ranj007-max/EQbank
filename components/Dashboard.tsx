import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { GoalTrackerWidget } from './GoalTrackerWidget';
import { PerformanceCharts } from './PerformanceCharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ActivityItem } from './ActivityItem';

const Dashboard: React.FC = () => {
    const { recentActivity, performanceOverTime, performanceBySubject } = useAnalytics();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h1 className="text-4xl font-extrabold gradient-text">Welcome to E-Qbank</h1>
                    <p className="text-muted-foreground mt-1 font-bold">Your intelligent MCQ practice partner.</p>
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