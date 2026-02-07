"use client";

import { useCallback, useMemo, useState } from "react";
import { chatModels, DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { CouncilStreamEvent } from "./use-council-stream";

export type CouncilModelState = {
  modelId: string;
  text: string;
  status: "idle" | "streaming" | "done" | "error";
  latencyMs?: number;
  vote?: "accept" | "reject" | "abstain";
  error?: string;
};

export type CouncilSynthesisState = {
  text: string;
  status: "idle" | "streaming" | "done" | "error";
  consensus: number;
  error?: string;
};

const DEFAULT_COUNCIL_MODELS = [
  DEFAULT_CHAT_MODEL,
  "openai/gpt-5.2",
  "anthropic/claude-sonnet-4.5",
];

export function useCouncil(initialModels: string[] = DEFAULT_COUNCIL_MODELS) {
  const [selectedModels, setSelectedModels] = useState<string[]>(
    initialModels.length > 0 ? initialModels : [DEFAULT_CHAT_MODEL]
  );

  const [modelStates, setModelStates] = useState<
    Record<string, CouncilModelState>
  >({});

  const [synthesis, setSynthesis] = useState<CouncilSynthesisState>({
    text: "",
    status: "idle",
    consensus: 0,
  });

  const ensureModelState = useCallback((modelId: string) => {
    setModelStates((prev) => {
      if (prev[modelId]) {
        return prev;
      }

      return {
        ...prev,
        [modelId]: {
          modelId,
          text: "",
          status: "idle",
        },
      };
    });
  }, []);

  const toggleModel = useCallback(
    (modelId: string) => {
      setSelectedModels((current) => {
        if (current.includes(modelId)) {
          if (current.length === 1) {
            return current;
          }
          return current.filter((id) => id !== modelId);
        }

        return [...current, modelId];
      });

      ensureModelState(modelId);
    },
    [ensureModelState]
  );

  const resetCouncil = useCallback(() => {
    setModelStates({});
    setSynthesis({ text: "", status: "idle", consensus: 0 });
  }, []);

  const onStreamEvent = useCallback(
    (event: CouncilStreamEvent) => {
      if (event.type === "reset") {
        resetCouncil();
        return;
      }

      if (event.type === "synthesis-chunk") {
        setSynthesis((prev) => ({
          ...prev,
          text: `${prev.text}${event.delta ?? event.text ?? ""}`,
          status: "streaming",
        }));
        return;
      }

      if (event.type === "synthesis-done") {
        setSynthesis((prev) => ({
          ...prev,
          status: "done",
          consensus: event.consensus ?? prev.consensus,
        }));
        return;
      }

      if (event.type === "error") {
        if (event.modelId) {
          const modelId = event.modelId;

          setModelStates((prev) => ({
            ...prev,
            [modelId]: {
              modelId,
              text: prev[modelId]?.text ?? "",
              status: "error",
              error: event.message,
              latencyMs: prev[modelId]?.latencyMs,
              vote: prev[modelId]?.vote,
            },
          }));
        } else {
          setSynthesis((prev) => ({
            ...prev,
            status: "error",
            error: event.message,
          }));
        }
        return;
      }

      if (!event.modelId) {
        return;
      }

      const modelId = event.modelId;

      if (event.type === "model-chunk") {
        setModelStates((prev) => ({
          ...prev,
          [modelId]: {
            modelId,
            text: `${prev[modelId]?.text ?? ""}${event.delta ?? event.text ?? ""}`,
            status: "streaming",
            latencyMs: event.latencyMs ?? prev[modelId]?.latencyMs,
            vote: prev[modelId]?.vote,
          },
        }));
        return;
      }

      if (event.type === "model-done" || event.type === "vote-update") {
        setModelStates((prev) => ({
          ...prev,
          [modelId]: {
            modelId,
            text: prev[modelId]?.text ?? "",
            status:
              event.type === "model-done"
                ? "done"
                : (prev[modelId]?.status ?? "idle"),
            latencyMs: event.latencyMs ?? prev[modelId]?.latencyMs,
            vote: event.vote ?? prev[modelId]?.vote,
          },
        }));
      }
    },
    [resetCouncil]
  );

  const selectedModelOptions = useMemo(
    () => chatModels.filter((model) => selectedModels.includes(model.id)),
    [selectedModels]
  );

  return {
    selectedModels,
    setSelectedModels,
    selectedModelOptions,
    toggleModel,
    modelStates,
    synthesis,
    resetCouncil,
    onStreamEvent,
  };
}
