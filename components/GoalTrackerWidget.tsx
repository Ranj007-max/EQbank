import React, { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { Edit, Target, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';

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
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="font-bold text-2xl text-primary">{weeklyGoalProgress.count}</span>
                                <span className="text-sm font-medium text-muted-foreground">/ {goal?.target || 100} questions</span>
                            </div>
                            <Progress value={weeklyGoalProgress.percentage} />
                        </div>
                        <p className="text-sm text-center text-muted-foreground">{weeklyGoalProgress.percentage}% complete</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};