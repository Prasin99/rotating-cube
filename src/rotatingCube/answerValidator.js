/**
 * answerValidator.js
 *
 * Source-of-truth for whether a 2D unfolded option is a valid unfolding of a
 * given 3D cube. Uses each pattern's per-cell face placement (computed in
 * patternLibrary.js by walking the unfolding tree).
 */

import { ALL_LAYOUTS, ROTATIONS, MIRRORS } from './constants.js';
import { getPatternById, transformCells } from './patternLibrary.js';

/**
 * Order: per-face rotation → mirror → global rotation.
 * Must match questionGenerator.adjustAircraftOrientation.
 */
function adjustOrientation(stored, perFaceRotation, globalRotation, mirror) {
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

export function renderedNetSignatureFromCube(cube, layoutType, rotation, mirror) {
  const pattern = getPatternById(layoutType);
  if (!pattern) return '';
  const cells = transformCells(pattern.cells, rotation, mirror);
  const parts = [];
  cells.forEach((cell, i) => {
    const placement = pattern.placements[i];
    const face = cube[placement.face];
    const orient = adjustOrientation(face.aircraftOrientation, placement.rotation, rotation, mirror);
    const orientStr = orient === undefined ? '-' : String(orient);
    const aircraftStr = face.hasAircraft ? 'A' : 'N';
    parts.push(`${cell.x},${cell.y}:${face.color}:${aircraftStr}:${orientStr}`);
  });
  parts.sort();
  return parts.join('|');
}

export function renderedNetSignatureFromUnfolded(unfolded) {
  const pattern = getPatternById(unfolded.layoutType);
  if (!pattern) return '';
  const rotation = unfolded.rotation ?? 0;
  const mirror = unfolded.mirror ?? 'none';
  const cells = transformCells(pattern.cells, rotation, mirror);
  const parts = [];
  cells.forEach((cell, i) => {
    const placement = pattern.placements[i];
    const face = unfolded.faces[placement.face];
    const orientStr =
      face.aircraftOrientation === undefined || face.aircraftOrientation === null
        ? '-'
        : String(face.aircraftOrientation);
    const aircraftStr = face.hasAircraft ? 'A' : 'N';
    parts.push(`${cell.x},${cell.y}:${face.color}:${aircraftStr}:${orientStr}`);
  });
  parts.sort();
  return parts.join('|');
}

export function computeValidNetSignatures(cube) {
  const signatures = new Set();
  for (const layout of ALL_LAYOUTS) {
    for (const rotation of ROTATIONS) {
      for (const mirror of MIRRORS) {
        const sig = renderedNetSignatureFromCube(cube, layout, rotation, mirror);
        if (sig) signatures.add(sig);
      }
    }
  }
  return signatures;
}

export function isValidUnfoldingOfCube(unfolded, cube) {
  return computeValidNetSignatures(cube).has(renderedNetSignatureFromUnfolded(unfolded));
}

export function findCorrectOptionIndex(options, cube) {
  const validSignatures = computeValidNetSignatures(cube);
  for (let i = 0; i < options.length; i++) {
    if (validSignatures.has(renderedNetSignatureFromUnfolded(options[i]))) return i;
  }
  return -1;
}

/** Per-face rotation map keyed by face name, used by the generator. */
export function perFaceRotationsFor(layoutType) {
  const pattern = getPatternById(layoutType);
  if (!pattern) return null;
  const out = {};
  pattern.placements.forEach((p) => { out[p.face] = p.rotation; });
  return out;
}