import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { History } from 'lucide-react';
import { StudySessionResult, ExamSession } from '../types';

interface LastSessionWidgetProps {
    lastSession?: { type: 'study', data: StudySessionResult } | { type: 'exam', data: ExamSession };
}

export const LastSessionWidget: React.FC<LastSessionWidgetProps> = ({ lastSession }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <History size={18} className="text-muted-foreground" />
                Last Session
            </CardTitle>
        </CardHeader>
        <CardContent>
            {lastSession ? (
                <div className="text-sm space-y-2">
                    <p className="font-bold text-3xl text-primary">{lastSession.data.score}%
                        <span className="text-base font-medium text-muted-foreground ml-2">
                            ({lastSession.type === 'exam' ? lastSession.data.correctAnswers + '/' + lastSession.data.questions.length : lastSession.data.accuracy})
                        </span>
                    </p>
                    <p className="text-muted-foreground pt-2">
                        <span className="font-medium text-foreground">Type:</span>
                        <span className="capitalize ml-1">{lastSession.type}</span>
                    </p>
                    <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Date:</span>
                        <span className="ml-1">{new Date(lastSession.data.createdAt).toLocaleDateString()}</span>
                    </p>
                </div>
            ) : (
                <p className="text-sm text-center py-4 text-muted-foreground">No sessions completed yet.</p>
            )}
        </CardContent>
    </Card>
);
