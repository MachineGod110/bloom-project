# Bloom — Project Structure

Two folders, matching your stated stack:

```
bloom-frontend/   React (Vite) — everything the user sees
bloom-backend/    Node + Express + Mongoose + MongoDB Atlas
```

## Running it

**Backend**
```
cd bloom-backend
cp .env.example .env      # fill in your MongoDB Atlas URI + a JWT secret
npm install
npm run dev                # http://localhost:5000
```

**Frontend**
```
cd bloom-frontend
npm install
npm run dev                # http://localhost:5173
```

The frontend runs standalone right now (`USE_REAL_API = false` in
`src/services/api.js`, backed by `localStorage`) so you can see and click
through everything without the backend running. Flip that flag to `true`
once your Express server is up — every function in `api.js` already calls
the matching real route, so no component code needs to change.

## What's real vs. placeholder

| Piece | Status |
|---|---|
| Signup/login UI, validation | Real, ready to use |
| JWT + bcrypt auth on the backend | Real, tested route shapes (`/api/auth/signup`, `/login`, `/me`) |
| Check-in → dashboard → 30-day reminder | Real logic, both mock and Mongoose versions |
| `node-cron` daily reminder scan | Real, logs who's due — you still need to plug in actual email/push sending |
| Chatbot | Real branching conversation logic, client-side. Still rule-based, not an LLM — that's a reasonable scope call for now, but say if you want it upgraded |
| Flashcards flip + stack-to-back | Fully working animation |
| Self-exam guide | Fully working interactive step-through with animated pattern indicators |
| Blog | Real UI, three full placeholder articles — swap in your own copy |
| ML section | **Interface preview only.** It's an honest "in development" section with a non-diagnostic habit-reflection quiz, not a health prediction. See the note below. |

## About the ML piece

Your abstract already lists the diagnosis model as pending — the notebook's
input format hasn't been confirmed. That's the right call to keep it
pending: a "risk of cancer" style output needs real clinical validation
before it's shown to anyone, and building a false-precision predictor from
an unvalidated dataset would do more harm than the vague-instructions
problem Bloom is trying to solve in the first place. Two honest ways to
extend the section once your notebook is ready:

1. **Keep it non-diagnostic.** Whatever the model outputs, frame it as an
   awareness/habit signal (like the quiz preview already there), not a
   medical probability — with a visible "talk to a doctor" path always
   present regardless of the score.
2. **Wire it in structurally** the way the abstract describes: a small
   Flask/FastAPI service wrapping the scikit-learn model, called from the
   Node backend at `/api/ml/score`, which the frontend's `scoreMlQuiz()`
   stub in `api.js` is already shaped to call.

I can help build either the Flask service or the scikit-learn pipeline
itself once you know the notebook's input format — happy to pick that up
next.

## Suggested next steps, in order

1. Get the backend talking to your real MongoDB Atlas cluster and confirm
   signup/login round-trips.
2. Point the frontend at it (`USE_REAL_API = true`).
3. Move flashcards/blog content into a Mongoose collection if you want to
   edit them without redeploying.
4. Decide on the chatbot's ceiling — rule-based (current) vs. an actual
   small LLM call — and I can build whichever you pick.
5. Bring the ML notebook's input format and we'll design `/api/ml/score`
   around it.
