"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/Card";
import { ArrowLeftIcon, InboxIcon, MessageIcon, PlusIcon, SendIcon } from "@/components/ui/Icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiGet, apiSend } from "@/lib/api-client";
import { dayHeading, friendlyError, isSameDay, relativeTime } from "@/lib/patient-ui";
import { NewConversationDialog } from "./NewConversationDialog";

type ConversationSummary = {
  id: number;
  subject: string | null;
  updatedAt: string;
  participants: { id: number; name: string | null; role: string }[];
  lastMessage: { id: number; body: string; createdAt: string; senderId: number } | null;
  hasUnread: boolean;
};

type Message = {
  id: number;
  body: string;
  createdAt: string;
  sender: { id: number; name: string | null; role: string };
};

const LIST_POLL_MS = 15_000;
const THREAD_POLL_MS = 6_000;
const MAX_COMPOSER_PX = 128;

function otherParticipants(c: ConversationSummary, myId: number | undefined) {
  return myId ? c.participants.filter((p) => p.id !== myId) : c.participants;
}

function displayName(p: { name: string | null; role: string }) {
  return p.role === "DOCTOR" ? `Dr. ${p.name}` : p.name ?? "Unknown";
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function conversationLabel(c: ConversationSummary, myId: number | undefined) {
  return otherParticipants(c, myId).map(displayName).join(", ") || "Conversation";
}

/// Everything here polls; there is no WebSocket server in this application, and
/// the UI is deliberately built so it never implies delivery is instant.
export default function MessagesClient() {
  const { data: session } = useSession();
  const myId = session?.user?.id;
  const isPatient = session?.user?.role === "PATIENT";

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [listError, setListError] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastCountRef = useRef(0);

  const loadConversations = useCallback(() => {
    apiGet<ConversationSummary[]>("/conversations")
      .then((list) => {
        setConversations(list);
        setListError(false);
      })
      .catch(() => {
        // A failed poll must not wipe a list that is already on screen.
        setConversations((prev) => {
          if (prev === null) setListError(true);
          return prev;
        });
      });
  }, []);

  useEffect(() => {
    loadConversations();
    const id = setInterval(loadConversations, LIST_POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  const loadMessages = useCallback((conversationId: number) => {
    apiGet<Message[]>(`/conversations/${conversationId}/messages`)
      .then(setMessages)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeId === null) return;
    setMessages(null);
    lastCountRef.current = 0;
    loadMessages(activeId);
    const id = setInterval(() => loadMessages(activeId), THREAD_POLL_MS);
    return () => clearInterval(id);
  }, [activeId, loadMessages]);

  // Follow the conversation only when something new arrives (or on first load),
  // so polling never yanks the view away from someone reading earlier messages.
  useEffect(() => {
    if (!messages || messages.length === lastCountRef.current) return;
    lastCountRef.current = messages.length;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Grow the composer with its content, up to a limit.
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_PX)}px`;
  }, [draft, activeId]);

  function openConversation(id: number) {
    setActiveId(id);
    setSendError(null);
    setShowListOnMobile(false);
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, hasUnread: false } : c)) ?? null);
  }

  async function handleSend() {
    if (!activeId || !draft.trim() || sending) return;
    setSending(true);
    setSendError(null);
    const body = draft;
    setDraft("");
    try {
      await apiSend("POST", `/conversations/${activeId}/messages`, { body });
      loadMessages(activeId);
      loadConversations();
    } catch (err) {
      // Give the words back — they may have taken a while to write.
      setDraft(body);
      setSendError(friendlyError(err, "Your message wasn't sent. Check your connection and try again."));
    } finally {
      setSending(false);
      composerRef.current?.focus();
    }
  }

  async function handleCreate(recipientId: number, body: string) {
    const conv = await apiSend<{ id: number }>("POST", "/conversations", {
      participantIds: [recipientId],
      body,
    });
    setComposeOpen(false);
    loadConversations();
    openConversation(conv.id);
  }

  const active = conversations?.find((c) => c.id === activeId) ?? null;
  const activeOthers = active ? otherParticipants(active, myId) : [];

  // Heights account for the header and, for patients on phones, the tab bar.
  const height = isPatient
    ? "h-[calc(100dvh-13rem)] md:h-[calc(100dvh-9rem)]"
    : "h-[calc(100dvh-8.5rem)] md:h-[calc(100dvh-9rem)]";

  return (
    <AppShell>
      <h1 className="sr-only">Messages</h1>

      <div className={`${height} flex min-h-[26rem] overflow-hidden rounded-xl border border-rule bg-surface`}>
        {/* Conversation list */}
        <section
          aria-label="Conversations"
          className={`w-full flex-col border-r border-rule sm:w-80 sm:shrink-0 ${showListOnMobile ? "flex" : "hidden sm:flex"}`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
            <p className="text-base font-semibold text-ink-900" aria-hidden="true">
              Messages
            </p>
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              New message
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listError ? (
              <div className="p-4">
                <ErrorState
                  message="We couldn't load your conversations."
                  onRetry={() => {
                    setListError(false);
                    loadConversations();
                  }}
                />
              </div>
            ) : conversations === null ? (
              <div className="space-y-1 p-3" role="status" aria-label="Loading conversations" aria-busy="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/5" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<InboxIcon />}
                  title="No conversations yet"
                  body="Start one with a doctor or member of the clinic team."
                  action={
                    <Button size="sm" onClick={() => setComposeOpen(true)}>
                      New message
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul>
                {conversations.map((c) => {
                  const others = otherParticipants(c, myId);
                  const label = conversationLabel(c, myId);
                  const selected = activeId === c.id;
                  const preview = c.lastMessage
                    ? `${c.lastMessage.senderId === myId ? "You: " : ""}${c.lastMessage.body}`
                    : "No messages yet";
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => openConversation(c.id)}
                        aria-current={selected ? "true" : undefined}
                        className={`flex w-full items-center gap-3 border-b border-rule px-4 py-3 text-left transition-colors hover:bg-paper ${
                          selected ? "bg-accent-050/70" : ""
                        }`}
                      >
                        <Avatar name={others[0]?.name ?? label} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={`truncate text-sm ${c.hasUnread ? "font-semibold" : "font-medium"} text-ink-900`}>
                              {label}
                            </span>
                            <span className="shrink-0 text-xs text-ink-500">
                              {relativeTime(c.lastMessage?.createdAt ?? c.updatedAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-2">
                            <span className={`truncate text-sm ${c.hasUnread ? "text-ink-900" : "text-ink-500"}`}>{preview}</span>
                            {c.hasUnread && (
                              <>
                                <span aria-hidden="true" className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent-600" />
                                <span className="sr-only">Unread</span>
                              </>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Thread */}
        <section aria-label="Conversation" className={`min-w-0 flex-1 flex-col ${showListOnMobile ? "hidden sm:flex" : "flex"}`}>
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-050 text-accent-700">
                <MessageIcon className="h-6 w-6" />
              </span>
              <p className="text-[0.9375rem] font-semibold text-ink-900">Select a conversation</p>
              <p className="max-w-xs text-sm text-ink-500">Choose one from the list, or start a new message.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-rule px-3 py-3 sm:px-4">
                <button
                  type="button"
                  onClick={() => setShowListOnMobile(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-ink-700 transition-colors hover:bg-ink-900/5 sm:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <Avatar name={activeOthers[0]?.name ?? conversationLabel(active, myId)} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{conversationLabel(active, myId)}</p>
                  {activeOthers.length > 0 && (
                    <p className="truncate text-xs text-ink-500">{activeOthers.map((p) => roleLabel(p.role)).join(", ")}</p>
                  )}
                </div>
              </div>

              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Messages in this conversation"
                className="flex-1 overflow-y-auto bg-paper px-3 py-4 sm:px-5"
              >
                {messages === null ? (
                  <div className="space-y-3" role="status" aria-label="Loading messages" aria-busy="true">
                    <Skeleton className="h-12 w-3/5 rounded-xl" />
                    <Skeleton className="ml-auto h-12 w-1/2 rounded-xl" />
                    <Skeleton className="h-12 w-2/3 rounded-xl" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-ink-500">No messages yet. Say hello below.</p>
                ) : (
                  <div className="flex flex-col">
                    {messages.map((m, i) => {
                      const mine = m.sender.id === myId;
                      const prev = messages[i - 1];
                      const newDay = !prev || !isSameDay(prev.createdAt, m.createdAt);
                      const grouped = !newDay && prev?.sender.id === m.sender.id;
                      return (
                        <div key={m.id}>
                          {newDay && (
                            <div className="my-3 flex justify-center first:mt-0">
                              <span className="rounded-full bg-ink-900/5 px-3 py-1 text-xs font-medium text-ink-500">
                                {dayHeading(m.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-1" : "mt-3"}`}>
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed sm:max-w-[75%] ${
                                mine
                                  ? "rounded-br-md bg-accent-700 text-white"
                                  : "rounded-bl-md border border-rule bg-surface text-ink-900"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                              <p className={`mt-1 font-mono text-[10px] ${mine ? "text-white/75" : "text-ink-500"}`}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-rule bg-surface p-3">
                {sendError && (
                  <p role="alert" className="mb-2 rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
                    {sendError}
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <label htmlFor="composer" className="sr-only">
                    Write a message
                  </label>
                  <textarea
                    id="composer"
                    ref={composerRef}
                    rows={1}
                    value={draft}
                    maxLength={4000}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Write a message"
                    className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-control bg-surface px-3.5 py-2.5 text-[1rem] leading-snug text-ink-900 placeholder:text-ink-500 transition-[border-color,box-shadow] hover:border-ink-500 focus-visible:border-accent-600 focus-visible:shadow-[0_0_0_4px_rgb(26_145_135/0.16)]"
                  />
                  <Button size="touch" loading={sending} disabled={!draft.trim()} onClick={handleSend}>
                    <SendIcon className="h-[18px] w-[18px]" />
                    <span className="sr-only sm:not-sr-only">Send</span>
                  </Button>
                </div>
                <p className="mt-1.5 hidden text-xs text-ink-500 sm:block">Enter to send · Shift + Enter for a new line</p>
              </div>
            </>
          )}
        </section>
      </div>

      <NewConversationDialog open={composeOpen} onClose={() => setComposeOpen(false)} onCreate={handleCreate} />
    </AppShell>
  );
}
