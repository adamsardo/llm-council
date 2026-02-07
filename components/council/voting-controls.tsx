"use client";

import { Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VoteValue = "accept" | "reject" | "abstain";

export function VotingControls({
  value,
  onChange,
}: {
  value?: VoteValue;
  onChange: (nextValue: VoteValue) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button
        onClick={() => onChange("accept")}
        size="sm"
        variant={value === "accept" ? "default" : "outline"}
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        onClick={() => onChange("reject")}
        size="sm"
        variant={value === "reject" ? "destructive" : "outline"}
      >
        <X className="size-3.5" />
      </Button>
      <Button
        onClick={() => onChange("abstain")}
        size="sm"
        variant={value === "abstain" ? "secondary" : "outline"}
      >
        <Minus className="size-3.5" />
      </Button>
    </div>
  );
}
