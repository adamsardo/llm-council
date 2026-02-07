import { gateway } from "@ai-sdk/gateway";
import { convertToModelMessages, streamText } from "ai";
import { z } from "zod";
import { ChatSDKError } from "@/lib/errors";
import {
  enforceDailyMessageLimit,
  requireAuthorizedUser,
} from "../_utils/guards";

export const maxDuration = 60;

const councilRequestSchema = z.object({
  messages: z.array(z.any()).min(1),
  selectedModels: z.array(z.string().min(1)).min(1),
  mode: z.string().optional(),
  synthesiserModel: z.string().optional(),
  sessionId: z.string().optional(),
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
    const { messages, selectedModels, mode, synthesiserModel, sessionId } =
      councilRequestSchema.parse(json);

    const modelMessages = await convertToModelMessages(messages);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        const modelOutputs = new Map<string, string>();

        const run = async () => {
          controller.enqueue(
            encoder.encode(
              formatSseEvent("council-start", {
                sessionId,
                mode,
                selectedModels,
                synthesiserModel,
              })
            )
          );

          await Promise.allSettled(
            selectedModels.map(async (modelId) => {
              try {
                const result = streamText({
                  model: gateway(modelId),
                  messages: modelMessages,
                });

                let accumulated = "";

                for await (const delta of result.textStream) {
                  accumulated += delta;
                  controller.enqueue(
                    encoder.encode(
                      formatSseEvent("council-delta", {
                        sessionId,
                        modelId,
                        delta,
                      })
                    )
                  );
                }

                modelOutputs.set(modelId, accumulated);
                controller.enqueue(
                  encoder.encode(
                    formatSseEvent("council-complete", {
                      sessionId,
                      modelId,
                    })
                  )
                );
              } catch (error) {
                controller.enqueue(
                  encoder.encode(
                    formatSseEvent("council-error", {
                      sessionId,
                      modelId,
                      error:
                        error instanceof Error
                          ? error.message
                          : "Unknown council model error",
                    })
                  )
                );
              }
            })
          );

          if (synthesiserModel && mode === "synthesise") {
            const synthesisPrompt = [
              "Synthesize these candidate council responses into one high-quality answer:",
              ...Array.from(modelOutputs.entries()).map(
                ([modelId, output]) => `Model ${modelId}:\n${output}`
              ),
            ].join("\n\n");

            const synthesiserResult = streamText({
              model: gateway(synthesiserModel),
              prompt: synthesisPrompt,
            });

            for await (const delta of synthesiserResult.textStream) {
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
          }

          controller.enqueue(
            encoder.encode(
              formatSseEvent("council-finished", {
                sessionId,
                mode,
              })
            )
          );
          controller.close();
        };

        run().catch((error) => {
          controller.enqueue(
            encoder.encode(
              formatSseEvent("council-error", {
                sessionId,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown council error",
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
  } catch (error) {
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError("bad_request:api").toResponse();
  }
}
