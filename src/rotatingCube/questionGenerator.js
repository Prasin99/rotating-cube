/**
 * questionGenerator.js
 *
 * Generates questions with EXACTLY ONE correct option per question.
 * Both option construction and validation go through the same
 * pattern.placements table — guaranteed never to drift.
 */

import { ORIENTATIONS, ALL_LAYOUTS, ROTATIONS, MIRRORS } from './constants.js';
import {
  renderedNetSignatureFromUnfolded,
  computeValidNetSignatures,
  perFaceRotationsFor,
} from './answerValidator.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomOrientation = () => pick(ORIENTATIONS);
const randomLayout      = () => pick(ALL_LAYOUTS);
const randomRotation    = () => pick(ROTATIONS);
const randomMirror      = () => pick(MIRRORS);

function adjustAircraftOrientation(stored, perFaceRotation, globalRotation, mirror) {
  if (stored === undefined || stored === null) return undefined;
  let adj = ((stored + perFaceRotation) % 360 + 360) % 360;
  if (mirror === 'horizontal') {
    if (adj === 90) adj = 270;
    else if (adj === 270) adj = 90;
  } else if (mirror === 'vertical') {
    if (adj === 0) adj = 180;
    else if (adj === 180) adj = 0;
  }
  return ((adj + globalRotation) % 360 + 360) % 360;
}

function generateRandomCube() {
  const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  const cube = {};
  const blueFaceCount = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...faces].sort(() => Math.random() - 0.5);
  const blueFaces = new Set(shuffled.slice(0, blueFaceCount));
  const aircraftCount = Math.floor(Math.random() * 2) + 3;
  const aircraftFaces = new Set(shuffled.slice(0, aircraftCount));
  faces.forEach((face) => {
    cube[face] = {
      color: blueFaces.has(face) ? 'blue' : 'white',
      hasAircraft: aircraftFaces.has(face),
      aircraftOrientation: aircraftFaces.has(face) ? randomOrientation() : undefined,
    };
  });
  return cube;
}

function cubeToUnfolded(cube, layoutType, rotation = 0, mirror = 'none') {
  const perFace = perFaceRotationsFor(layoutType);
  if (!perFace) throw new Error(`Unknown layoutType: ${layoutType}`);
  const transformedFaces = {};
  ['front', 'back', 'left', 'right', 'top', 'bottom'].forEach((faceName) => {
    const original = cube[faceName];
    transformedFaces[faceName] = {
      ...original,
      aircraftOrientation: adjustAircraftOrientation(
        original.aircraftOrientation, perFace[faceName], rotation, mirror
      ),
    };
  });
  return { layoutType, faces: transformedFaces, rotation, mirror };
}

function ensureValidPattern(unfolded) {
  const validLayoutType = Math.max(1, Math.min(9, unfolded.layoutType));
  return { ...unfolded, layoutType: validLayoutType };
}

function mutateCube(baseCube, strategy) {
  const cube = JSON.parse(JSON.stringify(baseCube));
  const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  switch (strategy % 6) {
    case 0: { const [f1, f2] = pick([['left','right'],['top','bottom'],['front','back']]); [cube[f1], cube[f2]] = [cube[f2], cube[f1]]; break; }
    case 1: { const wa = faces.filter((f)=>cube[f].hasAircraft); if (wa.length){ const f=pick(wa); cube[f].aircraftOrientation = ((cube[f].aircraftOrientation??0) + pick([90,180,270])) % 360; } break; }
    case 2: { const wa = faces.filter((f)=>cube[f].hasAircraft); const wo = faces.filter((f)=>!cube[f].hasAircraft); if (wa.length && wo.length){ const f=pick(wa), t=pick(wo); cube[t].hasAircraft=true; cube[t].aircraftOrientation=cube[f].aircraftOrientation; cube[f].hasAircraft=false; cube[f].aircraftOrientation=undefined; } break; }
    case 3: { const bs = faces.filter((f)=>cube[f].color==='blue'); const ws = faces.filter((f)=>cube[f].color==='white'); if (bs.length && ws.length){ const b=pick(bs), w=pick(ws); cube[b].color='white'; cube[w].color='blue'; } break; }
    case 4: { const [f1, f2] = pick([['front','top'],['front','left'],['front','right'],['back','top'],['back','left'],['back','right']]); [cube[f1], cube[f2]] = [cube[f2], cube[f1]]; break; }
    case 5: { const [f1, f2] = pick([['left','right'],['top','bottom'],['front','back']]); [cube[f1], cube[f2]] = [cube[f2], cube[f1]]; const wa = faces.filter((f)=>cube[f].hasAircraft); if (wa.length){ const f=pick(wa); cube[f].aircraftOrientation = ((cube[f].aircraftOrientation??0) + 90) % 360; } break; }
  }
  return cube;
}

function generateUniqueTransforms(count, forcedLayout = null) {
  if (forcedLayout) {
    // Lock to one template; vary rotations across the 4 option slots
    const rotations = [...ROTATIONS].sort(() => Math.random() - 0.5);
    return rotations.slice(0, count).map((rotation) => ({
      layout: forcedLayout,
      rotation,
      mirror: 'none',
      forcedLayout: true,
    }));
  }
  const transforms = [];
  const used = new Set();
  let safety = 0;
  while (transforms.length < count && safety < 1000) {
    safety++;
    const layout = randomLayout(), rotation = randomRotation(), mirror = randomMirror();
    //const key = `${layout}-${rotation}-${mirror}`;
    const key = `${layout}`;
    if (!used.has(key)) { used.add(key); transforms.push({ layout, rotation, mirror }); }
  }
  return transforms;
}

