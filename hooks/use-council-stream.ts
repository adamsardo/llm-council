"use client";

import { useEffect } from "react";

export type CouncilStreamEventType =
  | "model-chunk"
  | "model-done"
  | "synthesis-chunk"
  | "synthesis-done"
  | "vote-update"
  | "status"
  | "error"
  | "reset";

export type CouncilStreamEvent = {
  type: CouncilStreamEventType;
  modelId?: string;
  delta?: string;
  text?: string;
  latencyMs?: number;
  consensus?: number;
  vote?: "accept" | "reject" | "abstain";
  message?: string;
};

const MULTIPLEXED_EVENT_TYPES: CouncilStreamEventType[] = [
  "model-chunk",
  "model-done",
  "synthesis-chunk",
  "synthesis-done",
  "vote-update",
  "status",
  "error",
  "reset",
];

export function parseMultiplexedSSEEvent({
  event,
  data,
}: {
  event?: string;
  data: string;
}): CouncilStreamEvent | null {
  const parsed = JSON.parse(data) as Partial<CouncilStreamEvent>;
  const resolvedType =
    (event as CouncilStreamEventType | undefined) ??
    (parsed.type as CouncilStreamEventType | undefined);

  if (!resolvedType || !MULTIPLEXED_EVENT_TYPES.includes(resolvedType)) {
    return null;
  }

  return {
    ...parsed,
    type: resolvedType,
  };
}

export function useCouncilStream({
  enabled,
  streamUrl,
  onEvent,
  onError,
}: {
  enabled: boolean;
  streamUrl: string;
  onEvent: (event: CouncilStreamEvent) => void;
  onError?: (error: Error) => void;
}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const eventSource = new EventSource(streamUrl);

    const handleMessage = (message: MessageEvent) => {
      try {
        const parsed = parseMultiplexedSSEEvent({ data: message.data });
        if (parsed) {
          onEvent(parsed);
        }
      } catch (error) {
        onError?.(
          error instanceof Error
            ? error
            : new Error("Failed to parse council SSE message")
        );
      }
    };

    for (const eventType of MULTIPLEXED_EVENT_TYPES) {
      eventSource.addEventListener(eventType, (message) => {
        try {
          const parsed = parseMultiplexedSSEEvent({
            event: eventType,
            data: (message as MessageEvent).data,
          });
          if (parsed) {
            onEvent(parsed);
          }
        } catch (error) {
          onError?.(
            error instanceof Error
              ? error
              : new Error(`Failed to parse ${eventType} council event`)
          );
        }
      });
    }

    eventSource.addEventListener("message", handleMessage);
    eventSource.addEventListener("error", () => {
      onError?.(new Error("Council stream connection error"));
    });

    return () => {
      eventSource.removeEventListener("message", handleMessage);
      eventSource.close();
    };
  }, [enabled, onError, onEvent, streamUrl]);
}
