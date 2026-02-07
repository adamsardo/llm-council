import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { requireAuthorizedUser } from "../../_utils/guards";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authorized = await requireAuthorizedUser();

  if ("response" in authorized) {
    return authorized.response;
  }

  const chat = await getChatById({ id });

  if (!chat) {
    return new ChatSDKError("not_found:chat").toResponse();
  }

  if (chat.userId !== authorized.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const messages = await getMessagesByChatId({ id });

  return Response.json(
    {
      id,
      messages,
    },
    { status: 200 }
  );
}
