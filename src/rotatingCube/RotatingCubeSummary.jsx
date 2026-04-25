import React from 'react';

const translations = {
  en: {
    title: 'Your Results',
    questions: 'Questions',
    correct: 'Correct',
    accuracy: 'Accuracy',
    avgTime: 'Avg Time',
    tryAgain: 'Try Again',
    backToSetup: 'Back to Setup',
    excellent: 'Excellent!',
    good: 'Good job!',
    needsWork: 'Keep practicing!',
    difficulty: 'Difficulty',
    mode: 'Mode',
  },
  de: {
    title: 'Ihre Ergebnisse',
    questions: 'Fragen',
    correct: 'Richtig',
    accuracy: 'Genauigkeit',
    avgTime: 'Durchschn. Zeit',
    tryAgain: 'Erneut Versuchen',
    backToSetup: 'Zurück zur Einstellung',
    excellent: 'Ausgezeichnet!',
    good: 'Gut gemacht!',
    needsWork: 'Weiter üben!',
    difficulty: 'Schwierigkeit',
    mode: 'Modus',
  },
};

export function RotatingCubeSummary({ settings, session, onRestart, onBackToSetup }) {
  const t = translations[settings.locale] || translations.en;

  const correctCount = session.responses.filter((r) => r.isCorrect).length;
  const totalQuestions = session.responses.length || 1;
  const accuracy = (correctCount / totalQuestions) * 100;
  const totalTimeMs = (session.endTime || Date.now()) - session.startTime;
  const avgTimeSeconds = totalTimeMs / totalQuestions / 1000;

  const verdict =
    accuracy >= 85 ? t.excellent : accuracy >= 65 ? t.good : t.needsWork;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <div className="text-5xl font-bold text-blue-600 mt-4">
            {accuracy.toFixed(0)}%
          </div>
          <div className="text-xl text-gray-700 mt-2">{verdict}</div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600">{t.questions}</div>
              <div className="text-2xl font-bold">{totalQuestions}</div>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600">{t.correct}</div>
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600">{t.avgTime}</div>
              <div className="text-2xl font-bold">{avgTimeSeconds.toFixed(1)}s</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            {t.difficulty}: {settings.difficulty} &middot; {t.mode}: {settings.mode}
          </div>
        </div>

        {/* Question-by-question breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {settings.locale === 'de' ? 'Übersicht' : 'Breakdown'}
          </h2>
          <div className="space-y-2">
            {session.responses.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded ${
                  r.isCorrect
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <span>
                  {settings.locale === 'de' ? 'Frage' : 'Question'} {i + 1}
                </span>
                <span className="font-mono text-sm">
                  {(r.responseTimeMs / 1000).toFixed(1)}s
                </span>
                <span className={r.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {r.isCorrect ? '✓' : '✕'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            ↻ {t.tryAgain}
          </button>
          <button
            onClick={onBackToSetup}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
          >
            ← {t.backToSetup}
          </button>
        </div>
      </div>
    </div>
  );
}
