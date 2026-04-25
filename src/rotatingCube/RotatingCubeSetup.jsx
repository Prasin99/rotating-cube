import React, { useState } from 'react';

const translations = {
  en: {
    title: 'Rotating Cube Training',
    subtitle: 'Select the unfolded cube that matches the rotating 3D cube.',
    difficulty: 'Difficulty',
    easy: 'Easy (slow rotation)',
    medium: 'Medium',
    hard: 'Hard (fast rotation)',
    questionCount: 'Number of questions',
    mode: 'Mode',
    practice: 'Practice (instant feedback)',
    exam: 'Exam (timed, no feedback)',
    timePerQuestion: 'Time per question (sec)',
    locale: 'Language',
    start: 'Start',
  },
  de: {
    title: 'Würfel Rotation Training',
    subtitle: 'Wählen Sie den aufgefalteten Würfel, der zum rotierenden 3D-Würfel passt.',
    difficulty: 'Schwierigkeit',
    easy: 'Leicht (langsame Rotation)',
    medium: 'Mittel',
    hard: 'Schwer (schnelle Rotation)',
    questionCount: 'Anzahl der Fragen',
    mode: 'Modus',
    practice: 'Übung (sofortiges Feedback)',
    exam: 'Prüfung (mit Zeit, ohne Feedback)',
    timePerQuestion: 'Zeit pro Frage (Sek.)',
    locale: 'Sprache',
    start: 'Starten',
  },
};

export function RotatingCubeSetup({ onStart }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [mode, setMode] = useState('practice');
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [locale, setLocale] = useState('en');

  const t = translations[locale];

  const handleStart = () => {
    onStart({
      difficulty,
      questionCount,
      locale,
      mode,
      timePerQuestion,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.locale}
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.difficulty}
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="easy">{t.easy}</option>
              <option value="medium">{t.medium}</option>
              <option value="hard">{t.hard}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.questionCount}
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.mode}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="practice"
                  checked={mode === 'practice'}
                  onChange={(e) => setMode(e.target.value)}
                />
                <span>{t.practice}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="exam"
                  checked={mode === 'exam'}
                  onChange={(e) => setMode(e.target.value)}
                />
                <span>{t.exam}</span>
              </label>
            </div>
          </div>

          {mode === 'exam' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.timePerQuestion}
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Math.max(5, Number(e.target.value) || 5))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleStart}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          {t.start} →
        </button>
      </div>
    </div>
  );
}
