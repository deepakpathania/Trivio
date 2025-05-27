import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { loadBigOQuestions } from "../utils/dataLoader";
import { createPokePaginator } from "../utils/pokePaginator";
import { CATEGORIES } from "../constants/categories";

// Constants
const TOTAL_QUESTIONS = 10;
const POKEMON_CATEGORY = "pokemon";

// Shuffle utility
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
  const hasInteractedRef = useRef(false);

  const isPokemon = categoryKey === POKEMON_CATEGORY;

  // Toggle mute state
  const toggleMute = () => {
    setMuted((m) => !m);
    if (themeAudioRef.current) {
      themeAudioRef.current.muted = !themeAudioRef.current.muted;
    }
  };

  // Initialize theme audio on mount (preload only)
  useEffect(() => {
    if (!isPokemon) return;
    const audio = new Audio("/Trivio/pokemon-theme.mp3");
    audio.loop = true;
    audio.muted = muted;
    audio.preload = "auto";
    audio.play().catch(() => {});
    themeAudioRef.current = audio;
    return () => {
      audio.pause();
      themeAudioRef.current = null;
    };
  }, [isPokemon]);

  // Load questions
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

  // Prefetch
  useEffect(() => {
    if (isPokemon && paginatorRef.current) {
      const pg = paginatorRef.current;
      pg.ensureBuffer(currentIndex + 1);
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

  // Handle user interaction to start theme
  const handleInteraction = () => {
    if (isPokemon && themeAudioRef.current && !hasInteractedRef.current) {
      themeAudioRef.current.muted = muted;
      themeAudioRef.current.play().catch(() => {});
      hasInteractedRef.current = true;
    }
  };

  // Handle answer
  const handleAnswer = useCallback((idx) => {
    handleInteraction();
    clearInterval(timerRef.current);
    setSelected(idx);
    const correct = idx === questions[currentIndex]?.answerIndex;
    if (correct) setScore((s) => s + 1);

    // Prefetch next
    if (isPokemon && paginatorRef.current) paginatorRef.current.ensureBuffer(currentIndex + 1);

    const FEEDBACK_DELAY = correct ? 400 : 800;

    setTimeout(() => {
      const next = currentIndex + 1;
      if (next < TOTAL_QUESTIONS && next < questions.length) {
        setCurrentIndex(next);
        setSelected(null);
      } else {
        const finalScore = correct ? score + 1 : score;
        if (onComplete) onComplete({ score: finalScore, total: TOTAL_QUESTIONS });
        else navigate(`/result?score=${finalScore}`);
      }
    }, FEEDBACK_DELAY);
  }, [currentIndex, questions, score, onComplete, navigate, isPokemon]);

  if (!questions.length) return <div className="loading-screen">Loading Quiz...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="quiz-container" onClick={handleInteraction}>
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
