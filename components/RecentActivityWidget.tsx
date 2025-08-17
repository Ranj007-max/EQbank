import { Activity } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { History, BookCopy, Zap, Award } from 'lucide-react';

const ActivityIcon: React.FC<{ type: Activity['type'] }> = ({ type }) => {
    switch (type) {
        case 'batch': return <BookCopy className="h-5 w-5 text-blue-500" />;
        case 'study': return <Zap className="h-5 w-5 text-yellow-500" />;
        case 'exam': return <Award className="h-5 w-5 text-green-500" />;
        default: return <History className="h-5 w-5 text-gray-500" />;
    }
};

const ActivityText: React.FC<{ activity: Activity }> = ({ activity }) => {
    switch (activity.type) {
        case 'batch': return <>Added <strong>{activity.questionCount}</strong> questions to <span className="font-semibold">{activity.name}</span></>;
        case 'study': return <>Completed a study session with <strong>{activity.score}%</strong></>;
        case 'exam': return <>Finished an exam with <strong>{activity.score}%</strong></>;
        default: return <p>An unknown activity occurred.</p>
    }
}

export const RecentActivityWidget: React.FC<{ activities: Activity[] }> = ({ activities }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <History size={18} className="text-muted-foreground" />
                Recent Activity
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {activities.length > 0 ? activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-4">
                        <div className="bg-muted p-2 rounded-full">
                           <ActivityIcon type={activity.type} />
                        </div>
                        <div className="text-sm">
                            <p className="text-foreground"><ActivityText activity={activity} /></p>
                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(activity.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                )) : <p className="text-sm text-center text-muted-foreground py-4">No recent activity.</p>}
            </div>
        </CardContent>
    </Card>
);
