import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lightbulb } from 'lucide-react';

interface TopicsToWatchWidgetProps {
    topics: Array<{ subject: string; accuracy: number; }>;
}

export const TopicsToWatchWidget: React.FC<TopicsToWatchWidgetProps> = ({ topics }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Lightbulb size={18} className="text-muted-foreground" />
                Topics to Watch
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                {topics.length > 0 ? topics.map(topic => (
                    <div key={topic.subject} className="flex justify-between items-center text-sm">
                        <span className="text-foreground">{topic.subject}</span>
                        <span className={`font-bold ${topic.accuracy < 60 ? 'text-red-500' : 'text-amber-500'}`}>
                            {topic.accuracy}%
                        </span>
                    </div>
                )) : <p className="text-sm text-center py-4 text-muted-foreground">No weak topics found yet. Keep practicing!</p>}
            </div>
        </CardContent>
    </Card>
);
