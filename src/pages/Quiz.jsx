import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { loadBigOQuestions } from "../utils/dataLoader";
import { createPokePaginator } from "../utils/pokePaginator";
import { CATEGORIES } from "../constants/categories";

// Memoized question display component
const QuestionDisplay = memo(({ q, onAnswer, selected, answerIndex }) => (
  <>
    {q.question && <p className="question-text text-wrap">{q.question}</p>}
    {q.image && <img src={q.image} alt="quiz" className="question-image" />}
    <div className="options">
      {q.options.map((opt, i) => (
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

  const isPokemon = categoryKey === "pokemon";
  const TOTAL = 10;
  const paginatorRef = useRef(null);

  // shuffle helper
  const shuffle = useCallback((arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);

  // initialize quiz and background fetch for Pokemon
  useEffect(() => {
    let mounted = true;
    async function init() {
      if (isPokemon) {
        const paginator = createPokePaginator(TOTAL, 3);
        paginatorRef.current = paginator;

        // Fetch initial chunk
        await paginator.init();
        let buffer = paginator.buffer;
        const initial = buffer.slice(0, 3);
        // preload initial images
        await Promise.all(
          initial.map((q) =>
            q.image
              ? new Promise((r) => {
                  const img = new Image();
                  img.src = q.image;
                  img.onload = img.onerror = r;
                })
              : Promise.resolve()
          )
        );
        if (!mounted) return;
        setQuestions(initial);

        // Background fetch remaining chunks
        (async () => {
          while (mounted && buffer.length < TOTAL) {
            await paginator.init(); // fetch next chunk
            buffer = paginator.buffer;
            const sliceEnd = Math.min(buffer.length, TOTAL);
            const newItems = buffer.slice(questions.length, sliceEnd);
            // preload new items
            await Promise.all(
              newItems.map((q) =>
                q.image
                  ? new Promise((r) => {
                      const img = new Image();
                      img.src = q.image;
                      img.onload = img.onerror = r;
                    })
                  : Promise.resolve()
              )
            );
            if (!mounted) break;
            setQuestions(buffer.slice(0, sliceEnd));
          }
        })();
      } else {
        const all = await loadBigOQuestions();
        const picked = shuffle(all).slice(0, TOTAL);
        if (!mounted) return;
        setQuestions(picked);
      }
      setCurrentIndex(0);
      setScore(0);
      setSelected(null);
      setTimeLeft(15);
    }
    init();
    return () => {
      mounted = false;
      clearInterval(timerRef.current);
    };
  }, [categoryKey, isPokemon, shuffle]);

  // timer per question
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

  const handleAnswer = useCallback(
    (idx) => {
      clearInterval(timerRef.current);
      setSelected(idx);
      const q = questions[currentIndex];
      const correct = idx === q.answerIndex;
      if (correct) setScore((s) => s + 1);
      setTimeout(() => {
        const next = currentIndex + 1;
        if (next < TOTAL && next < questions.length) {
          setCurrentIndex(next);
          setSelected(null);
        } else {
          navigate(`/result?score=${score + (correct ? 1 : 0)}`);
        }
      }, 600);
    },
    [currentIndex, questions, score, navigate]
  );

  if (!questions.length)
    return <div className="loading-screen">Loading Quiz...</div>;

  const q = questions[currentIndex];

  return (
    <div className="quiz-container">
      <h2>{CATEGORIES.find((c) => c.key === categoryKey)?.label} Quiz</h2>
      <div className="progress">
        Question {currentIndex + 1} / {TOTAL}
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

Quiz.propTypes = {
  onComplete: PropTypes.func,
};
