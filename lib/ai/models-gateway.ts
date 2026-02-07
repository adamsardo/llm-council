import { type ChatModel, chatModels } from "@/lib/ai/models";

const GATEWAY_MODELS_URL = "https://ai-gateway.vercel.sh/v1/models";
const CACHE_TTL_MS = 5 * 60 * 1000;

type GatewayModel = {
  id?: string;
  name?: string;
  provider?: string;
  display_name?: string;
  description?: string;
  owned_by?: string;
};

export type ModelsResponse = {
  models: ChatModel[];
  source: "gateway" | "fallback";
  fetchedAt: string;
};

let cache: { data: ModelsResponse; expiresAt: number } | null = null;
let pendingRequest: Promise<ModelsResponse> | null = null;

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) =>
      part.length <= 3
        ? part.toUpperCase()
        : part[0].toUpperCase() + part.slice(1)
    )
    .join(" ");
}

function normalizeModel(model: GatewayModel): ChatModel | null {
  const rawId = model.id?.trim();

  if (!rawId) {
    return null;
  }

  const [idProvider, idName] = rawId.includes("/")
    ? rawId.split("/", 2)
    : [undefined, rawId];

  const provider =
    model.provider?.trim().toLowerCase() ??
    model.owned_by?.trim().toLowerCase() ??
    idProvider?.trim().toLowerCase() ??
    "unknown";

  const normalizedName =
    model.name?.trim() ||
    model.display_name?.trim() ||
    toTitleCase((idName ?? rawId).replace(/\.(?=\d)/g, " "));

  return {
    id: rawId,
    provider,
    name: normalizedName,
    description: model.description?.trim() || "Available via AI Gateway",
  };
}

function sortModels(models: ChatModel[]): ChatModel[] {
  return [...models].sort((a, b) => {
    const providerSort = a.provider.localeCompare(b.provider);

    if (providerSort !== 0) {
      return providerSort;
    }

    return a.name.localeCompare(b.name);
  });
}

function normalizeModels(payload: unknown): ChatModel[] {
  const candidateModels = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] })?.data)
      ? (payload as { data: unknown[] }).data
      : Array.isArray((payload as { models?: unknown[] })?.models)
        ? (payload as { models: unknown[] }).models
        : [];

  const seenIds = new Set<string>();

  return sortModels(
    candidateModels
      .map((entry) => normalizeModel(entry as GatewayModel))
      .filter((model): model is ChatModel => {
        if (!model || seenIds.has(model.id)) {
          return false;
        }
        seenIds.add(model.id);
        return true;
      })
  );
}

async function fetchGatewayModels(): Promise<ChatModel[]> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (process.env.AI_GATEWAY_API_KEY) {
    headers.Authorization = `Bearer ${process.env.AI_GATEWAY_API_KEY}`;
  }

  const response = await fetch(GATEWAY_MODELS_URL, {
    headers,
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models (${response.status})`);
  }

  const payload = await response.json();

  return normalizeModels(payload);
}

function fallbackModels(): ChatModel[] {
  return sortModels(chatModels);
}

export async function getModelsFromGateway(): Promise<ModelsResponse> {
  const now = Date.now();

  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = (async () => {
    try {
      const models = await fetchGatewayModels();

      if (models.length === 0) {
        throw new Error("No models returned by gateway");
      }

      return {
        models,
        source: "gateway" as const,
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      return {
        models: fallbackModels(),
        source: "fallback" as const,
        fetchedAt: new Date().toISOString(),
      };
    }
  })();

  try {
    const data = await pendingRequest;
    cache = { data, expiresAt: now + CACHE_TTL_MS };
    return data;
  } finally {
    pendingRequest = null;
  }
}
