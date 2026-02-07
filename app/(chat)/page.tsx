import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function Page(props: { searchParams: PageSearchParams }) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <NewChatPage searchParams={props.searchParams} />
    </Suspense>
  );
}

async function NewChatPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const newMode = resolvedSearchParams.new;
  const entryMode = Array.isArray(newMode) ? newMode[0] : newMode;

  if (entryMode === "council") {
    redirect(`/council/${generateUUID()}`);
  }

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");
  const id = generateUUID();

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={modelIdFromCookie.value}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
