import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bookmark, Flame, AlertTriangle, RefreshCw } from 'lucide-react';

interface TagStats {
  bookmarked: number;
  hard: number;
  revise: number;
  mistaked: number;
}

interface TagStatsWidgetProps {
  stats: TagStats;
}

const statItems = [
  { key: 'bookmarked', label: 'Bookmarked', icon: Bookmark, color: 'text-yellow-500' },
  { key: 'hard', label: 'Marked as Hard', icon: Flame, color: 'text-red-500' },
  { key: 'revise', label: 'Marked for Revision', icon: RefreshCw, color: 'text-blue-500' },
  { key: 'mistaked', label: 'Mistaken', icon: AlertTriangle, color: 'text-orange-500' },
];

export const TagStatsWidget: React.FC<TagStatsWidgetProps> = ({ stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tagged Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map(item => (
            <div key={item.key} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <item.icon className={`h-6 w-6 ${item.color}`} />
              <div>
                <p className="text-2xl font-bold">{stats[item.key as keyof TagStats]}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
