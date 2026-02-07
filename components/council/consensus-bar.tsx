import { Progress } from "@/components/ui/progress";

export function ConsensusBar({ consensus }: { consensus: number }) {
  const value = Math.min(100, Math.max(0, Math.round(consensus)));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Consensus</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
