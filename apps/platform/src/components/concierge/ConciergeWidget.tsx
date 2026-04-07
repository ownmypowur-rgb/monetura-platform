"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ConciergeWidgetProps {
  memberName: string;
  memberTier: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: "#2C2420",
  panel: "#1A0F0A",
  gold: "#D4A853",
  goldDark: "#C4973D",
  cream: "#FBF5ED",
  sand: "#E8DCCB",
  canyon: "#C17A4A",
  mocha: "#4A3728",
  mid: "#8B6E52",
  userBubble: "#D4A853",
  assistantBubble: "#3D2E26",
  border: "#4A3728",
  input: "#1A0F0A",
};

const SUGGESTIONS = [
  "How do I earn commissions?",
  "Walk me through creating a post",
  "Best things to do in Tokyo",
  "How do my credits work?",
] as const;

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Icons ────────────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.74L4 10l5.91-1.74L12 2z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9 22,2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: C.gold,
            display: "inline-block",
            animation: `concierge-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main widget ──────────────────────────────────────────────────────────────

export function ConciergeWidget({ memberName, memberTier }: ConciergeWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const firstName = memberName.split(" ")[0] ?? memberName;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: trimmed,
        timestamp: nowTime(),
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput("");
      setIsStreaming(true);

      // Placeholder assistant message updated as stream arrives
      const assistantPlaceholder: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: nowTime(),
      };
      setMessages([...nextMessages, assistantPlaceholder]);

      try {
        const response = await fetch("/api/concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + chunk },
              ];
            }
            return prev;
          });
        }
      } catch {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content:
                  "Sorry, I'm having trouble connecting. Please try again.",
              },
            ];
          }
          return prev;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes concierge-dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes concierge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 168, 83, 0.5); }
          50% { box-shadow: 0 0 0 10px rgba(212, 168, 83, 0); }
        }
        @keyframes concierge-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>

      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Monetura Concierge"
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.canyon} 0%, ${C.gold} 100%)`,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.bg,
            zIndex: 50,
            animation: "concierge-pulse 2.5s ease-in-out infinite",
            boxShadow: "0 4px 20px rgba(212,168,83,0.4)",
          }}
        >
          <SparkleIcon />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: "min(380px, calc(100vw - 32px))",
            height: "min(520px, calc(100dvh - 80px))",
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "concierge-slide-up 0.22s ease-out forwards",
          }}
        >
          {/* Gold accent line */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.canyon}, ${C.gold}, transparent)`, flexShrink: 0 }} />

          {/* Header */}
          <div
            style={{
              padding: "14px 16px 12px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.canyon}, ${C.gold})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.bg,
                flexShrink: 0,
              }}
            >
              <SparkleIcon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  color: C.gold,
                  fontFamily: "var(--font-heading)",
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Monetura Concierge
              </p>
              <p style={{ color: C.mid, fontSize: 11, margin: 0, lineHeight: 1.3 }}>
                Platform help &amp; travel advice
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close concierge"
              style={{
                background: "none",
                border: "none",
                color: C.mid,
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Welcome message */}
            {!hasMessages && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.canyon}, ${C.gold})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.bg,
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  M
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      background: C.assistantBubble,
                      borderRadius: "4px 14px 14px 14px",
                      padding: "10px 12px",
                      color: C.sand,
                      fontSize: 13.5,
                      lineHeight: 1.5,
                    }}
                  >
                    Hi {firstName}! 👋 I&apos;m your Monetura Concierge. I can help you
                    with the platform or answer any travel questions. What&apos;s on your
                    mind?
                  </div>
                  <p style={{ color: C.mid, fontSize: 10.5, margin: "3px 0 0 4px" }}>
                    {nowTime()}
                  </p>
                </div>
              </div>
            )}

            {/* Suggestion chips */}
            {!hasMessages && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void sendMessage(s)}
                    style={{
                      background: C.panel,
                      border: `1px solid ${C.border}`,
                      borderRadius: 20,
                      color: C.sand,
                      fontSize: 12,
                      padding: "5px 11px",
                      cursor: "pointer",
                      lineHeight: 1.4,
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.canyon}, ${C.gold})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.bg,
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    M
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "78%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background:
                        msg.role === "user" ? C.userBubble : C.assistantBubble,
                      borderRadius:
                        msg.role === "user"
                          ? "14px 4px 14px 14px"
                          : "4px 14px 14px 14px",
                      padding: "9px 12px",
                      color: msg.role === "user" ? C.bg : C.sand,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {/* Typing indicator for empty streaming message */}
                    {msg.role === "assistant" && msg.content === "" && isStreaming ? (
                      <TypingDots />
                    ) : (
                      msg.content
                    )}
                  </div>
                  <p
                    style={{
                      color: C.mid,
                      fontSize: 10.5,
                      margin: "3px 0 0 4px",
                      textAlign: msg.role === "user" ? "right" : "left",
                    }}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              padding: "10px 12px 12px",
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder="Ask me anything..."
              rows={1}
              style={{
                flex: 1,
                background: C.input,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                color: C.cream,
                fontSize: 13.5,
                padding: "9px 12px",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.4,
                maxHeight: 96,
                overflowY: "auto",
                opacity: isStreaming ? 0.6 : 1,
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
              }}
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              aria-label="Send message"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background:
                  !input.trim() || isStreaming
                    ? C.mocha
                    : `linear-gradient(135deg, ${C.canyon}, ${C.gold})`,
                border: "none",
                cursor: !input.trim() || isStreaming ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: !input.trim() || isStreaming ? C.mid : C.bg,
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
