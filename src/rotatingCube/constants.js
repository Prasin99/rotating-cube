// Face assignments: which cube face each cell (in index order) represents
// when the net is folded into a cube.
//export const FACE_ASSIGNMENTS = ['top', 'left', 'front', 'right', 'back', 'bottom'];
import { getPatternById, transformCells, PATTERN_LIBRARY } from './patternLibrary.js';
// Rotation speeds for the 3D cube (degrees per second) by difficulty
export const ROTATION_SPEEDS = {
  easy: 20,
  medium: 45,
  hard: 80,
};

// All allowed aircraft orientations (in degrees, clockwise from up)
export const ORIENTATIONS = [0, 90, 180, 270];


// All allowed net rotations
export const ROTATIONS = [0, 90, 180, 270];

// All allowed mirror transforms
//export const MIRRORS = ['none', 'horizontal', 'vertical'];
// Was: ['none', 'horizontal', 'vertical']
export const MIRRORS = ['none'];
// All active layout IDs (1-9, all 9 templates)
export const ALL_LAYOUTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
//export const ALL_LAYOUTS = [1, 2, 3, 4, 6];
export const PER_FACE_ROTATION = {
  1: { front: 0, back: 0, left: 0, right: 0, top: 0,   bottom: 0   },
  2: { front: 0, back: 0, left: 0, right: 0, top: 270, bottom: 90  },
  3: { front: 0, back: 0, left: 0, right: 0, top: 90,  bottom: 270 },
  4: { front: 0, back: 0, left: 0, right: 0, top: 0,   bottom: 270 },
  6: { front: 0, back: 0, left: 0, right: 0, top: 180, bottom: 90  },
};