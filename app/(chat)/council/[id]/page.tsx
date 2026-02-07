"use client";

import { useMemo } from "react";
import { CouncilGrid } from "@/components/council/council-grid";
import { CouncilModeSelector } from "@/components/council/council-mode-selector";
import { Button } from "@/components/ui/button";
import { useCouncil } from "@/hooks/use-council";

export default function CouncilPage({ params }: { params: { id: string } }) {
  const {
    selectedModels,
    toggleModel,
    modelStates,
    synthesis,
    onStreamEvent,
    resetCouncil,
  } = useCouncil();

  const orderedStates = useMemo(
    () =>
      selectedModels.map(
        (modelId) =>
          modelStates[modelId] ?? {
            modelId,
            text: "",
            status: "idle" as const,
          }
      ),
    [modelStates, selectedModels]
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-semibold text-xl">Council Session {params.id}</h1>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              onStreamEvent({
                type: "synthesis-chunk",
                text: "Run started. Awaiting council streams...\n",
              })
            }
            variant="outline"
          >
            Simulate Stream
          </Button>
          <Button onClick={resetCouncil} variant="ghost">
            Reset
          </Button>
        </div>
      </div>

      <CouncilModeSelector
        onToggleModel={toggleModel}
        selectedModels={selectedModels}
      />

      <CouncilGrid
        modelStates={orderedStates}
        onVote={(modelId, vote) =>
          onStreamEvent({ type: "vote-update", modelId, vote })
        }
        synthesis={synthesis}
      />
    </div>
  );
}
