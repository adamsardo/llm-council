import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CouncilModelState } from "@/hooks/use-council";
import { LatencyIndicator } from "./latency-indicator";
import { ModelBadge } from "./model-badge";
import { type VoteValue, VotingControls } from "./voting-controls";

export function CouncilPanel({
  modelState,
  onVote,
}: {
  modelState: CouncilModelState;
  onVote?: (vote: VoteValue) => void;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">
            <ModelBadge modelId={modelState.modelId} />
          </CardTitle>
          <LatencyIndicator latencyMs={modelState.latencyMs} />
        </div>
        {onVote && <VotingControls onChange={onVote} value={modelState.vote} />}
      </CardHeader>
      <CardContent>
        <p className="min-h-24 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
          {modelState.text || "Waiting for response..."}
        </p>
      </CardContent>
    </Card>
  );
}
