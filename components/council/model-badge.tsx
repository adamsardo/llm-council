import { Badge } from "@/components/ui/badge";
import { chatModels } from "@/lib/ai/models";

export function ModelBadge({ modelId }: { modelId: string }) {
  const model = chatModels.find((candidate) => candidate.id === modelId);

  return (
    <Badge className="rounded-full" variant="secondary">
      {model?.name ?? modelId}
    </Badge>
  );
}
