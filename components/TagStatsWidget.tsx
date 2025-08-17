import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bookmark, Flame, AlertTriangle, RefreshCw, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

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
  { key: 'bookmarked', label: 'Bookmarked', icon: Bookmark, color: 'text-yellow-400', darkColor: 'dark:text-yellow-500' },
  { key: 'hard', label: 'Marked as Hard', icon: Flame, color: 'text-red-500', darkColor: 'dark:text-red-500' },
  { key: 'revise', label: 'Marked for Revision', icon: RefreshCw, color: 'text-blue-500', darkColor: 'dark:text-blue-500' },
  { key: 'mistaked', label: 'Mistaken', icon: AlertTriangle, color: 'text-orange-500', darkColor: 'dark:text-orange-500' },
];

export const TagStatsWidget: React.FC<TagStatsWidgetProps> = ({ stats }) => {
  return (
    <Card className={cn("glass-card", "glow-border", "h-full")}>
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Tag size={24} className="mr-3 text-primary" />
          Tagged Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map(item => (
            <div key={item.key} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg transition-all hover:bg-muted/80">
              <item.icon className={cn("h-7 w-7", item.color, item.darkColor)} />
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
