import { gateway } from "@ai-sdk/gateway";
import { ChatSDKError } from "@/lib/errors";
import { requireAuthorizedUser } from "../_utils/guards";

export async function GET() {
  try {
    const authorized = await requireAuthorizedUser();

    if ("response" in authorized) {
      return authorized.response;
    }

    const modelsMetadata = await gateway.getAvailableModels();

    const languageModels = modelsMetadata.models.filter(
      (model) => model.modelType === "language" || model.modelType == null
    );

    return Response.json({ models: languageModels }, { status: 200 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    return new ChatSDKError("offline:chat").toResponse();
  }
}
