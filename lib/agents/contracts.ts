import { z } from "zod";

export const agentModel = "gpt-4.1-mini";

export const councilResponseSchema = z.object({
  expert: z.string().min(1),
  response: z.string().min(1),
});

export const councilResponsesSchema = z.array(councilResponseSchema).min(1);

export const synthesiseInputSchema = z.object({
  prompt: z.string().min(1),
  responses: councilResponsesSchema,
});

export const synthesiseOutputSchema = z.object({
  synthesis: z.string().min(1),
});

export const debateModeratorInputSchema = z.object({
  prompt: z.string().min(1),
  responses: councilResponsesSchema,
});

export const debateModeratorOutputSchema = z.object({
  summary: z.string().min(1),
  missingPerspectives: z.array(z.string().min(1)),
  followUpQuestions: z.array(z.string().min(1)),
});

export const expertRouterInputSchema = z.object({
  prompt: z.string().min(1),
  availableExperts: z.array(z.string().min(1)).min(1),
  maxExperts: z.number().int().min(1).max(10).default(3),
});

export const expertRouterOutputSchema = z.object({
  selectedExperts: z.array(z.string().min(1)).min(1),
  rationale: z.string().min(1),
});

export const judgeInputSchema = z.object({
  prompt: z.string().min(1),
  synthesis: z.string().min(1),
  responses: councilResponsesSchema,
});

export const judgeOutputSchema = z.object({
  verdict: z.enum(["approve", "revise"]),
  rationale: z.string().min(1),
  revisions: z.array(z.string().min(1)),
});

export type CouncilResponse = z.infer<typeof councilResponseSchema>;

export type SynthesiseInput = z.infer<typeof synthesiseInputSchema>;
export type SynthesiseOutput = z.infer<typeof synthesiseOutputSchema>;

export type DebateModeratorInput = z.infer<typeof debateModeratorInputSchema>;
export type DebateModeratorOutput = z.infer<typeof debateModeratorOutputSchema>;

export type ExpertRouterInput = z.infer<typeof expertRouterInputSchema>;
export type ExpertRouterOutput = z.infer<typeof expertRouterOutputSchema>;

export type JudgeInput = z.infer<typeof judgeInputSchema>;
export type JudgeOutput = z.infer<typeof judgeOutputSchema>;

export type AgentInvocation<TInput, TOutput> = (
  input: TInput
) => Promise<TOutput>;
