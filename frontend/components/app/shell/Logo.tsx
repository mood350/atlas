import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { dot: "h-5 w-5", text: "text-[15px]" },
  md: { dot: "h-6 w-6", text: "text-[17px]" },
  lg: { dot: "h-8 w-8", text: "text-[22px]" },
};

export function Logo({ className, variant = "full", size = "md" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full bg-primary",
          s.dot,
          "shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]",
        )}
        aria-hidden
      />
      {variant === "full" ? (
        <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>
          AtlasCRM
        </span>
      ) : null}
    </div>
  );
}
