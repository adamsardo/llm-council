import { cn } from "@/lib/utils";

export function LatencyIndicator({ latencyMs }: { latencyMs?: number }) {
  const latencyLabel =
    latencyMs === undefined ? "Pending" : `${Math.round(latencyMs)}ms`;

  return (
    <div className="flex items-center gap-1 text-muted-foreground text-xs">
      <span
        className={cn(
          "size-2 rounded-full",
          latencyMs === undefined
            ? "bg-muted"
            : latencyMs < 1500
              ? "bg-emerald-500"
              : latencyMs < 3500
                ? "bg-amber-500"
                : "bg-rose-500"
        )}
      />
      <span>{latencyLabel}</span>
    </div>
  );
}
