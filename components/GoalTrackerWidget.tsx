import React, { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { Edit, Target, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ProgressRing } from './ui/progress-ring';

export const GoalTrackerWidget: React.FC = () => {
    const { goal, setGoal, weeklyGoalProgress } = useAnalytics();
    const [isEditing, setIsEditing] = useState(false);
    const [target, setTarget] = useState(goal?.target || 100);

    const handleSave = () => {
        if (target > 0) {
            setGoal({ type: 'weeklyQuestions', target });
            setIsEditing(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                    <Target size={22} />
                    Weekly Goal
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="h-8 w-8">
                    {isEditing ? <X size={18} /> : <Edit size={18} />}
                </Button>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-3 animate-fade-in">
                        <Label htmlFor="goal-input">Set weekly question target:</Label>
                        <Input
                            id="goal-input"
                            type="number"
                            step="10"
                            min="10"
                            value={target}
                            onChange={(e) => setTarget(Number(e.target.value))}
                        />
                        <Button onClick={handleSave} className="w-full">
                            <Save size={18} className="mr-2" />
                            Save Goal
                        </Button>
                    </div>
                ) : (
                    <div className="relative flex justify-center items-center">
                        <ProgressRing progress={weeklyGoalProgress.percentage} size={160} strokeWidth={16} />
                        <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-bold text-primary">{weeklyGoalProgress.count}</span>
                            <span className="text-sm font-medium text-muted-foreground">/ {goal?.target || 100}</span>
                            <span className="text-xs text-muted-foreground mt-1">questions</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};