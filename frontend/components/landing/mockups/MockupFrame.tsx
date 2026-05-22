import { cn } from "@/lib/utils";

interface MockupFrameProps {
  children: React.ReactNode;
  variant?: "browser" | "phone" | "card";
  className?: string;
}

/**
 * Wraps a stylized product mockup with a frame: a browser-chrome stack
 * for desktop UIs, a phone bezel for mobile, or a plain bevelled card.
 * Carries the system's only drop-shadow (—shadow-product).
 */
export function MockupFrame({
  children,
  variant = "browser",
  className,
}: MockupFrameProps) {
  if (variant === "phone") {
    return (
      <div
        className={cn(
          "relative mx-auto overflow-hidden rounded-[2.5rem] border border-border-soft bg-surface shadow-product",
          "w-[260px] aspect-[9/19]",
          className,
        )}
      >
        <div className="absolute left-1/2 top-3 h-1.5 w-20 -translate-x-1/2 rounded-full bg-foreground/10" />
        <div className="h-full pt-10">{children}</div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[18px] border border-border-soft bg-surface shadow-product",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  // browser variant
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] border border-border-soft bg-surface shadow-product",
        className,
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border-soft bg-background-soft px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
        <span className="ml-3 inline-flex h-5 flex-1 items-center justify-center rounded-full bg-background px-3 text-[10px] text-foreground-subtle">
          app.atlascrm.com
        </span>
      </div>
      {children}
    </div>
  );
}
