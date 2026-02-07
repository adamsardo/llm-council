"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatModels } from "@/lib/ai/models";
import { cn } from "@/lib/utils";

export function CouncilModeSelector({
  selectedModels,
  onToggleModel,
}: {
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {chatModels.map((model) => {
        const selected = selectedModels.includes(model.id);

        return (
          <Button
            className={cn(
              "justify-start rounded-full",
              selected && "border-primary bg-primary/10"
            )}
            key={model.id}
            onClick={() => onToggleModel(model.id)}
            size="sm"
            variant="outline"
          >
            {selected && <Check className="mr-1 size-3.5" />}
            {model.name}
          </Button>
        );
      })}
    </div>
  );
}
