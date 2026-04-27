import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ROTATION_SPEEDS } from './constants.js';

/**
 * Aircraft icon as inline SVG.
 */
function AircraftIcon({ rotation }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-3/4 h-3/4"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M50 10 L53 28 L82 46 L82 52 L53 44 L53 68 L64 78 L64 82 L50 76 L36 82 L36 78 L47 68 L47 44 L18 52 L18 46 L47 28 Z"
        fill="#1a1a1a"
      />
    </svg>
  );
}

/**
 * A single cube face rendered as a flat square with optional aircraft.
 */
function CubeFace({ face, transform, size }) {
  const bgColor = face.color === 'blue' ? '#bae6fd' : '#ffffff';
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        width: size,
        height: size,
        transform,
        background: bgColor,
        border: '2px solid #374151',
        boxSizing: 'border-box',
      }}
    >
      {face.hasAircraft && <AircraftIcon rotation={face.aircraftOrientation || 0} />}
    </div>
  );
}

/**
 * The 3D rotating cube using CSS 3D transforms.
 *
 * - `difficulty` controls auto-rotation speed.
 * - `manualControl` lets the user drag to rotate.
 */
export function RotatingCube3D({ cube, difficulty, size = 180, manualControl = false }) {
  const [rotX, setRotX] = useState(-20);
  const [rotY, setRotY] = useState(30);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // Auto-rotation animation loop
  useEffect(() => {
    if (manualControl) return;

    const speed = ROTATION_SPEEDS[difficulty] || 45;

    const tick = (now) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      //setRotY((prev) => (prev + speed * dt) % 360);
      setRotY((prev) => prev + speed * dt);
      setRotX((prev) => prev + speed * 0.3 * dt * Math.sin(now / 2000));
      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [difficulty, manualControl]);

  // Manual drag controls
  const handlePointerDown = useCallback((e) => {
    if (!manualControl) return;
    draggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, [manualControl]);

  const handlePointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setRotY((prev) => prev + dx * 0.5);
    setRotX((prev) => Math.max(-89, Math.min(89, prev - dy * 0.5)));
  }, []);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const half = size / 2;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: size * 4,
        cursor: manualControl ? 'grab' : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="relative"
        style={{
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: manualControl && draggingRef.current ? 'none' : 'transform 0.05s linear',
        }}
      >
        <CubeFace face={cube.front}  transform={`translateZ(${half}px)`}                          size={size} />
        <CubeFace face={cube.back}   transform={`rotateY(180deg) translateZ(${half}px)`}           size={size} />
        <CubeFace face={cube.right}  transform={`rotateY(90deg) translateZ(${half}px)`}            size={size} />
        <CubeFace face={cube.left}   transform={`rotateY(-90deg) translateZ(${half}px)`}           size={size} />
        <CubeFace face={cube.top}    transform={`rotateX(90deg) translateZ(${half}px)`}            size={size} />
        <CubeFace face={cube.bottom} transform={`rotateX(-90deg) translateZ(${half}px)`}           size={size} />
      </div>
    </div>
  );
}
