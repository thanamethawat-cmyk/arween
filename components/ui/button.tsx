import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50",
          // sizes
          size === "default" && "px-4 py-2 text-sm",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "lg" && "px-6 py-3 text-base",
          size === "icon" && "h-9 w-9 p-0",
          // variants
          variant === "default" &&
            "bg-primary text-primary-foreground hover:opacity-90",
          variant === "secondary" &&
            "bg-muted text-foreground hover:bg-muted/80",
          variant === "outline" &&
            "border border-border bg-background hover:bg-muted text-foreground",
          variant === "ghost" && "hover:bg-muted text-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
