import React, { useMemo } from 'react';
import { RotatingCube3D } from './RotatingCube3D.jsx';
import { UnfoldedCubeOption } from './UnfoldedCubeOption.jsx';
import { findCorrectOptionIndex } from './answerValidator.js';

const translations = {
  en: {
    title: 'Your Results',
    questions: 'Questions',
    correct: 'Correct',
    accuracy: 'Accuracy',
    avgTime: 'Avg Time',
    avgTimePerQuestion: 'Average Time per Question',
    correctAnswers: 'Correct Answers',
    tryAgain: 'Try Again',
    backToSetup: 'Back to Setup',
    excellent: 'Excellent!',
    good: 'Good job!',
    needsWork: 'Keep practicing!',
    difficulty: 'Difficulty',
    mode: 'Mode',
    breakdown: 'Breakdown',
    detailedAnalysis: 'Detailed Analysis',
    legendCorrect: 'Correct answer',
    legendYourWrong: 'Your incorrect selection',
    question: 'Question',
    notAnswered: 'Not answered',
  },
  de: {
    title: 'Ihre Ergebnisse',
    questions: 'Fragen',
    correct: 'Richtig',
    accuracy: 'Genauigkeit',
    avgTime: 'Durchschn. Zeit',
    avgTimePerQuestion: 'Durchschnittliche Zeit pro Frage',
    correctAnswers: 'Richtige Antworten',
    tryAgain: 'Erneut Versuchen',
    backToSetup: 'Zurück zur Einstellung',
    excellent: 'Ausgezeichnet!',
    good: 'Gut gemacht!',
    needsWork: 'Weiter üben!',
    difficulty: 'Schwierigkeit',
    mode: 'Modus',
    breakdown: 'Übersicht',
    detailedAnalysis: 'Detaillierte Analyse',
    legendCorrect: 'Richtige Antwort',
    legendYourWrong: 'Ihre falsche Auswahl',
    question: 'Frage',
    notAnswered: 'Nicht beantwortet',
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

  const isExam = settings.mode === 'exam';

  // Build a per-question correct-index lookup so the analysis matches
  // the same source of truth used during training.
  const correctIndexByQuestion = useMemo(() => {
    if (!session.questions) return [];
    return session.questions.map((q) => {
      const idx = findCorrectOptionIndex(q.options, q.cube);
      return idx >= 0 ? idx : q.correctOptionIndex;
    });
  }, [session.questions]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ====== Top results card ====== */}
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

        {/* ====== Question-by-question breakdown ====== */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t.breakdown}</h2>
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
                  {t.question} {i + 1}
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

        {/* ====== Detailed Analysis (EXAM MODE ONLY) ====== */}
        {isExam && session.questions && session.questions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">◎</span>
              <h2 className="text-lg font-semibold">{t.detailedAnalysis}</h2>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-green-500 rounded-sm bg-green-50" />
                <span className="text-gray-700">{t.legendCorrect}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-red-500 rounded-sm bg-red-50" />
                <span className="text-gray-700">{t.legendYourWrong}</span>
              </div>
            </div>

            <div className="space-y-6">
              {session.questions.map((q, qIndex) => {
                const response = session.responses[qIndex];
                const isCorrect = response?.isCorrect;
                const selectedIdx = response?.selectedOptionIndex ?? -1;
                const correctIdx = correctIndexByQuestion[qIndex];
                const timeS = response
                  ? (response.responseTimeMs / 1000).toFixed(1)
                  : '–';

                return (
                  <div
                    key={qIndex}
                    className={`rounded-lg border-l-4 p-4 ${
                      isCorrect
                        ? 'border-green-500 bg-green-50/30'
                        : 'border-red-500 bg-red-50/30'
                    }`}
                  >
                    {/* Question header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${
                            isCorrect ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          {t.question} {qIndex + 1}
                        </span>
                        <span
                          className={`text-lg ${
                            isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isCorrect ? '✓' : '✕'}
                        </span>
                      </div>
                      <div className="text-sm font-mono text-gray-600">
                        ⏱ {timeS}s
                      </div>
                    </div>

                    {/* Cube preview */}
                    <div className="bg-white rounded border border-gray-200 py-4 mb-4 flex justify-center">
                      <RotatingCube3D
                        cube={q.cube}
                        difficulty={settings.difficulty}
                        size={120}
                        manualControl={true}
                      />
                    </div>

                    {/* Four options A B C D */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {q.options.map((option, oIndex) => {
                        const letter = ['A', 'B', 'C', 'D'][oIndex] || String(oIndex + 1);
                        const isThisCorrect = oIndex === correctIdx;
                        const isThisSelected = oIndex === selectedIdx;
                        return (
                          <div key={oIndex} className="flex flex-col items-center gap-1">
                            <span className="text-sm font-semibold text-gray-700">
                              {letter}
                            </span>
                            <div className="pointer-events-none">
                              <UnfoldedCubeOption
                                unfolded={option}
                                index={oIndex}
                                selected={isThisSelected}
                                correct={isThisCorrect}
                                showResult={true}
                                onClick={() => {}}
                                disabled={false}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Caption when user did not answer */}
                    {selectedIdx === -1 && (
                      <div className="mt-3 text-sm text-red-600 italic">
                        {t.notAnswered}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ====== Action buttons ====== */}
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
