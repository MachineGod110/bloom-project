import React, { useState } from "react";

const TEN_CARDS = [
  {
    id: "fc1",
    question: "How often should a breast self-exam be done?",
    answer:
      "Roughly once a month. For menstruating individuals, the ideal window is 3 to 5 days after your period ends, when hormonal fluctuations decline and tissue is least tender or swollen.",
    tag: "Frequency",
  },
  {
    id: "fc2",
    question: "Is breast pain usually a sign of cancer?",
    answer:
      "No. Breast pain (mastalgia) is rarely a sign of breast cancer. Most breast pain is cyclical and caused by hormonal shifts. However, persistent, localized pain in one spot should always be discussed with a doctor.",
    tag: "Symptoms",
  },
  {
    id: "fc3",
    question: "What does a lump that needs attention typically feel like?",
    answer:
      "While any change should be evaluated, lumps of concern often feel firm or hard, like a small pebble or knot with irregular margins, and feel distinct from the surrounding tissue.",
    tag: "Detection",
  },
  {
    id: "fc4",
    question: "Do monthly self-exams replace regular mammograms?",
    answer:
      "No. Mammograms can detect microcalcifications and tiny masses years before they can be physically felt. Self-awareness complements clinical screenings by helping you identify interval changes between screenings.",
    tag: "Screening",
  },
  {
    id: "fc5",
    question: "Does discovering a lump always mean it is cancer?",
    answer:
      "No! Over 80% of breast lumps investigated are completely non-cancerous. Common benign causes include fluid-filled cysts, fibroadenomas, and natural glandular tissue variations.",
    tag: "Facts",
  },
  {
    id: "fc6",
    question: "How does the menstrual cycle affect the way breast tissue feels?",
    answer:
      "Estrogen and progesterone surge before menstruation, causing breast lobules and ducts to retain fluid. This can make breasts feel nodular, dense, or slightly tender until your period completes.",
    tag: "Hormones",
  },
  {
    id: "fc7",
    question: "What is skin dimpling or 'peau d'orange'?",
    answer:
      "Skin dimpling looks like a slight indentation or texture similar to an orange peel. It occurs when underlying tissue changes tug gently on supportive ligaments, and warrants a clinical exam.",
    tag: "Visual Signs",
  },
  {
    id: "fc8",
    question: "Should you also check under your armpits during a self-check?",
    answer:
      "Yes! Breast tissue extends upward toward the underarm (the axillary tail of Spence). Checking under your armpits helps you detect any swelling or swollen axillary lymph nodes early.",
    tag: "Technique",
  },
  {
    id: "fc9",
    question: "What types of nipple discharge warrant clinical evaluation?",
    answer:
      "Discharge that occurs spontaneously (without squeezing), stems from a single duct, or appears bloody or water-clear should be assessed by a physician. Bilateral discharge from compression is usually benign.",
    tag: "Signs",
  },
  {
    id: "fc10",
    question: "Can healthy lifestyle habits lower overall breast health risk?",
    answer:
      "Yes. Consistent physical exercise, maintaining a healthy weight after menopause, moderating alcohol consumption, and staying smoke-free are clinically proven to help protect breast health.",
    tag: "Prevention",
  },
];

export default function Flashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSendingToBack, setIsSendingToBack] = useState(false);

  const card = TEN_CARDS[currentIndex];
  const nextCard = TEN_CARDS[(currentIndex + 1) % TEN_CARDS.length];
  const thirdCard = TEN_CARDS[(currentIndex + 2) % TEN_CARDS.length];

  // Primary card click handler:
  // - If showing question: flip to answer
  // - If showing answer: animate top card to bottom of deck and reveal next card
  function handleCardClick() {
    if (isSendingToBack) return;

    if (!isFlipped) {
      // First click: flip over to reveal answer
      setIsFlipped(true);
    } else {
      // Second click (already showing answer): send to bottom of deck
      sendCardToBottom();
    }
  }

  function sendCardToBottom() {
    if (isSendingToBack) return;
    setIsSendingToBack(true);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % TEN_CARDS.length);
      setIsFlipped(false);
      setIsSendingToBack(false);
    }, 400);
  }

  function handleNext(e) {
    if (e) e.stopPropagation();
    sendCardToBottom();
  }

  function handlePrev(e) {
    if (e) e.stopPropagation();
    if (isSendingToBack) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + TEN_CARDS.length) % TEN_CARDS.length);
  }

  function handleToggleFlipOnly(e) {
    if (e) e.stopPropagation();
    if (isSendingToBack) return;
    setIsFlipped((prev) => !prev);
  }

  return (
    <section className="flashcards-section" id="learn">
      <div className="section-header">
        <span className="mono">Quick learning deck</span>
        <h2>
          One fact<br />
          at a time.
        </h2>
        <p>
          Click the card to reveal the answer. Click it again to send it to the bottom of the deck.
        </p>
      </div>

      <div className="flashcard-deck-container">
        {/* Bottom card in the stack */}
        <div className={`deck-card deck-card-bottom ${isSendingToBack ? "promoting" : ""}`}>
          <div className="card-face card-front">
            <span className="mono card-tag">{thirdCard.tag} • Question</span>
            <h3>{thirdCard.question}</h3>
          </div>
        </div>

        {/* Middle card (the card below the active one) */}
        <div className={`deck-card deck-card-middle ${isSendingToBack ? "promoting" : ""}`}>
          <div className="card-face card-front">
            <span className="mono card-tag">{nextCard.tag} • Question</span>
            <h3>{nextCard.question}</h3>
          </div>
        </div>

        {/* Interactive Top Card */}
        <div
          className={`deck-card deck-card-top ${isFlipped ? "flipped" : ""} ${
            isSendingToBack ? "sending-to-back" : ""
          }`}
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          aria-label={
            isFlipped
              ? "Flashcard answer showing. Click to send card to bottom of deck."
              : "Flashcard question. Click to reveal answer."
          }
        >
          <div className="card-flipper">
            {/* Front: Question */}
            <div className="card-face card-front">
              <span className="mono card-tag">
                {card.tag} • Question
              </span>
              <h3>{card.question}</h3>
              <div className="card-prompt">
                <span className="mono">Tap card to reveal answer ↺</span>
              </div>
            </div>

            {/* Back: Answer */}
            <div className="card-face card-back">
              <span className="mono card-tag card-tag-answer">
                {card.tag} • Answer
              </span>
              <p className="card-answer-text">{card.answer}</p>
              <div className="card-prompt">
                <span className="mono" style={{ color: "var(--plum)", fontWeight: 600 }}>
                  Tap card to send to bottom of deck ↓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls-bar">
        <button className="btn btn-outline" onClick={handlePrev} disabled={isSendingToBack}>
          ← Previous
        </button>

        <button className="btn btn-soft" onClick={handleToggleFlipOnly} disabled={isSendingToBack}>
          {isFlipped ? "Show Question ↺" : "Flip for Answer ↻"}
        </button>

        <span className="mono card-counter">
          Card {currentIndex + 1} of {TEN_CARDS.length}
        </span>

        <button className="btn btn-primary" onClick={handleNext} disabled={isSendingToBack}>
          Next →
        </button>
      </div>
    </section>
  );
}
