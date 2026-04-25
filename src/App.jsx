import React, { useState } from 'react';
import { RotatingCubeSetup } from './rotatingCube/RotatingCubeSetup.jsx';
import { RotatingCubeTraining } from './rotatingCube/RotatingCubeTraining.jsx';
import { RotatingCubeSummary } from './rotatingCube/RotatingCubeSummary.jsx';

export default function App() {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'training' | 'summary'
  const [settings, setSettings] = useState(null);
  const [session, setSession] = useState(null);

  const handleStart = (cfg) => {
    setSettings(cfg);
    setPhase('training');
  };

  const handleComplete = (sess) => {
    setSession(sess);
    setPhase('summary');
  };

  const handleRestart = () => {
    setSession(null);
    setPhase('training');
  };

  const handleBackToSetup = () => {
    setSettings(null);
    setSession(null);
    setPhase('setup');
  };

  if (phase === 'setup') {
    return <RotatingCubeSetup onStart={handleStart} />;
  }

  if (phase === 'training') {
    return (
      <RotatingCubeTraining
        settings={settings}
        onComplete={handleComplete}
        onExit={handleBackToSetup}
      />
    );
  }

  return (
    <RotatingCubeSummary
      settings={settings}
      session={session}
      onRestart={handleRestart}
      onBackToSetup={handleBackToSetup}
    />
  );
}
