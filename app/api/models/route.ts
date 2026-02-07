import { groupModelsByProvider } from "@/lib/ai/models";
import { getModelsFromGateway } from "@/lib/ai/models-gateway";

export async function GET() {
  const data = await getModelsFromGateway();

  return Response.json({
    models: data.models,
    groupedByProvider: groupModelsByProvider(data.models),
    source: data.source,
    fetchedAt: data.fetchedAt,
  });
}
