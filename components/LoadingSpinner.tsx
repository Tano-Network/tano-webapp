import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "border-4 border-muted rounded-full animate-spin",
          "border-t-primary border-r-primary/50 border-b-primary/25 border-l-transparent",
          sizeClasses[size],
        )}
      />
      <div
        className={cn(
          "absolute inset-0 border-4 border-transparent rounded-full animate-ping",
          "border-t-primary/20",
          sizeClasses[size],
        )}
        style={{ animationDuration: "2s" }}
      />
    </div>
  )
}
