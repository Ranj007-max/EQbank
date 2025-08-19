import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox'; // HLPE
import { Lightbulb } from 'lucide-react'; // HLPE
import { MultiSelect } from './ui/MultiSelect';
import { MBBS_SUBJECTS, PLATFORMS } from '../data/constants';

export interface TreasuryFilters {
  platforms: string[];
  subjects: string[];
  chapters: string[];
  tags: string[];
  searchTerm: string;
  focusWeakAreas?: boolean; // HLPE
}

interface TreasuryFilterSidebarProps {
  filters: TreasuryFilters;
  onFiltersChange: (filters: Partial<TreasuryFilters>) => void;
  onApply: () => void;
  onReset: () => void;
  availableChapters: { value: string; label: string }[];
}

const TreasuryFilterSidebar: React.FC<TreasuryFilterSidebarProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  availableChapters,
}) => {
  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="text-2xl font-bold">Filters</h2>

      {/* HLPE Smart Filters */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <Lightbulb size={20} />
          Smart Filters
        </h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="focus-weak-areas"
            checked={filters.focusWeakAreas}
            onCheckedChange={(checked) => onFiltersChange({ focusWeakAreas: !!checked })}
          />
          <Label htmlFor="focus-weak-areas" className="font-medium">
            Focus on Weak Areas
          </Label>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="space-y-2">
        <Label htmlFor="platform-filter">Platform</Label>
        <MultiSelect
          options={PLATFORMS.map(p => ({ value: p, label: p }))}
          selected={filters.platforms}
          onChange={(selected) => onFiltersChange({ platforms: selected })}
          className="w-full"
          placeholder="Select Platforms"
          aria-label="Select Platforms"
        />
      </div>

      {/* Subject Filter */}
      <div className="space-y-2">
        <Label htmlFor="subject-filter">Subject</Label>
        <MultiSelect
          options={MBBS_SUBJECTS.map(s => ({ value: s, label: s }))}
          selected={filters.subjects}
          onChange={(selected) => onFiltersChange({ subjects: selected })}
          className="w-full"
          placeholder="Select Subjects"
          aria-label="Select Subjects"
        />
      </div>

      {/* Chapter Filter */}
      <div className="space-y-2">
        <Label htmlFor="chapter-filter">Chapter</Label>
        <MultiSelect
          options={availableChapters}
          selected={filters.chapters}
          onChange={(selected) => onFiltersChange({ chapters: selected })}
          className="w-full"
          placeholder="Select Chapters"
          aria-label="Select Chapters"
          disabled={availableChapters.length === 0}
        />
      </div>

      {/* Tags Filter */}
      <div className="space-y-2">
        <Label htmlFor="tags-filter">Tags</Label>
        <Input
          id="tags-filter"
          placeholder="e.g. High-Yield, Image-Based"
          className="neumorphic-input"
          value={filters.tags.join(', ')}
          onChange={(e) => onFiltersChange({ tags: e.target.value.split(',').map(t => t.trim()) })}
        />
      </div>

      <div className="flex justify-between pt-4 border-t border-white/10">
        <Button variant="outline" className="neumorphic-button" onClick={onReset}>Reset Filters</Button>
        <Button className="btn-gradient" onClick={onApply}>Apply</Button>
      </div>
    </div>
  );
};

export default TreasuryFilterSidebar;
