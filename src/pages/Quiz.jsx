// src/pages/Quiz.jsx
import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadPokemonQuestions } from "../utils/pokeLoader";
import { loadBigOQuestions } from "../utils/dataLoader";
import { CATEGORIES } from "../constants/categories";

// Memoized question display component
const QuestionDisplay = memo(({ q, onAnswer, selected, answerIndex }) => (
  <>
    {q.question && <p className="question-text">{q.question}</p>}
    {q.image && <img src={q.image} alt="quiz" className="question-image" />}
    <div className="options">
      {q.options.map((opt, i) => (
        <button
          key={i}
          className={`btn option ${
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
  </>
));

export default function Quiz() {
  const { categoryKey } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);

  // Shuffle helper
  const shuffle = useCallback((arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  // Answer handler
  const handleAnswer = useCallback(
    (index) => {
      clearInterval(timerRef.current);
      setSelected(index);
      const isCorrect = index === questions[currentIndex].answerIndex;
      if (isCorrect) setScore((s) => s + 1);
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentIndex(nextIndex);
        } else {
          navigate(`/result?score=${score + (isCorrect ? 1 : 0)}`);
        }
      }, 300);
    },
    [currentIndex, questions, score, navigate]
  );

  // Load questions once and preload images
  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (categoryKey === "pokemon") {
        const qs = await loadPokemonQuestions(10);
        await Promise.all(
          qs.map((q) =>
            q.image
              ? new Promise((r) => {
                  const img = new Image();
                  img.src = q.image;
                  img.onload = img.onerror = r;
                })
              : Promise.resolve()
          )
        );
        if (isMounted) {
          setQuestions(qs);
          setCurrentIndex(0);
        }
      } else {
        const all = await loadBigOQuestions();
        if (isMounted) {
          setQuestions(shuffle(all).slice(0, 10));
          setCurrentIndex(0);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [categoryKey, shuffle]);

  // Handle question change: reset timer and selected
  useEffect(() => {
    if (!questions.length) return;
    setSelected(null);
    setTimeLeft(15);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questions, currentIndex]);

  // Auto-advance on timeout
  useEffect(() => {
    if (timeLeft === 0 && selected === null) {
      handleAnswer(null);
    }
  }, [timeLeft, selected, handleAnswer]);

  if (!questions.length)
    return <div className="loading-screen">Loading Quiz...</div>;

  const q = questions[currentIndex];

  return (
    <div className="quiz-container">
      <h2>{CATEGORIES.find((c) => c.key === categoryKey)?.label} Quiz</h2>
      <div className="progress">
        Question {currentIndex + 1} / {questions.length}
      </div>
      <div className="timer">Time Left: {timeLeft}s</div>
      <QuestionDisplay
        q={q}
        onAnswer={handleAnswer}
        selected={selected}
        answerIndex={q.answerIndex}
      />
    </div>
  );
}
