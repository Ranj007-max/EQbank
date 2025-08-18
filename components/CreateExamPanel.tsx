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

import { ExamQuestion } from '../types';

interface CreateExamPanelProps {
  config: ExamConfig;
  onConfigChange: (newConfig: Partial<ExamConfig>) => void;
  availableSubjects: MultiSelectOption[];
  startExam: () => void;
  availableQuestions: number;
  savePreset: () => void;
  filteredQuestions: ExamQuestion[];
}

const TAGS = ["High-Yield", "Image-Based", "Unattempted", "Hard"];

const CreateExamPanel: React.FC<CreateExamPanelProps> = ({
  config,
  onConfigChange,
  availableSubjects,
  startExam,
  availableQuestions,
  savePreset,
  filteredQuestions,
}) => {
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);

  const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(element.clientWidth, element.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - element.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - element.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const ripple = element.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }
    element.appendChild(circle);
  };

  const handleClearFilters = () => {
    onConfigChange({
      examType: 'full-mock',
      subjects: [],
      chapters: [],
      difficulty: 50,
      numQuestions: 50,
      tags: [],
    });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = config.tags.includes(tag)
      ? config.tags.filter((t) => t !== tag)
      : [...config.tags, tag];
    onConfigChange({ tags: newTags });
  };

  return (
    <>
      <div
        className="glass-card w-full p-6 relative overflow-hidden"
        style={{
          height: '450px',
          background: 'linear-gradient(135deg, #0A0A0A, #1A1A1A)',
          borderRadius: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex flex-col h-full">
          <header className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'SF Pro Display, sans-serif' }}>
              Create New Exam
            </h2>
            <div className="text-sm text-gray-400" aria-live="polite">
              {availableQuestions} Questions Available
            </div>
          </header>

          <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 overflow-y-auto pr-2">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="exam-type" className="w-1/3 text-right text-gray-300">Exam Type</Label>
                <Select value={config.examType} onValueChange={(value) => onConfigChange({ examType: value })}>
                  <SelectTrigger id="exam-type" className="neumorphic-input w-2/3" aria-label="Select Exam Type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-mock">Full Mock</SelectItem>
                    <SelectItem value="subject-specific">Subject-Specific</SelectItem>
                    <SelectItem value="quick-test">Quick Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="subjects" className="w-1/3 text-right text-gray-300">Subjects</Label>
                <MultiSelect
                  options={availableSubjects}
                  selected={config.subjects}
                  onChange={(selected) => onConfigChange({ subjects: selected })}
                  className="neumorphic-input w-2/3"
                  placeholder="Select Subjects"
                  aria-label="Select Subjects for Exam"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="chapters" className="w-1/3 text-right text-gray-300">Chapters</Label>
                <Select disabled>
                  <SelectTrigger id="chapters" className="neumorphic-input w-2/3">
                    <SelectValue placeholder="Select Chapters (coming soon)" />
                  </SelectTrigger>
                </Select>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="difficulty" className="w-1/3 text-right text-gray-300">Difficulty</Label>
                <div className="w-2/3 flex items-center gap-2">
                  <span className="text-gray-400">Easy</span>
                  <input
                    id="difficulty"
                    type="range"
                    min="0"
                    max="100"
                    value={config.difficulty}
                    onChange={(e) => onConfigChange({ difficulty: Number(e.target.value) })}
                    className="neumorphic-slider w-full"
                    aria-label="Select difficulty"
                  />
                  <span className="text-gray-400">Hard</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="num-questions" className="w-1/3 text-right text-gray-300">Questions</Label>
                <Input
                  id="num-questions"
                  type="number"
                  value={config.numQuestions}
                  onChange={(e) => onConfigChange({ numQuestions: Number(e.target.value) })}
                  className="neumorphic-input w-2/3"
                  min="10"
                  max={availableQuestions > 0 ? availableQuestions : 200}
                  step="10"
                  aria-label="Number of questions"
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-1/3 text-right text-gray-300">Tags</Label>
                <div className="w-2/3 flex flex-wrap gap-2">
                  {TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={config.tags.includes(tag) ? "default" : "outline"}
                      onClick={(e) => {
                        handleTagToggle(tag);
                        createRipple(e);
                      }}
                      className="cursor-pointer relative overflow-hidden"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </main>

          <footer className="mt-auto pt-4 flex justify-between items-center gap-4">
            <Button variant="ghost" onClick={(e) => {savePreset(); createRipple(e);}}><Bookmark className="mr-2 h-4 w-4" /> Save Preset</Button>
            <div className="flex justify-center items-center gap-4">
              <Button
                className="neumorphic-button relative overflow-hidden"
                onClick={(e) => {startExam(); createRipple(e);}}
                disabled={availableQuestions === 0}
              >
                Start Exam
              </Button>
              <Button
                variant="outline"
                className="neumorphic-button relative overflow-hidden"
                onClick={(e) => {setPreviewModalOpen(true); createRipple(e);}}
              >
                Preview Questions
              </Button>
              <Button
                variant="outline"
                className="neumorphic-button relative overflow-hidden"
                onClick={(e) => {handleClearFilters(); createRipple(e);}}
                style={{borderColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive))'}}
              >
                Clear Filters
              </Button>
            </div>
          </footer>
        </div>
      </div>
      <PreviewQuestionsModal
        isOpen={isPreviewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        questions={filteredQuestions.slice(0, 10).map((q: ExamQuestion) => ({ id: q.id, text: q.question }))}
      />
    </>
  );
};

export default CreateExamPanel;
