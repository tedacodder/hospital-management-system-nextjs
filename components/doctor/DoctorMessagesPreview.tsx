"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader, EmptyState, LoadingRows } from "@/components/ui/Card";
import { InboxIcon } from "@/components/ui/Icons";
import type { ConversationSummary } from "@/components/doctor/types";
import { relativeTime } from "@/lib/patient-ui";

function otherParticipants(c: ConversationSummary, myId: number | undefined) {
  return myId ? c.participants.filter((p) => p.id !== myId) : c.participants;
}

function conversationLabel(c: ConversationSummary, myId: number | undefined) {
  const others = otherParticipants(c, myId);
  if (others.length === 0) return "Conversation";
  return others.map((p) => (p.role === "PATIENT" ? p.name ?? "Patient" : p.name ?? "Unknown")).join(", ");
}

/// A quiet preview, not a second inbox: the last few threads with an unread
/// mark, each linking straight into the full conversation at /dashboard/messages.
export function DoctorMessagesPreview({
  conversations,
  myId,
}: {
  conversations: ConversationSummary[] | null;
  myId: number | undefined;
}) {
  const recent = conversations?.slice(0, 4) ?? null;

  return (
    <Card padded={false}>
      <div className="px-5 pt-5">
        <CardHeader title="Messages" action={<Link href="/dashboard/messages" className="text-sm font-medium text-accent-700 hover:underline">View all</Link>} />
      </div>

      <div className="px-5 pb-5">
        {recent === null ? (
          <LoadingRows rows={3} />
        ) : recent.length === 0 ? (
          <EmptyState icon={<InboxIcon />} title="No conversations yet" body="Messages from patients and staff will appear here." />
        ) : (
          <ul className="-mx-5 divide-y divide-rule">
            {recent.map((c) => {
              const label = conversationLabel(c, myId);
              const preview = c.lastMessage
                ? `${c.lastMessage.senderId === myId ? "You: " : ""}${c.lastMessage.body}`
                : "No messages yet";
              return (
                <li key={c.id}>
                  <Link href="/dashboard/messages" className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-paper">
                    <Avatar name={label} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${c.hasUnread ? "font-semibold" : "font-medium"} text-ink-900`}>{label}</span>
                        <span className="shrink-0 text-xs text-ink-500">{relativeTime(c.lastMessage?.createdAt ?? c.updatedAt)}</span>
                      </span>
                      <span className={`block truncate text-xs ${c.hasUnread ? "text-ink-900" : "text-ink-500"}`}>{preview}</span>
                    </span>
                    {c.hasUnread && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-accent-600" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
