import React, { useEffect, useRef, useState } from "react";
import { submitCheckin } from "../services/api";

const QUESTIONS = [
  "Have you noticed a new lump or area of thickening?",
  "Have you noticed any unusual change in the appearance of your breast?",
  "Have you noticed any unusual nipple discharge?",
  "Have you noticed persistent skin changes such as dimpling or irritation?",
  "Have you noticed any other change that concerns you?",
];

export default function Chatbot({ user, onCheckinComplete, onOpenAuth }) {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: user
        ? `Hi ${user.name.split(" ")[0]}! I'm Bloom 🌱\n\nI'll walk you through your monthly awareness check-in. Have you noticed any unusual changes recently?`
        : "Hi! I'm Bloom 🌱\n\nI'll ask you a few simple questions about changes you may have noticed. Have you noticed any unusual changes recently?",
    },
  ]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [completed, setCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  
  // Container ref to only scroll the message box, NOT the window
  const chatMessagesContainerRef = useRef(null);

  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function handleSend() {
    const text = input.trim();
    if (!text || typing || completed) return;

    const updatedAnswers = [...userAnswers, text];
    setUserAnswers(updatedAnswers);
    setMessages((prev) => [...prev, { type: "user", text }]);
    setInput("");
    setTyping(true);

    setTimeout(async () => {
      setTyping(false);
      if (questionIndex < QUESTIONS.length) {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: QUESTIONS[questionIndex] },
        ]);
        setQuestionIndex((prev) => prev + 1);
      } else {
        const completionMsg = user
          ? "Thank you for completing this check-in! Your responses have been saved to your personal Dashboard and analyzed by the awareness model. Remember, Bloom is an awareness tool and not a clinical diagnosis. If you ever notice persistent changes, consult a physician."
          : "Thank you for completing this awareness check-in! To save this check-in to your private timeline and view your health risk chart on the Dashboard, please log in or create an account.";

        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: completionMsg,
          },
        ]);
        setCompleted(true);

        if (user) {
          try {
            await submitCheckin({ answers: updatedAnswers, flags: [] });
            if (onCheckinComplete) onCheckinComplete();
          } catch (e) {
            console.error("Check-in submit error", e);
          }
        }
      }
    }, 600);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="bloom-avatar">✿</div>
        <div>
          <strong>Bloom</strong>
          <div className="chat-status">
            ● {user ? "AI awareness assistant (synced)" : "awareness assistant (guest mode)"}
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={chatMessagesContainerRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.type}`}
            style={{ whiteSpace: "pre-line" }}
          >
            {msg.text}
          </div>
        ))}
        {typing && (
          <div className="message bot typing">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        )}
      </div>

      {!user && (
        <div className="chat-auth-banner">
          <span>🔒 Log in to save your check-ins and update your ML risk chart.</span>
          <button type="button" onClick={() => onOpenAuth && onOpenAuth("login")}>
            Log in
          </button>
        </div>
      )}

      <div className="chat-input">
        <input
          type="text"
          value={input}
          placeholder="Type your answer..."
          disabled={completed}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn btn-primary"
          disabled={completed || !input.trim()}
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
