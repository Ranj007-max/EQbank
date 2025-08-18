import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    const id = React.useId();
    return (
      <div className="float-label-input">
        <input
          type={type}
          id={id}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-neumorphic focus-visible:shadow-inner",
            className
          )}
          ref={ref}
          placeholder=" " // The space is important for the :placeholder-shown selector to work
          {...props}
        />
        {label && <label htmlFor={id}>{label}</label>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };