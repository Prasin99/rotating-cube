import React from 'react';
//import { FACE_ASSIGNMENTS } from './constants.js';
//import { getPatternById, transformCells, PATTERN_LIBRARY } from './patternLibrary.js';
import { getPatternById, transformCells, PATTERN_LIBRARY } from './patternLibrary.js';
function AircraftIcon({ rotation }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full p-1"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M50 10 L53 28 L82 46 L82 52 L53 44 L53 68 L64 78 L64 82 L50 76 L36 82 L36 78 L47 68 L47 44 L18 52 L18 46 L47 28 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FaceCell({ face, size }) {
  const isBlue = face.color === 'blue';
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: isBlue ? '#bae6fd' : '#ffffff',
        border: '1px solid black',
        boxSizing: 'border-box',
      }}
    >
      {face.hasAircraft && (
        <div className="w-full h-full text-gray-900">
          <AircraftIcon rotation={face.aircraftOrientation || 0} />
        </div>
      )}
    </div>
  );
}

/**
 * One answer option: the unfolded cube net.
 */
export function UnfoldedCubeOption({
  unfolded,
  index,
  selected,
  correct,
  showResult,
  onClick,
  disabled,
}) {
  const cellSize = 32;
  const basePattern = getPatternById(unfolded.layoutType) ?? PATTERN_LIBRARY[0];
  const rotation = unfolded.rotation ?? 0;
  const mirror = unfolded.mirror ?? 'none';
  const transformedCells = transformCells(basePattern.cells, rotation, mirror);

  const maxRow = Math.max(...transformedCells.map((c) => c.y)) + 1;
  const maxCol = Math.max(...transformedCells.map((c) => c.x)) + 1;

  // Build the grid. Cell index order is preserved through transforms, so
  // FACE_ASSIGNMENTS[i] correctly identifies each cell's cube face.
 const grid = Array(maxRow)
    .fill(null)
    .map(() => Array(maxCol).fill(null));
  transformedCells.forEach((cell, i) => {
    grid[cell.y][cell.x] = basePattern.placements[i].face;
  });

  let borderClass = 'border-gray-300';
  if (showResult) {
    if (correct) borderClass = 'border-green-500 bg-green-50 ring-2 ring-green-500';
    else if (selected) borderClass = 'border-red-500 bg-red-50';
  } else if (selected) {
    borderClass = 'border-blue-500 bg-blue-50';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative p-3 border-2 rounded-lg transition-all bg-gray-50 ${borderClass} ${
        !disabled && !showResult ? 'hover:border-blue-400 hover:bg-gray-100 cursor-pointer' : ''
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <div className="flex flex-col">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((faceName, colIndex) => {
              if (faceName) {
                const face = unfolded.faces[faceName];
                return (
                  <FaceCell key={`${rowIndex}-${colIndex}`} face={face} size={cellSize} />
                );
              }
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{ width: cellSize, height: cellSize }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="absolute -top-2 -left-2 w-6 h-6 bg-white border border-gray-400 rounded flex items-center justify-center text-xs font-bold text-gray-900">
        {index + 1}
      </div>
    </button>
  );
}
