import { Agent, run } from "@openai/agents";
import {
  type AgentInvocation,
  agentModel,
  type SynthesiseInput,
  type SynthesiseOutput,
  synthesiseInputSchema,
  synthesiseOutputSchema,
} from "@/lib/agents/contracts";

const synthesiserAgent = new Agent({
  name: "Council Synthesiser",
  model: agentModel,
  instructions:
    "Combine expert responses into a single cohesive synthesis. Preserve nuance, call out points of agreement/disagreement, and end with practical guidance.",
  outputType: synthesiseOutputSchema,
});

const buildSynthesiserInput = ({ prompt, responses }: SynthesiseInput) => {
  const renderedResponses = responses
    .map(
      ({ expert, response }, index) =>
        `${index + 1}. ${expert.trim()}\n${response.trim()}`
    )
    .join("\n\n");

  return [
    `User prompt:\n${prompt.trim()}`,
    "Expert responses:",
    renderedResponses,
    "Produce a synthesis that is concise, accurate, and actionable.",
  ].join("\n\n");
};

export const synthesise: AgentInvocation<
  SynthesiseInput,
  SynthesiseOutput
> = async (input) => {
  const validatedInput = synthesiseInputSchema.parse(input);
  const result = await run(
    synthesiserAgent,
    buildSynthesiserInput(validatedInput)
  );

  return synthesiseOutputSchema.parse(result.finalOutput);
};
