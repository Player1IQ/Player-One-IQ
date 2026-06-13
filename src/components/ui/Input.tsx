import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
          <input
            ref={ref}
            className={cn(
              "w-full rounded-xl border border-white/[0.08] bg-surface-raised/80 py-2.5 pl-10 pr-4 text-sm text-gray-200",
              "placeholder:text-gray-600 backdrop-blur-sm",
              "focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20",
              "transition-colors duration-200",
              className
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-white/[0.08] bg-surface-raised/80 px-4 py-2.5 text-sm text-gray-200",
          "placeholder:text-gray-600 backdrop-blur-sm",
          "focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20",
          "transition-colors duration-200",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
