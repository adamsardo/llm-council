import { Agent, run } from "@openai/agents";
import {
  type AgentInvocation,
  agentModel,
  type JudgeInput,
  type JudgeOutput,
  judgeInputSchema,
  judgeOutputSchema,
} from "@/lib/agents/contracts";

const judgeAgent = new Agent({
  name: "Council Judge",
  model: agentModel,
  instructions:
    "Evaluate whether the synthesis answers the prompt and fairly represents expert input. Return approve or revise with rationale and revision bullets.",
  outputType: judgeOutputSchema,
});

const buildJudgeInput = ({ prompt, synthesis, responses }: JudgeInput) => {
  const renderedResponses = responses
    .map(
      ({ expert, response }, index) =>
        `${index + 1}. ${expert.trim()}\n${response.trim()}`
    )
    .join("\n\n");

  return [
    `Prompt:\n${prompt.trim()}`,
    `Synthesis:\n${synthesis.trim()}`,
    "Original expert responses:",
    renderedResponses,
    "Return verdict, rationale, and revisions.",
  ].join("\n\n");
};

export const judgeSynthesis: AgentInvocation<JudgeInput, JudgeOutput> = async (
  input
) => {
  const validatedInput = judgeInputSchema.parse(input);
  const result = await run(judgeAgent, buildJudgeInput(validatedInput));

  return judgeOutputSchema.parse(result.finalOutput);
};
