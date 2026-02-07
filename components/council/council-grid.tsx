import type {
  CouncilModelState,
  CouncilSynthesisState,
} from "@/hooks/use-council";
import { CouncilPanel } from "./council-panel";
import { SynthesisPanel } from "./synthesis-panel";
import type { VoteValue } from "./voting-controls";

export function CouncilGrid({
  modelStates,
  synthesis,
  onVote,
}: {
  modelStates: CouncilModelState[];
  synthesis: CouncilSynthesisState;
  onVote?: (modelId: string, vote: VoteValue) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {modelStates.map((modelState) => (
        <CouncilPanel
          key={modelState.modelId}
          modelState={modelState}
          onVote={
            onVote ? (vote) => onVote(modelState.modelId, vote) : undefined
          }
        />
      ))}
      <div className="lg:col-span-2">
        <SynthesisPanel synthesis={synthesis} />
      </div>
    </div>
  );
}