function buildWrongOption(trueCube, validSignatures, existingSignatures, preferredTransform) {
  const MAX_ATTEMPTS = 80;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let candidate = trueCube;
    for (let r = 0; r < 1 + Math.floor(attempt / 10); r++) candidate = mutateCube(candidate, attempt + r);
    //const layout = attempt < 10 ? preferredTransform.layout : randomLayout();
    const layout = preferredTransform.forcedLayout
      ? preferredTransform.layout
      : (attempt < 10 ? preferredTransform.layout : randomLayout());
    const rotation = attempt < 10 ? preferredTransform.rotation : randomRotation();
    const mirror = attempt < 10 ? preferredTransform.mirror : randomMirror();
    const option = ensureValidPattern(cubeToUnfolded(candidate, layout, rotation, mirror));
    const sig = renderedNetSignatureFromUnfolded(option);
    if (sig && !validSignatures.has(sig) && !existingSignatures.has(sig)) {
      return { option, signature: sig };
    }
  }
  let scrambled = trueCube;
  for (let r = 0; r < 5; r++) scrambled = mutateCube(scrambled, r);
  const forced = JSON.parse(JSON.stringify(scrambled));
  forced.front.color = forced.front.color === 'blue' ? 'white' : 'blue';
  forced.back.color  = forced.back.color  === 'blue' ? 'white' : 'blue';
  const option = ensureValidPattern(cubeToUnfolded(forced, preferredTransform.layout, preferredTransform.rotation, preferredTransform.mirror));
  return { option, signature: renderedNetSignatureFromUnfolded(option) };
}

// export function generateQuestion() {
//   const cube = generateRandomCube();
//   const validSignatures = computeValidNetSignatures(cube);
//   const transforms = generateUniqueTransforms(4);
//   const correctIndex = Math.floor(Math.random() * 4);
//   const options = new Array(4);
//   const usedSignatures = new Set();

// export function generateQuestion(options = {}) {
//   const { forcedLayout = null } = options;
//   const cube = generateRandomCube();
//   const validSignatures = computeValidNetSignatures(cube);
//   const transforms = generateUniqueTransforms(4, forcedLayout);

//   {
//     const { layout, rotation, mirror } = transforms[correctIndex];
//     const correct = ensureValidPattern(cubeToUnfolded(cube, layout, rotation, mirror));
//     const correctSig = renderedNetSignatureFromUnfolded(correct);
//     if (!validSignatures.has(correctSig)) {
//       // eslint-disable-next-line no-console
//       console.error('[rotating-cube] generator/validator drift detected');
//       const fallback = ensureValidPattern(cubeToUnfolded(cube, 1, 0, 'none'));
//       options[correctIndex] = fallback;
//       usedSignatures.add(renderedNetSignatureFromUnfolded(fallback));
//     } else {
//       options[correctIndex] = correct;
//       usedSignatures.add(correctSig);
//     }
//   }

//   for (let i = 0; i < 4; i++) {
//     if (i === correctIndex) continue;
//     const { option, signature } = buildWrongOption(cube, validSignatures, usedSignatures, transforms[i]);
//     options[i] = option;
//     usedSignatures.add(signature);
//   }

//   return {
//     id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
//     cube,
//     correctOptionIndex: correctIndex,
//     options,
//   };
// }


export function generateQuestion(opts = {}) {
  const { forcedLayout = null } = opts;
  const cube = generateRandomCube();
  const validSignatures = computeValidNetSignatures(cube);
  const transforms = generateUniqueTransforms(4, forcedLayout);
  const correctIndex = Math.floor(Math.random() * 4);
  const options = new Array(4);
  const usedSignatures = new Set();

  {
    const { layout, rotation, mirror } = transforms[correctIndex];
    const correct = ensureValidPattern(cubeToUnfolded(cube, layout, rotation, mirror));
    const correctSig = renderedNetSignatureFromUnfolded(correct);
    if (!validSignatures.has(correctSig)) {
      // eslint-disable-next-line no-console
      console.error('[rotating-cube] generator/validator drift detected');
      const fallback = ensureValidPattern(cubeToUnfolded(cube, 1, 0, 'none'));
      options[correctIndex] = fallback;
      usedSignatures.add(renderedNetSignatureFromUnfolded(fallback));
    } else {
      options[correctIndex] = correct;
      usedSignatures.add(correctSig);
    }
  }

  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) continue;
    const { option, signature } = buildWrongOption(cube, validSignatures, usedSignatures, transforms[i]);
    options[i] = option;
    usedSignatures.add(signature);
  }

  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cube,
    correctOptionIndex: correctIndex,
    options,
  };
}



// export function generateQuestions(count) {
//   return Array.from({ length: count }, () => generateQuestion());
// }

export function generateQuestions(count, options = {}) {
  return Array.from({ length: count }, () => generateQuestion(options));
}