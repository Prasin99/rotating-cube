/**
 * patternLibrary.js
 *
 * The 9 valid cube net templates (I-IX). THESE ARE THE SOURCE OF TRUTH.
 * Every valid option must match one of these templates (with some rotation
 * applied).
 *
 * Each pattern has:
 *   - cells: the 6 cell positions in the unfolded net
 *   - placements: cell-by-cell {face, rotation} — which cube face occupies
 *                 each cell (matched by index), and what 2D rotation the
 *                 face's drawing has there.
 *
 * Placements are computed by walking each pattern as an unfolding tree
 * (BFS from the most-central cell). This replaces the old fixed
 * FACE_ASSIGNMENTS array, which only worked for 5 of the 9 templates.
 */

const RAW_PATTERNS = [
  { id: 'I',    numericId: 1, name: 'Classic Cross',
    cells: [{x:1,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:1,y:2}] },
  { id: 'II',   numericId: 2, name: 'Left T Cross',
    cells: [{x:0,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:0,y:2}] },
  { id: 'III',  numericId: 3, name: 'Right-Center T Cross',
    cells: [{x:2,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:2,y:2}] },
  { id: 'IV',   numericId: 4, name: 'Offset T',
    cells: [{x:1,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:2,y:2}] },
  { id: 'V',    numericId: 5, name: 'L-Shape Extended',
    cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:2,y:1},{x:3,y:1},{x:4,y:1}] },
  { id: 'VI',   numericId: 6, name: 'Diagonal Corners',
    cells: [{x:3,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1},{x:0,y:2}] },
  { id: 'VII',  numericId: 7, name: 'Zigzag Staircase',
    cells: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:3,y:2}] },
  { id: 'VIII', numericId: 8, name: 'T-L Combined',
    cells: [{x:1,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:3,y:2}] },
  { id: 'IX',   numericId: 9, name: 'S-Shape',
    cells: [{x:0,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:2,y:2},{x:3,y:2}] },
];

const NEIGHBOURS = {
  front:  { top: 'top',    right: 'right', bottom: 'bottom', left: 'left'  },
  back:   { top: 'top',    right: 'left',  bottom: 'bottom', left: 'right' },
  top:    { top: 'back',   right: 'right', bottom: 'front',  left: 'left'  },
  bottom: { top: 'front',  right: 'right', bottom: 'back',   left: 'left'  },
  left:   { top: 'top',    right: 'front', bottom: 'bottom', left: 'back'  },
  right:  { top: 'top',    right: 'back',  bottom: 'bottom', left: 'front' },
};
const DIR_TO_ANGLE = { top: 0, right: 90, bottom: 180, left: 270 };
const ANGLE_TO_DIR = { 0: 'top', 90: 'right', 180: 'bottom', 270: 'left' };

function edgeFromAToB(faceA, faceB) {
  for (const [dir, neighbour] of Object.entries(NEIGHBOURS[faceA])) {
    if (neighbour === faceB) return dir;
  }
  return null;
}

function tryAnchor(cells, anchorIdx, anchorFace, anchorRot) {
  const placement = new Array(cells.length).fill(null);
  placement[anchorIdx] = { face: anchorFace, rotation: anchorRot };
  const visited = new Set([anchorIdx]);
  const queue = [anchorIdx];

  while (queue.length > 0) {
    const i = queue.shift();
    const cellA = cells[i];
    const placementA = placement[i];
    const dirs = [
      { dx: 0,  dy: -1, layoutAngle: 0   },
      { dx: 1,  dy: 0,  layoutAngle: 90  },
      { dx: 0,  dy: 1,  layoutAngle: 180 },
      { dx: -1, dy: 0,  layoutAngle: 270 },
    ];
    for (const { dx, dy, layoutAngle } of dirs) {
      const j = cells.findIndex((c) => c.x === cellA.x + dx && c.y === cellA.y + dy);
      if (j === -1) continue;

      const localAngleA = ((layoutAngle - placementA.rotation) % 360 + 360) % 360;
      const childFace = NEIGHBOURS[placementA.face][ANGLE_TO_DIR[localAngleA]];
      const childLocalAngleB = DIR_TO_ANGLE[edgeFromAToB(childFace, placementA.face)];
      const childRot = (((layoutAngle + 180) % 360) - childLocalAngleB + 720) % 360;

      if (visited.has(j)) {
        if (placement[j].face !== childFace || placement[j].rotation !== childRot) return null;
        continue;
      }
      if (placement.some((p) => p && p.face === childFace)) return null;
      placement[j] = { face: childFace, rotation: childRot };
      visited.add(j);
      queue.push(j);
    }
  }
  if (visited.size !== cells.length) return null;
  if (new Set(placement.map((p) => p.face)).size !== 6) return null;
  return placement;
}

function neighbourCount(cells, i) {
  const c = cells[i];
  let n = 0;
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    if (cells.some((o) => o.x === c.x + dx && o.y === c.y + dy)) n++;
  }
  return n;
}

/**
 * Compute a face placement for each cell index. Anchors the front face on
 * the most-connected cell so the front lands centrally — closest to the
 * SkyTest visual convention.
 */
export function computeFacePlacements(cells) {
  const indices = cells
    .map((_, i) => i)
    .sort((a, b) => neighbourCount(cells, b) - neighbourCount(cells, a));
  for (const anchorIdx of indices) {
    const placement = tryAnchor(cells, anchorIdx, 'front', 0);
    if (placement) return placement;
  }
  for (const anchorIdx of indices) {
    for (const r of [90, 180, 270]) {
      const placement = tryAnchor(cells, anchorIdx, 'front', r);
      if (placement) return placement;
    }
  }
  return null;
}

export const PATTERN_LIBRARY = RAW_PATTERNS.map((pattern) => {
  const placements = computeFacePlacements(pattern.cells);
  if (!placements) {
    throw new Error(`[patternLibrary] Pattern ${pattern.id} (${pattern.name}) has no valid cube unfolding.`);
  }
  return Object.freeze({ ...pattern, placements: Object.freeze(placements) });
});

export function normalizeCells(cells) {
  if (cells.length === 0) return [];
  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  return cells.map((c) => ({ x: c.x - minX, y: c.y - minY }));
}

export function normalizeCellsForComparison(cells) {
  const normalized = normalizeCells(cells);
  return [...normalized].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
}

export function rotateCells(cells, rotation) {
  if (rotation === 0) return cells.map((c) => ({ ...c }));
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  let rotated;
  if (rotation === 90)       rotated = cells.map((c) => ({ x: maxY - c.y, y: c.x }));
  else if (rotation === 180) rotated = cells.map((c) => ({ x: maxX - c.x, y: maxY - c.y }));
  else                       rotated = cells.map((c) => ({ x: c.y, y: maxX - c.x }));
  return normalizeCells(rotated);
}

export function mirrorCells(cells, mirror) {
  if (mirror === 'none') return cells.map((c) => ({ ...c }));
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  let mirrored;
  if (mirror === 'horizontal') mirrored = cells.map((c) => ({ x: maxX - c.x, y: c.y }));
  else                          mirrored = cells.map((c) => ({ x: c.x, y: maxY - c.y }));
  return normalizeCells(mirrored);
}

export function transformCells(cells, rotation, mirror) {
  return rotateCells(mirrorCells(cells, mirror), rotation);
}

export function getPatternById(numericId) {
  return PATTERN_LIBRARY.find((p) => p.numericId === numericId);
}