// components/ChatWindow.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

let socket: any;
export default function ChatWindow({
  chatId,
  userId,
}: {
  chatId: number;
  userId: number;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket = io("http://localhost:3001");
    socket.emit("joinChat", chatId);

    socket.on("newMessage", (msg: any) =>
      setMessages((prev) => [...prev, msg])
    );
    return () => {
      socket.disconnect();
    };
  }, [chatId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("sendMessage", {
      chat_id: chatId,
      sender_id: userId,
      content: input,
    });
    setInput("");
  };

  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [messages]
  );

  return (
    <div
      className="border rounded p-3 d-flex flex-column"
      style={{ height: "70vh" }}
    >
      <div className="flex-grow-1 overflow-auto mb-3">
        {messages.map((m) => (
          <div
            key={m.message_id}
            className={`p-2 my-1 rounded ${
              m.sender_id === userId
                ? "bg-primary text-white ms-auto"
                : "bg-light text-dark"
            }`}
            style={{ maxWidth: "60%" }}
          >
            {m.content}
            <div className="text-end text-muted" style={{ fontSize: "0.7rem" }}>
              {new Date(m.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="btn btn-primary" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
