import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateQuestions } from './questionGenerator.js';
import { isValidUnfoldingOfCube, findCorrectOptionIndex } from './answerValidator.js';
import { RotatingCube3D } from './RotatingCube3D.jsx';
import { UnfoldedCubeOption } from './UnfoldedCubeOption.jsx';

const translations = {
  en: {
    question: 'Question',
    of: 'of',
    selectMatching: 'Select the matching unfolded cube',
    next: 'Next',
    finish: 'Finish',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    exit: 'Exit',
    submit: 'Submit Answer',
    totalTime: 'Total',
    auto: 'Auto',
    manual: 'Manual',
  },
  de: {
    question: 'Frage',
    of: 'von',
    selectMatching: 'Wählen Sie den passenden aufgefalteten Würfel',
    next: 'Weiter',
    finish: 'Beenden',
    correct: 'Richtig!',
    incorrect: 'Falsch',
    exit: 'Beenden',
    submit: 'Antwort absenden',
    totalTime: 'Gesamt',
    auto: 'Auto',
    manual: 'Manuell',
  },
};

export function RotatingCubeTraining({ settings, onComplete, onExit }) {
  const t = translations[settings.locale] || translations.en;

  const [manualControl, setManualControl] = useState(false);
  const [questions] = useState(() => generateQuestions(settings.questionCount));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [responses, setResponses] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sessionStartTime] = useState(Date.now());
  const [questionTime, setQuestionTime] = useState(
    settings.mode === 'exam' ? settings.timePerQuestion : 0
  );
  const [totalSessionTime, setTotalSessionTime] = useState(0);

  const answeredRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isPracticeMode = settings.mode === 'practice';
  const isLastQuestion = currentIndex === questions.length - 1;

  /**
   * The template-verified correct index, used for UI highlighting at result
   * time. Derived from the 9 templates, not the stored field.
   */
  const verifiedCorrectIndex = useMemo(() => {
    if (!currentQuestion) return -1;
    const idx = findCorrectOptionIndex(currentQuestion.options, currentQuestion.cube);
    return idx >= 0 ? idx : currentQuestion.correctOptionIndex;
  }, [currentQuestion]);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => setTotalSessionTime((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Question timer
  useEffect(() => {
    if (showResult) return;

    const interval = setInterval(() => {
      if (isPracticeMode) {
        setQuestionTime((p) => p + 1);
      } else {
        setQuestionTime((p) => {
          if (p <= 1) {
            handleTimeUp();
            return settings.timePerQuestion;
          }
          return p - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, isPracticeMode, currentIndex]);

  // Reset answered flag on new question
  useEffect(() => {
    answeredRef.current = false;
  }, [currentIndex]);

  const handleTimeUp = () => {
    if (showResult || answeredRef.current) return;
    answeredRef.current = true;

    const responseTime = Date.now() - questionStartTime;
    setResponses((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        selectedOptionIndex: -1,
        isCorrect: false,
        responseTimeMs: responseTime,
      },
    ]);

    if (!isPracticeMode) {
      setTimeout(() => handleNext(), 300);
    } else {
      setShowResult(true);
    }
  };

  const handleSelectOption = (optionIndex) => {
    if (showResult) return;
    setSelectedOption(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || showResult || answeredRef.current) return;
    answeredRef.current = true;

    // SOURCE OF TRUTH: verify against the 9 templates.
    const selected = currentQuestion.options[selectedOption];
    const isCorrect = isValidUnfoldingOfCube(selected, currentQuestion.cube);

    const responseTime = Date.now() - questionStartTime;

    setResponses((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        selectedOptionIndex: selectedOption,
        isCorrect,
        responseTimeMs: responseTime,
      },
    ]);

    if (isPracticeMode) {
      setShowResult(true);
    } else {
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((p) => p + 1);
      setSelectedOption(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
      setQuestionTime(isPracticeMode ? 0 : settings.timePerQuestion);
    } else {
      onComplete({
        questions,
        responses: [
          ...responses,
          ...(answeredRef.current && !showResult
            ? [] // already pushed
            : []),
        ],
        startTime: sessionStartTime,
        endTime: Date.now(),
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCorrect =
    selectedOption !== null &&
    isValidUnfoldingOfCube(currentQuestion.options[selectedOption], currentQuestion.cube);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 rounded"
            >
              ← {t.exit}
            </button>
          )}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {t.question} {currentIndex + 1} {t.of} {questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-mono bg-gray-200 px-3 py-1 rounded">
              ⏱ {formatTime(questionTime)}
            </div>
            <div className="text-sm font-mono bg-blue-100 px-3 py-1 rounded">
              {t.totalTime}: {formatTime(totalSessionTime)}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Rotating cube */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-center text-lg font-semibold mb-4">{t.selectMatching}</h2>
            <div className="flex justify-center items-center min-h-[280px]">
              <div className="flex items-center gap-4">
                <RotatingCube3D
                  cube={currentQuestion.cube}
                  difficulty={settings.difficulty}
                  size={180}
                  manualControl={manualControl}
                />
                <button
                  onClick={() => setManualControl((p) => !p)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                >
                  {manualControl ? `↻ ${t.auto}` : `✋ ${t.manual}`}
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <UnfoldedCubeOption
                  key={index}
                  unfolded={option}
                  index={index}
                  selected={selectedOption === index}
                  correct={index === verifiedCorrectIndex}
                  showResult={showResult && isPracticeMode}
                  onClick={() => handleSelectOption(index)}
                  disabled={showResult}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Submit button */}
        {selectedOption !== null && !showResult && (
          <div className="flex justify-center">
            <button
              onClick={handleSubmitAnswer}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 min-w-[200px]"
            >
              {t.submit} →
            </button>
          </div>
        )}

        {/* Result card (practice mode only) */}
        {showResult && isPracticeMode && (
          <div
            className={`bg-white rounded-lg shadow border-2 p-4 ${
              isCorrect ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <span className="font-medium text-green-600">✓ {t.correct}</span>
                ) : (
                  <span className="font-medium text-red-600">✕ {t.incorrect}</span>
                )}
              </div>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isLastQuestion ? t.finish : t.next} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
