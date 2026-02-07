import { gateway } from "@ai-sdk/gateway";
import { convertToModelMessages, generateText } from "ai";
import { z } from "zod";
import { ChatSDKError } from "@/lib/errors";
import {
  enforceDailyMessageLimit,
  requireAuthorizedUser,
} from "../../_utils/guards";

const voteRequestSchema = z.object({
  messages: z.array(z.any()).min(1),
  selectedModels: z.array(z.string().min(1)).min(1),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const authorized = await requireAuthorizedUser();

    if ("response" in authorized) {
      return authorized.response;
    }

    const rateLimitResponse = await enforceDailyMessageLimit(authorized.user);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const json = await request.json();
    const { messages, selectedModels, sessionId } =
      voteRequestSchema.parse(json);

    const modelMessages = await convertToModelMessages(messages);

    const candidates = await Promise.all(
      selectedModels.map(async (modelId) => {
        const result = await generateText({
          model: gateway(modelId),
          messages: modelMessages,
        });

        return { modelId, text: result.text };
      })
    );

    const winner = candidates.reduce((best, current) =>
      current.text.length > best.text.length ? current : best
    );

    return Response.json(
      {
        sessionId,
        winnerModelId: winner.modelId,
        candidates,
      },
      { status: 200 }
    );
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }
}
