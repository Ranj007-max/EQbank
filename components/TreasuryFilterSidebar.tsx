import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const TreasuryFilterSidebar = () => {
  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="text-2xl font-bold">Filters</h2>

      {/* Platform Filter */}
      <div className="space-y-2">
        <Label htmlFor="platform-filter">Platform</Label>
        <Select>
          <SelectTrigger id="platform-filter" className="neumorphic-input">
            <SelectValue placeholder="Select Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neet-pg">NEET PG</SelectItem>
            <SelectItem value="aiims">AIIMS</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subject Filter */}
      <div className="space-y-2">
        <Label htmlFor="subject-filter">Subject</Label>
        {/* Replace with a multi-select component */}
        <Select>
          <SelectTrigger id="subject-filter" className="neumorphic-input">
            <SelectValue placeholder="Select Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anatomy">Anatomy</SelectItem>
            <SelectItem value="physiology">Physiology</SelectItem>
            <SelectItem value="biochemistry">Biochemistry</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chapter Filter */}
      <div className="space-y-2">
        <Label htmlFor="chapter-filter">Chapter</Label>
        <Select>
          <SelectTrigger id="chapter-filter" className="neumorphic-input">
            <SelectValue placeholder="Select Chapter" />
          </SelectTrigger>
          <SelectContent>
            {/* Chapters would be populated based on selected subject */}
          </SelectContent>
        </Select>
      </div>

      {/* Tags Filter */}
      <div className="space-y-2">
        <Label htmlFor="tags-filter">Tags</Label>
        <div className="flex gap-2 items-center">
            <Input id="tags-filter" placeholder="e.g. High-Yield, Image-Based" className="neumorphic-input" />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
            {/* Selected tags would be displayed here as chips */}
            <div className="flex items-center gap-1 bg-primary/20 text-primary text-sm font-semibold px-2 py-1 rounded-full">
                <span>High-Yield</span>
                <Button variant="ghost" size="icon" className="h-5 w-5"><X size={12}/></Button>
            </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-white/10">
        <Button variant="outline" className="neumorphic-button">Reset Filters</Button>
        <Button className="btn-gradient">Apply</Button>
      </div>
    </div>
  );
};

export default TreasuryFilterSidebar;
