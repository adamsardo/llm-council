import { Agent, run } from "@openai/agents";
import {
  type AgentInvocation,
  agentModel,
  type DebateModeratorInput,
  type DebateModeratorOutput,
  debateModeratorInputSchema,
  debateModeratorOutputSchema,
} from "@/lib/agents/contracts";

const debateModeratorAgent = new Agent({
  name: "Debate Moderator",
  model: agentModel,
  instructions:
    "Review expert discussion quality. Summarize consensus, identify missing perspectives, and suggest concrete follow-up questions.",
  outputType: debateModeratorOutputSchema,
});

const buildDebateModeratorInput = ({
  prompt,
  responses,
}: DebateModeratorInput) => {
  const renderedResponses = responses
    .map(
      ({ expert, response }, index) =>
        `${index + 1}. ${expert.trim()}\n${response.trim()}`
    )
    .join("\n\n");

  return [
    `Prompt:\n${prompt.trim()}`,
    "Responses:",
    renderedResponses,
    "Return a moderation report.",
  ].join("\n\n");
};

export const moderateDebate: AgentInvocation<
  DebateModeratorInput,
  DebateModeratorOutput
> = async (input) => {
  const validatedInput = debateModeratorInputSchema.parse(input);
  const result = await run(
    debateModeratorAgent,
    buildDebateModeratorInput(validatedInput)
  );

  return debateModeratorOutputSchema.parse(result.finalOutput);
};
