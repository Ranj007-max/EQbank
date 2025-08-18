import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[24px] text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform transition-transform active:scale-105",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-px shadow-neumorphic",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-px",
        success:
          "bg-green-600 text-primary-foreground hover:bg-green-600/90 hover:-translate-y-px",
        warning:
          "bg-amber-500 text-primary-foreground hover:bg-amber-500/90 hover:-translate-y-px",
        outline:
          "border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-px",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "btn-gradient text-primary-foreground border-transparent hover:-translate-y-px",
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
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      // Ripple effect
      const button = event.currentTarget;
      const circle = document.createElement("span");
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
      circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
      circle.classList.add("ripple");

      const ripple = button.getElementsByClassName("ripple")[0];
      if (ripple) {
        ripple.remove();
      }
      button.appendChild(circle);

      // Call original onClick if it exists
      if (onClick) {
        onClick(event);
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "relative overflow-hidden")}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
Button.displayName = "Button"

export { Button, buttonVariants }
