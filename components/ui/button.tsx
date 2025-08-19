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
  isSelected?: boolean;
  isDestructive?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isSelected, isDestructive, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const debouncedOnClick = useDebouncedCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
       if (onClick) {
        onClick(event);
      }
    }, 300);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.stopPropagation();

      // Haptic feedback for selection
      if (navigator.vibrate && !isSelected) {
        navigator.vibrate(10);
      }

      debouncedOnClick(event);
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
        // Prevent default browser actions like scrolling or zooming on touch.
        event.preventDefault();
    };

    // Base classes from CVA
    const baseClasses = buttonVariants({ variant, size });

    // Conditional classes for selected state
    const selectedClasses = isSelected
      ? isDestructive
        ? 'bg-destructive-selected text-destructive-selected-foreground shadow-neumorphic-selected'
        : 'bg-selected text-selected-foreground shadow-neumorphic-selected'
      : '';

    return (
      <Comp
        className={cn(baseClasses, selectedClasses, className)}
        ref={ref}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={(e) => e.preventDefault()}
        aria-pressed={isSelected}
        {...props}
      />
    );
  }
);
Button.displayName = "Button"

export { Button, buttonVariants }
