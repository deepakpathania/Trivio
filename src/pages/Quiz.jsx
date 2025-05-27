import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { loadBigOQuestions } from "../utils/dataLoader";
import { createPokePaginator } from "../utils/pokePaginator";
import { CATEGORIES } from "../constants/categories";

// Constants
const TOTAL_QUESTIONS = 10;
const POKEMON_CATEGORY = "pokemon";

// Utility to shuffle arrays
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Memoized question display
const QuestionDisplay = memo(({ question, onAnswer, selected, answerIndex }) => (
  <div className="question-block">
    {question.question && <p className="question-text text-wrap">{question.question}</p>}
    {question.image && <img src={question.image} alt="quiz" className="question-image" />}
    <div className="options">
      {question.options.map((opt, i) => (
        <button
          key={i}
          className={`btn option text-wrap ${
            selected !== null
              ? i === answerIndex
                ? "correct"
                : i === selected
                ? "wrong"
                : ""
              : ""
          }`}
          disabled={selected !== null}
          onClick={() => onAnswer(i)}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
));

export default function Quiz({ onComplete }) {
  const { categoryKey } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [muted, setMuted] = useState(false);

  const timerRef = useRef(null);
  const paginatorRef = useRef(null);
  const themeAudioRef = useRef(null);

  const isPokemon = categoryKey === POKEMON_CATEGORY;

  // Toggle mute state
  const toggleMute = () => setMuted((m) => !m);

  // Play theme on mount
  useEffect(() => {
    if (!isPokemon) return;
    const audio = new Audio("/Trivio/pokemon-theme.mp3");
    audio.loop = true;
    audio.muted = muted;
    audio.play().catch(() => {});
    themeAudioRef.current = audio;
    return () => {
      audio.pause();
    };
  }, [isPokemon]);

  // Sync mute state
  useEffect(() => {
    if (themeAudioRef.current) themeAudioRef.current.muted = muted;
  }, [muted]);

  // Initial load and basic chunk logic
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isPokemon) {
        const pg = createPokePaginator(TOTAL_QUESTIONS, 3);
        paginatorRef.current = pg;
        await pg.init();
        if (!active) return;
        setQuestions(pg.buffer.slice(0, 3));
      } else {
        const all = await loadBigOQuestions();
        if (!active) return;
        setQuestions(shuffle(all).slice(0, TOTAL_QUESTIONS));
      }
      setCurrentIndex(0);
      setScore(0);
      setSelected(null);
      setTimeLeft(15);
    };
    load();
    return () => { active = false; clearInterval(timerRef.current); };
  }, [categoryKey, isPokemon]);

  // Prefetch on index change
  useEffect(() => {
    if (isPokemon && paginatorRef.current) {
      const pg = paginatorRef.current;
      pg.ensureBuffer(currentIndex);
      setQuestions(pg.buffer.slice(0, TOTAL_QUESTIONS));
    }
  }, [currentIndex, isPokemon]);

  // Timer per question
  useEffect(() => {
    if (!questions.length) return;
    clearInterval(timerRef.current);
    setTimeLeft(15);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questions, currentIndex]);

  // Handle answer
  const handleAnswer = useCallback((idx) => {
    clearInterval(timerRef.current);
    setSelected(idx);
    const correct = idx === questions[currentIndex]?.answerIndex;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      const next = currentIndex + 1;
      if (next < TOTAL_QUESTIONS) {
        setCurrentIndex(next);
        setSelected(null);
      } else {
        onComplete
          ? onComplete({ score: correct ? score + 1 : score, total: TOTAL_QUESTIONS })
          : navigate(`/result?score=${correct ? score + 1 : score}`);
      }
    }, 600);
  }, [currentIndex, questions, score, onComplete, navigate]);

  if (!questions.length) return <div className="loading-screen">Loading Quiz...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="quiz-container">
      {/* Header with title and mute in top-right */}
      <div className="quiz-header" style={{ position: 'relative' }}>
        <h2>{CATEGORIES.find((c) => c.key === categoryKey)?.label} Quiz</h2>
        {isPokemon && (
          <button
            className="btn mute-toggle"
            onClick={toggleMute}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}
      </div>

      <div className="progress">Question {currentIndex + 1} / {TOTAL_QUESTIONS}</div>
      <div className="timer">Time Left: {timeLeft}s</div>
      <QuestionDisplay
        question={currentQ}
        onAnswer={handleAnswer}
        selected={selected}
        answerIndex={currentQ.answerIndex}
      />
    </div>
  );
}

Quiz.propTypes = {
  onComplete: PropTypes.func,
};
