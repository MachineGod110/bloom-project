import React, { useState } from "react";
import StepDetailModal from "./StepDetailModal.jsx";

const STEPS = [
  {
    num: "01",
    title: "Get comfortable",
    body: "Choose a comfortable position where you can focus without rushing.",
    detailedIntro:
      "Creating an unhurried, comfortable setting makes your self-exam more accurate and eliminates stress. Consistency in timing matters more than perfection.",
    techniques: [
      "Optimal timing: 3–5 days after your period ends, when breast tissue is least swollen or tender.",
      "If you no longer menstruate or are on hormonal birth control, pick a fixed recurring day (e.g. the 1st of each month).",
      "Positions: Stand in the shower (soapy water helps fingers glide smoothly) or lie flat in bed with a pillow under your shoulder.",
      "Ensure warm ambient temperature so tissue remains relaxed.",
    ],
    precautions:
      "Avoid checking right before or during your menstrual cycle, as natural hormonal fluctuations cause temporary benign lumpy textures that can trigger false alarms.",
    indicatorPos: { top: "45%", left: "48%" },
  },
  {
    num: "02",
    title: "Use your finger pads",
    body: "Use the pads of your fingers rather than your fingertips when exploring the area.",
    detailedIntro:
      "The flat pads of your fingers contain the highest concentration of sensory nerves, allowing you to distinguish subtle tissue variations.",
    techniques: [
      "Keep the middle three fingers (index, middle, ring) straight and held together like a flat paddle.",
      "Apply pressure with the fleshy pads just below the nails, never poking with the tips.",
      "Apply 3 distinct pressure levels at each spot: light (surface skin), medium (mid-level tissue), and firm (deep tissue against the rib cage).",
    ],
    precautions:
      "Pinching the tissue between thumb and fingers can give a false impression of a lump. Always press tissue flat against the chest wall.",
    indicatorPos: { top: "50%", left: "55%" },
  },
  {
    num: "03",
    title: "Circular pattern",
    body: "Move in small circular motions while systematically covering the area.",
    detailedIntro:
      "The spiral circular method ensures every layer of breast tissue from the outermost boundary to the nipple is examined.",
    techniques: [
      "Make dime-sized overlapping circles with your three finger pads.",
      "Start at the outer perimeter near the armpit and collarbone.",
      "Spiral inward circle by circle until you reach the areola.",
      "Maintain continuous contact with the skin without lifting your hand.",
    ],
    precautions:
      "Be gentle around the sensitive areola area, but make sure to check the tissue directly beneath it.",
    indicatorPos: { top: "52%", left: "40%" },
  },
  {
    num: "04",
    title: "Vertical-strip pattern",
    body: "Move in an organized up-and-down pattern so that the area is covered systematically.",
    detailedIntro:
      "Research shows the vertical strip pattern yields the highest percentage of detected tissue changes because it mimics a clinical lawnmower grid.",
    techniques: [
      "Begin in the underarm (axilla) and move fingers downward until you feel the bottom of the rib cage.",
      "Shift fingers slightly inward toward the center and move upward toward the collarbone.",
      "Repeat these overlapping vertical strips until you reach the sternum (breastbone).",
      "Include the axillary tail (tissue extending into the armpit), as significant breast tissue resides here.",
    ],
    precautions:
      "Ensure you extend the examination high enough up to the collarbone and well into the armpit hollow.",
    indicatorPos: { top: "58%", left: "50%" },
  },
  {
    num: "05",
    title: "Notice changes",
    body: "Become familiar with what is normal for you and discuss unusual or persistent changes with a healthcare professional.",
    detailedIntro:
      "Self-awareness is about knowing your unique normal baseline. Most breast variations are entirely normal and benign.",
    techniques: [
      "Check visual appearance in a mirror with arms at sides, then raised overhead: note any skin dimpling, asymmetry, or redness.",
      "Inspect nipples for spontaneous discharge, scaling, or sudden inversion.",
      "Note the location, feel, and cycle-timing of any area that feels distinct from surrounding tissue.",
    ],
    precautions:
      "Remember that over 80% of breast lumps are benign (cysts or fibroadenomas). If you note a persistent change that lasts beyond one menstrual cycle, contact your healthcare provider.",
    indicatorPos: { top: "48%", left: "50%" },
  },
];

export default function SelfExamGuide() {
  const [activeStep, setActiveStep] = useState(0);
  const [modalStep, setModalStep] = useState(null);

  return (
    <section className="guide-section" id="guide">
      <div className="section-header">
        <span className="mono">Self-awareness guide</span>
        <h2>
          Get the technique<br />
          down mentally.
        </h2>
        <p>
          Click any step to open an in-depth precision technique guide.
        </p>
      </div>

      <div className="guide-layout">
        <div className="body-diagram">
          <div className="body-silhouette">
            <div className="head" />
            <div className="arm left" />
            <div className="arm right" />
            <div className="torso">
              <div
                className="indicator-dot"
                style={{
                  top: STEPS[activeStep].indicatorPos.top,
                  left: STEPS[activeStep].indicatorPos.left,
                }}
              />
            </div>
          </div>
        </div>

        <div>
          {STEPS.map((step, index) => (
            <div
              key={step.num}
              className={`guide-step ${activeStep === index ? "active" : ""}`}
              onClick={() => {
                setActiveStep(index);
                setModalStep(step);
              }}
              title="Click to view detailed precision steps"
            >
              <div className="step-number">{step.num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>{step.title}</h3>
                  <span className="mono" style={{ color: "var(--rose)", fontSize: "0.7rem", fontWeight: 600 }}>
                    Details ↗
                  </span>
                </div>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalStep && (
        <StepDetailModal
          step={modalStep}
          onClose={() => setModalStep(null)}
        />
      )}
    </section>
  );
}
