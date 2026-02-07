import { Agent, run } from "@openai/agents";
import {
  type AgentInvocation,
  agentModel,
  type ExpertRouterInput,
  type ExpertRouterOutput,
  expertRouterInputSchema,
  expertRouterOutputSchema,
} from "@/lib/agents/contracts";

const expertRouterAgent = new Agent({
  name: "Expert Router",
  model: agentModel,
  instructions:
    "Select the most relevant experts for a prompt. Choose diverse viewpoints and explain your selection.",
  outputType: expertRouterOutputSchema,
});

const buildExpertRouterInput = ({
  prompt,
  availableExperts,
  maxExperts,
}: ExpertRouterInput) =>
  [
    `Prompt:\n${prompt.trim()}`,
    `Maximum experts to select: ${maxExperts}`,
    `Available experts:\n${availableExperts.join("\n")}`,
    "Return selectedExperts and rationale.",
  ].join("\n\n");

export const routeExperts: AgentInvocation<
  ExpertRouterInput,
  ExpertRouterOutput
> = async (input) => {
  const validatedInput = expertRouterInputSchema.parse(input);
  const result = await run(
    expertRouterAgent,
    buildExpertRouterInput(validatedInput)
  );

  const output = expertRouterOutputSchema.parse(result.finalOutput);

  return {
    ...output,
    selectedExperts: output.selectedExperts.slice(0, validatedInput.maxExperts),
  };
};
