import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { getMessageCountByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

type AuthorizedUser = {
  id: string;
  type: UserType;
};

export async function requireAuthorizedUser(): Promise<
  { user: AuthorizedUser } | { response: Response }
> {
  const session = await auth();

  if (!session?.user) {
    return { response: new ChatSDKError("unauthorized:chat").toResponse() };
  }

  return {
    user: {
      id: session.user.id,
      type: session.user.type,
    },
  };
}

export async function enforceDailyMessageLimit(
  user: AuthorizedUser
): Promise<Response | null> {
  const messageCount = await getMessageCountByUserId({
    id: user.id,
    differenceInHours: 24,
  });

  if (messageCount > entitlementsByUserType[user.type].maxMessagesPerDay) {
    return new ChatSDKError("rate_limit:chat").toResponse();
  }

  return null;
}
