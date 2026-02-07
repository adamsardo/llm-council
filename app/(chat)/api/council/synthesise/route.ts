import { gateway } from "@ai-sdk/gateway";
import { streamText } from "ai";
import { z } from "zod";
import { ChatSDKError } from "@/lib/errors";
import {
  enforceDailyMessageLimit,
  requireAuthorizedUser,
} from "../../_utils/guards";

const synthesiseRequestSchema = z.object({
  synthesiserModel: z.string().min(1),
  sessionId: z.string().optional(),
  candidates: z
    .array(
      z.object({
        modelId: z.string().min(1),
        text: z.string(),
      })
    )
    .min(1),
});

function formatSseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

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
    const { synthesiserModel, sessionId, candidates } =
      synthesiseRequestSchema.parse(json);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();

        const run = async () => {
          const prompt = [
            "Synthesize these candidate answers into one concise, high-quality response.",
            ...candidates.map(
              ({ modelId, text }) => `Model ${modelId} candidate:\n${text}`
            ),
          ].join("\n\n");

          const result = streamText({
            model: gateway(synthesiserModel),
            prompt,
          });

          for await (const delta of result.textStream) {
            controller.enqueue(
              encoder.encode(
                formatSseEvent("synthesiser-delta", {
                  sessionId,
                  modelId: synthesiserModel,
                  delta,
                })
              )
            );
          }

          controller.enqueue(
            encoder.encode(
              formatSseEvent("synthesiser-complete", {
                sessionId,
                modelId: synthesiserModel,
              })
            )
          );

          controller.close();
        };

        run().catch((error) => {
          controller.enqueue(
            encoder.encode(
              formatSseEvent("synthesiser-error", {
                sessionId,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown synthesis error",
              })
            )
          );
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }
}
