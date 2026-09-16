"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingRows } from "@/components/ui/Card";
import { apiGet, apiSend } from "@/lib/api-client";
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

function otherParticipants(c: ConversationSummary, myId: number) {
  return c.participants.filter((p) => p.id !== myId);
}

function displayName(p: { name: string | null; role: string }) {
  return p.role === "DOCTOR" ? `Dr. ${p.name}` : p.name ?? "Unknown";
}

/// Everything here polls; there is no WebSocket server in this application, and
/// the UI is deliberately built so it never implies delivery is instant.
export default function MessagesClient() {
  const { data: session } = useSession();
  const myId = session?.user?.id;

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(() => {
    apiGet<ConversationSummary[]>("/conversations")
      .then(setConversations)
      .catch(() => setConversations((prev) => prev ?? []));
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
    loadMessages(activeId);
    const id = setInterval(() => loadMessages(activeId), THREAD_POLL_MS);
    return () => clearInterval(id);
  }, [activeId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function openConversation(id: number) {
    setActiveId(id);
    setShowListOnMobile(false);
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, hasUnread: false } : c)) ?? null);
  }

  async function handleSend() {
    if (!activeId || !draft.trim()) return;
    setSending(true);
    const body = draft;
    setDraft("");
    try {
      await apiSend("POST", `/conversations/${activeId}/messages`, { body });
      loadMessages(activeId);
      loadConversations();
    } finally {
      setSending(false);
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

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-6.5rem)] overflow-hidden rounded-lg border border-rule bg-surface">
        {/* Conversation list */}
        <div
          className={`flex w-full flex-col border-r border-rule sm:w-72 ${
            showListOnMobile ? "flex" : "hidden sm:flex"
          }`}
        >
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <h1 className="text-sm font-semibold text-ink-900">Messages</h1>
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              New
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations === null ? (
              <div className="p-3">
                <LoadingRows rows={4} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState title="No conversations yet" body="Start one with the New button above." />
              </div>
            ) : (
              conversations.map((c) => {
                const others = myId ? otherParticipants(c, myId) : c.participants;
                const label = others.map(displayName).join(", ") || "Conversation";
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-rule px-4 py-3 text-left hover:bg-paper ${
                      activeId === c.id ? "bg-accent-050" : ""
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={`truncate text-sm ${c.hasUnread ? "font-semibold text-ink-900" : "font-medium text-ink-900"}`}>
                        {label}
                      </span>
                      {c.hasUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-accent-700" />}
                    </div>
                    {c.lastMessage && (
                      <span className="w-full truncate text-xs text-ink-500">{c.lastMessage.body}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex flex-1 flex-col ${showListOnMobile ? "hidden sm:flex" : "flex"}`}>
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-500">
              Select a conversation, or start a new one.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-rule px-4 py-3">
                <button
                  onClick={() => setShowListOnMobile(true)}
                  className="rounded-md p-1 text-ink-700 hover:bg-ink-900/5 sm:hidden"
                  aria-label="Back to conversations"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M11 3 5 9l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <p className="text-sm font-semibold text-ink-900">
                  {(myId ? otherParticipants(active, myId) : active.participants).map(displayName).join(", ")}
                </p>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
                {messages === null ? (
                  <LoadingRows rows={3} />
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((m) => {
                      const mine = m.sender.id === myId;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                              mine ? "bg-accent-700 text-white" : "bg-paper text-ink-900"
                            }`}
                          >
                            <p>{m.body}</p>
                            <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-ink-500"}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-rule p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Write a message"
                  className="h-10 flex-1 rounded-md border border-rule-strong bg-white px-3 text-sm focus-visible:border-accent-600"
                />
                <Button size="sm" loading={sending} disabled={!draft.trim()} onClick={handleSend}>
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <NewConversationDialog open={composeOpen} onClose={() => setComposeOpen(false)} onCreate={handleCreate} />
    </AppShell>
  );
}
