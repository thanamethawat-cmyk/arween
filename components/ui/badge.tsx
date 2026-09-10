import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "warning" | "success" | "outline" | "destructive";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-primary/10 text-primary",
        variant === "secondary" && "bg-muted text-muted-foreground",
        variant === "warning" && "bg-amber-100 text-amber-800",
        variant === "success" && "bg-green-100 text-green-800",
        variant === "outline" && "border border-border bg-transparent text-foreground",
        variant === "destructive" && "bg-red-100 text-red-800",
        className
      )}
    >
      {children}
    </span>
  );
}
