import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { submitCheckin, sendChatMessage } from "../services/api";

const QUICK_STARTERS = [
  { label: "🌱 No unusual changes — routine monthly check", prompt: "No unusual changes, just completing my monthly routine check-in." },
  { label: "🔍 I noticed a firm spot or thickening in my upper-outer breast", prompt: "I felt a small firm spot in my upper-outer breast area recently." },
  { label: "💧 Cyclical tenderness or swelling before period", prompt: "I have general bilateral tenderness and swelling that seems linked to my cycle." },
  { label: "❓ What is the difference between normal glands and a lump?", prompt: "How can I tell the difference between typical granular glandular tissue and a lump?" },
];

export default function CheckinPage({ user, onOpenAuth, onCheckinComplete }) {
  const navigate = useNavigate();
  const chatMessagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const initialBotMessage = {
    id: 1,
    type: "bot",
    text: user
      ? `Hi ${user.name.split(" ")[0]}! I'm Bloom 🌱\n\nI'm your AI breast health awareness companion. You can describe any symptom, ask about cycle timing, or walk through a monthly check-in in plain language.\n\nHave you noticed any changes or tenderness recently?`
      : `Hi! I'm Bloom 🌱\n\nI'm your AI breast health awareness companion. You can describe anything you've noticed in your own words, ask questions about what's normal, or complete your monthly awareness check-in.\n\nHave you noticed any changes or tenderness recently?`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  const [messages, setMessages] = useState([initialBotMessage]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);

  // Auto-scroll to bottom of chat smoothly
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleReset() {
    setMessages([
      {
        id: Date.now(),
        type: "bot",
        text: initialBotMessage.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setTyping(false);
    setInput("");
    setCompleted(false);
    setUserAnswers([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function sendMessage(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || typing) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedAnswers = [...userAnswers, text];
    setUserAnswers(updatedAnswers);

    const userMsg = { id: Date.now(), type: "user", text, timestamp: time };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      // Call Gemini AI backend
      const result = await sendChatMessage({
        message: text,
        history: messages,
        user,
      });

      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const botMsg = {
        id: Date.now() + 1,
        type: "bot",
        text: result.reply,
        triage: result.triage,
        timestamp: botTime,
      };

      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);

      if (onCheckinComplete) {
        onCheckinComplete();
      }
    } catch (err) {
      console.error("AI Checkin chat error:", err);
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot",
          text: "I'm here with you. It seems there was a temporary delay in connecting to the AI service, but your check-in thoughts have been noted. If you notice a firm or persistent knot, always consider speaking with a healthcare professional for clinical peace of mind.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fullscreen-chat-page">
      {/* Top Header Bar for Chat Interface */}
      <header className="fullscreen-chat-header">
        <div className="chat-header-left">
          <div className="bloom-avatar-sub">
            <span className="avatar-flower">✿</span>
          </div>
          <div className="chat-header-meta">
            <div className="chat-header-title">
              Bloom Assistant
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            className="btn-chat-action"
            onClick={() => navigate("/dashboard")}
            title="View synced live dashboard"
          >
            📊 View Dashboard
          </button>

          <button
            className="btn-chat-action"
            onClick={handleReset}
            title="Start a fresh check-in"
          >
            <span className="reset-icon">↺</span> New Check-in
          </button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <main className="fullscreen-chat-body">
        <div className="fullscreen-chat-inner">
          {/* Guest Reminder Banner if not signed in */}
          {!user && (
            <div className="chat-guest-banner">
              <span className="guest-banner-text">
                👋 You are checking in as a guest. Your responses update your session graph. Log in to save permanently across devices.
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => onOpenAuth && onOpenAuth("login")}
              >
                Log in to sync
              </button>
            </div>
          )}

          {/* Message List */}
          <div className="chat-messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-row ${msg.type}`}>
                {msg.type === "bot" && (
                  <div className="chat-row-avatar">
                    <span>✿</span>
                  </div>
                )}

                <div className={`chat-bubble ${msg.type}`}>
                  <div className="chat-bubble-text" style={{ whiteSpace: "pre-line" }}>
                    {msg.text}
                  </div>

                  {/* Structured Clinical Triage Badge if generated by Gemini */}
                  {msg.triage && msg.triage.symptomNature !== "general_query" && (
                    <div className="triage-status-pill-sub">
                      <span className="triage-tag-icon">
                        {msg.triage.riskCategory === "clinical_review" ? "🩺" : msg.triage.riskCategory === "cyclical" ? "⚡" : "🌿"}
                      </span>
                      <span className="triage-tag-text">
                        {msg.triage.summaryNote}
                        {msg.triage.detectedQuadrant && ` (${msg.triage.detectedQuadrant.replace("quadrant-", "").replace("-", " ")})`}
                      </span>
                    </div>
                  )}

                  <span className="chat-bubble-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Quick Starters under the initial message */}
            {messages.length === 1 && !typing && (
              <div className="chat-quick-starters">
                <div className="quick-starters-label">Suggested conversation starters:</div>
                <div className="quick-starters-grid">
                  {QUICK_STARTERS.map((item, idx) => (
                    <button
                      key={idx}
                      className="quick-starter-pill"
                      onClick={() => sendMessage(item.prompt)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {typing && (
              <div className="chat-row bot">
                <div className="chat-row-avatar">
                  <span>✿</span>
                </div>
                <div className="chat-bubble bot typing-bubble">
                  <div className="typing-dots">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}

            {/* Clear bottom clearance spacer so no text hides behind the floating composer */}
            <div style={{ height: "135px", flexShrink: 0 }} />
            <div ref={chatMessagesEndRef} />
          </div>
        </div>
      </main>

      {/* Floating Bottom Composer Bar */}
      <footer className="fullscreen-chat-composer">
        <div className="composer-inner">
          <div className="composer-input-pill">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              placeholder="Ask Bloom anything or describe what you notice in your breast tissue..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              className="btn-send-pill"
              disabled={!input.trim() || typing}
              onClick={() => sendMessage()}
              aria-label="Send message"
            >
              <span className="send-label">Send</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <div className="composer-disclaimer">
            Bloom is an educational awareness assistant and does not replace medical advice or clinical diagnosis. If you notice a persistent change, consult a healthcare provider.
          </div>
        </div>
      </footer>
    </div>
  );
}
