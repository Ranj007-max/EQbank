import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bookmark, AlertTriangle, Tag as TagIcon, Star, History, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTagStats } from '../services/dataService';

interface TagStat {
  tag: string;
  count: number;
}

const tagConfig: { [key: string]: { icon: React.ElementType; label: string } } = {
  bookmarked: { icon: Bookmark, label: 'Bookmarked' },
  mistaked: { icon: AlertTriangle, label: 'Mistaked' },
  'high-yield': { icon: Star, label: 'High-Yield' },
  pyq: { icon: History, label: 'PYQ' },
  'image-based': { icon: Image, label: 'Image Based' },
  default: { icon: TagIcon, label: 'Tag' },
};

const getTagConfig = (tag: string) => {
    const normalizedTag = tag.toLowerCase();
    return tagConfig[normalizedTag] || { ...tagConfig.default, label: tag.charAt(0).toUpperCase() + tag.slice(1) };
};

export const TagStatsWidget = () => {
  const [stats, setStats] = useState<TagStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    const tagStats = await getTagStats();
    setStats(tagStats);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleMcqUpdate = () => fetchStats();

    fetchStats();
    window.addEventListener('mcqUpdated', handleMcqUpdate);
    return () => {
      window.removeEventListener('mcqUpdated', handleMcqUpdate);
    };
  }, [fetchStats]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <TagIcon size={24} className="mr-3 text-primary" />
          Tagged Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="text-center p-8">Loading stats...</div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ tag, count }) => {
                const config = getTagConfig(tag);
                const Icon = config.icon;

                return (
                <Link to={`/bank/tagged/${tag}`} key={tag} className="block p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/20">
                    <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                </Link>
                );
            })}
            </div>
        )}
      </CardContent>
    </Card>
  );
};
