import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { useDebouncedCallback } from "../../hooks/useDebounce"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-base font-semibold ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neumorphic: "bg-secondary text-secondary-foreground shadow-neumorphic-default hover:border-primary border-2 border-transparent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  selected?: boolean;
  isDestructive?: boolean;
  onToggle?: (id: string, selected: boolean) => void;
  id?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, selected, isDestructive, onClick, onToggle, id, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const debouncedOnToggle = useDebouncedCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.TouchEvent<HTMLButtonElement>) => {
       if (onToggle) {
        onToggle(id || '', !selected);
       }
       if (onClick) {
         // We cast here because the original onClick expects a MouseEvent
         onClick(event as React.MouseEvent<HTMLButtonElement, MouseEvent>);
       }
    }, 200);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.TouchEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      // Ripple effect
      const button = event.currentTarget;
      const circle = document.createElement("span");
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${clientX - button.offsetLeft - radius}px`;
      circle.style.top = `${clientY - button.offsetTop - radius}px`;
      circle.classList.add("ripple");

      const ripple = button.getElementsByClassName("ripple")[0];
      if (ripple) {
        ripple.remove();
      }
      button.appendChild(circle);

      debouncedOnToggle(event);
    };

    // Base classes from CVA
    const baseClasses = buttonVariants({ variant, size });

    // Conditional classes for selected state
    const selectedClasses = selected
      ? isDestructive
        ? 'bg-destructive-selected text-destructive-selected-foreground shadow-neumorphic-selected'
        : 'bg-selected text-selected-foreground shadow-neumorphic-selected'
      : '';

    return (
      <Comp
        className={cn(baseClasses, selectedClasses, "relative overflow-hidden", className)}
        ref={ref}
        onClick={handleClick}
        onTouchStart={handleClick} // Use the same handler for touch
        aria-pressed={selected}
        {...props}
      />
    );
  }
);
Button.displayName = "Button"

export { Button, buttonVariants }
