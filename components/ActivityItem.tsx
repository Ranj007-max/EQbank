import { CheckCircle, FilePlus2 } from 'lucide-react';
import { Activity } from '../types';

export const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
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
