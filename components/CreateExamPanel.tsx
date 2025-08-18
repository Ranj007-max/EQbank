import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import PreviewQuestionsModal from './PreviewQuestionsModal';
import { MultiSelect, MultiSelectOption } from './ui/MultiSelect';
import { ExamConfig } from '../pages/ExamSetup';
import { Bookmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { MBBS_SUBJECTS, PLATFORMS } from '../data/constants';

import { ExamQuestion } from '../types';

interface CreateExamPanelProps {
  config: ExamConfig;
  onConfigChange: (newConfig: Partial<ExamConfig>) => void;
  availableChapters: MultiSelectOption[];
  startExam: () => void;
  availableQuestions: number;
  savePreset: () => void;
  filteredQuestions: ExamQuestion[];
}

const TAGS = ["Hard", "Revise", "Bookmark"];

const CreateExamPanel: React.FC<CreateExamPanelProps> = ({
  config,
  onConfigChange,
  availableChapters,
  startExam,
  availableQuestions,
  savePreset,
  filteredQuestions,
}) => {
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [customPlatform, setCustomPlatform] = useState('');

  const handleClearFilters = () => {
    onConfigChange({
      examType: 'full-mock',
      subjects: [],
      chapters: [],
      difficulty: 50,
      numQuestions: 50,
      tags: [],
      platform: '',
    });
    setCustomPlatform('');
  };

  const handleTagToggle = (tag: string) => {
    const newTags = config.tags.includes(tag)
      ? config.tags.filter((t) => t !== tag)
      : [...config.tags, tag];
    onConfigChange({ tags: newTags });
  };

  const handlePlatformChange = (value: string) => {
    if (value !== 'custom') {
      onConfigChange({ platform: value });
    } else {
      onConfigChange({ platform: 'custom' });
    }
  };

  const handleCustomPlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPlatform(e.target.value);
    onConfigChange({ platform: e.target.value });
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Create New Exam</CardTitle>
            <div className="text-sm text-muted-foreground" aria-live="polite">
              {availableQuestions} Questions Available
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="subjects">Subjects</Label>
              <MultiSelect
                options={MBBS_SUBJECTS.map(s => ({ value: s, label: s }))}
                selected={config.subjects}
                onChange={(selected) => onConfigChange({ subjects: selected })}
                className="w-full"
                placeholder="Select Subjects"
                aria-label="Select Subjects for Exam"
              />
            </div>
            <div>
              <Label htmlFor="chapters">Chapters</Label>
              <MultiSelect
                options={availableChapters}
                selected={config.chapters}
                onChange={(selected) => onConfigChange({ chapters: selected })}
                className="w-full"
                placeholder="Select Chapters"
                aria-label="Select Chapters for Exam"
                disabled={availableChapters.length === 0}
              />
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select onValueChange={handlePlatformChange}>
                <SelectTrigger id="platform" aria-label="Select Platform">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(platform => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Entry</SelectItem>
                  <SelectItem value="unattended">Unattended</SelectItem>
                </SelectContent>
              </Select>
              {config.platform === 'custom' && (
                <Input
                  type="text"
                  placeholder="Enter custom platform"
                  value={customPlatform}
                  onChange={handleCustomPlatformChange}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="num-questions">Number of Questions</Label>
              <Input
                id="num-questions"
                type="number"
                value={config.numQuestions}
                onChange={(e) => onConfigChange({ numQuestions: Number(e.target.value) })}
                min="10"
                max={availableQuestions > 0 ? availableQuestions : 200}
                step="10"
                aria-label="Number of questions"
              />
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TAGS.map(tag => (
                  <Badge
                    key={tag}
                    variant={config.tags.includes(tag) ? "default" : "outline"}
                    onClick={() => handleTagToggle(tag)}
                    className="cursor-pointer"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-4 pt-6">
          <Button variant="ghost" onClick={savePreset}><Bookmark className="mr-2 h-4 w-4" /> Save Preset</Button>
          <div className="flex justify-center items-center gap-4">
            <Button
              onClick={startExam}
              disabled={availableQuestions === 0}
            >
              Start Exam
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewModalOpen(true)}
            >
              Preview Questions
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </CardFooter>
      </Card>
      <PreviewQuestionsModal
        isOpen={isPreviewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        questions={filteredQuestions.slice(0, 10).map((q: ExamQuestion) => ({ id: q.id, text: q.question }))}
      />
    </>
  );
};

export default CreateExamPanel;
