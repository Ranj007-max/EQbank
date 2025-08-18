import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { MultiSelect } from './ui/MultiSelect';
import { MBBS_SUBJECTS, PLATFORMS } from '../data/constants';

export interface TreasuryFilters {
  platforms: string[];
  subjects: string[];
  chapters: string[];
  tags: string[];
  searchTerm: string;
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
