import React from 'react';
import { ArrowRight, BookCopy, BarChart3, Target, CheckCircle, FilePlus2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Activity } from '../types';
import { GoalTrackerWidget } from './GoalTrackerWidget';
import { PerformanceCharts } from './PerformanceCharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Separator } from './ui/separator';
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
    const features = [
        { title: 'Start New Exam', description: 'Create a custom exam with selected topics and difficulty.', icon: Target, link: '/exams' },
        { title: 'Review Performance', description: 'Analyze your progress with detailed performance metrics.', icon: BarChart3, link: '/bank' },
        { title: 'Browse Question Bank', description: 'Explore batches by subject and platform.', icon: BookCopy, link: '/bank' },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Welcome to PgQbank</h1>
                <p className="text-muted-foreground mt-1">Your intelligent MCQ practice partner.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <Link to={feature.link} key={index} className="group">
                        <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                             <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                                <feature.icon className="h-8 w-8 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <PerformanceCharts timeData={performanceOverTime} subjectData={performanceBySubject} />
                </div>
                <div className="space-y-6">
                    <GoalTrackerWidget />
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentActivity.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {recentActivity.map((act, index) => <ActivityItem key={act.id + act.createdAt} activity={act} />)}
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
            </div>
        </div>
    );
};

export default Dashboard;