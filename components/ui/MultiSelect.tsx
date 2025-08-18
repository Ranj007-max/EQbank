import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Badge } from "./badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ options, selected, onChange, className, placeholder = "Select options...", ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const handleSelect = (value: string) => {
      const newSelected = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      onChange(newSelected);
    };
    
    const filteredOptions = options.filter(option => option.label.toLowerCase().includes(search.toLowerCase()));

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-auto", className)}
            {...props}
          >
            <div className="flex gap-1 flex-wrap">
              {selected.length === 0 ? placeholder : null}
              {selected
                .map(value => options.find(option => option.value === value))
                .filter(Boolean)
                .map(option => (
                  <Badge
                    variant="secondary"
                    key={option!.value}
                    className="mr-1 mb-1"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleSelect(option!.value);
                    }}
                  >
                    {option!.label}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0">
            <DialogHeader className="p-4 border-b">
                <DialogTitle>{placeholder}</DialogTitle>
            </DialogHeader>
            <div className="p-4">
                <Input 
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-4"
                />
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredOptions.map(option => (
                        <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`multiselect-${option.value}`}
                                checked={selected.includes(option.value)}
                                onCheckedChange={() => handleSelect(option.value)}
                            />
                            <Label htmlFor={`multiselect-${option.value}`} className="font-normal">
                                {option.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        </DialogContent>
      </Dialog>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };