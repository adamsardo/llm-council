import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CouncilSynthesisState } from "@/hooks/use-council";
import { ConsensusBar } from "./consensus-bar";

export function SynthesisPanel({
  synthesis,
}: {
  synthesis: CouncilSynthesisState;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Synthesis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ConsensusBar consensus={synthesis.consensus} />
        <p className="min-h-20 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
          {synthesis.text ||
            "Synthesis will appear here as council members finish."}
        </p>
      </CardContent>
    </Card>
  );
}
