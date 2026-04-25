# Rotating Cube Training

Pilot aptitude-style rotating cube simulator. A 3D cube rotates in real time;
the user picks which of 4 unfolded nets matches it.

**Stack:** React 18 + Vite + Tailwind CSS (plain JavaScript / JSX — no TypeScript).
**No external UI kit, no router, no auth.** Everything runs locally.

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## How the answer validation works

The 9 approved cube-net templates in `src/rotatingCube/patternLibrary.js`
are the SOURCE OF TRUTH for what a "valid unfolding" looks like.

For every question, the generator:
1. Creates a random 3D cube.
2. Computes the set of every rendered signature the cube could produce under
   `9 templates × 4 rotations × 3 mirrors`.
3. Places 1 option that MUST render as one of those signatures (the correct
   answer), and 3 options that MUST NOT.
4. Verifies no two options are visually identical.

At answer time, `RotatingCubeTraining.jsx` calls
`isValidUnfoldingOfCube(selectedOption, cube)` — **no stored "correct index"
is trusted**. The 9 templates decide.

## File map

```
src/
├── App.jsx                          # Setup → Training → Summary flow
├── main.jsx                         # React entry
├── index.css                        # Tailwind directives + base
└── rotatingCube/
    ├── constants.js                 # Shared enums
    ├── patternLibrary.js            # THE 9 TEMPLATES + transform helpers
    ├── answerValidator.js           # Source-of-truth correctness check
    ├── questionGenerator.js         # Generates verified questions
    ├── RotatingCube3D.jsx           # CSS 3D cube with auto / manual rotation
    ├── UnfoldedCubeOption.jsx       # One answer option (flat cube net)
    ├── RotatingCubeTraining.jsx     # Main training screen
    ├── RotatingCubeSetup.jsx        # Settings screen
    └── RotatingCubeSummary.jsx      # Results screen
```

## LMS integration

To embed in an existing LMS (like `aet-lms-main`), import `RotatingCubeTraining`
and pass `settings` + `onComplete`:

```jsx
import { RotatingCubeTraining } from './rotatingCube/RotatingCubeTraining.jsx';

<RotatingCubeTraining
  settings={{
    difficulty: 'medium',       // 'easy' | 'medium' | 'hard'
    questionCount: 10,
    locale: 'en',               // 'en' | 'de'
    mode: 'practice',           // 'practice' | 'exam'
    timePerQuestion: 30,        // seconds, exam mode only
  }}
  onComplete={(session) => { /* save to Supabase, etc. */ }}
  onExit={() => { /* navigate away */ }}
/>
```

`session` shape:
```js
{
  questions: [...],      // full question objects for review
  responses: [
    {
      questionIndex: 0,
      selectedOptionIndex: 2,  // -1 if timed out
      isCorrect: true,
      responseTimeMs: 4321,
    },
    ...
  ],
  startTime: 1700000000000,
  endTime: 1700000123456,
}
```

## Adjusting Pattern VIII

If my interpretation of template VIII from your reference image isn't quite
right, edit the `VIII` entry in `src/rotatingCube/patternLibrary.js`. The
validator will pick up the change automatically — no other file needs to
be touched. Just make sure it's a valid 6-cell cube net (hexomino).
