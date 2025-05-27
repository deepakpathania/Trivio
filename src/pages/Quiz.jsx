// src/pages/Quiz.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadPokemonQuestions } from '../utils/pokeLoader';
import { loadBigOQuestions } from '../utils/dataLoader';
import { CATEGORIES } from '../constants/categories';

export default function Quiz() {
  const { categoryKey } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef(null);

  // Load questions and start audio if Pokemon
  useEffect(() => {
    async function load() {
      let qs = [];
      if (categoryKey === 'pokemon') {
        qs = await loadPokemonQuestions(10);
      } else if (categoryKey === 'bigO') {
        const all = await loadBigOQuestions();
        qs = shuffle(all).slice(0, 10);
      }
      setQuestions(qs);
      // play music for Pokémon
      if (categoryKey === 'pokemon' && audioRef.current) {
        audioRef.current.muted = muted;
        audioRef.current.play().catch(() => {});
      }
    }
    load();
  }, [categoryKey]);

  // Timer setup per question
  useEffect(() => {
    if (!questions.length) return;
    setTimeLeft(15);
    setSelected(null);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => Math.max(t - 1, 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questions, currentIndex]);

  // Auto-submit on timeout
  useEffect(() => {
    if (timeLeft === 0 && selected === null) {
      handleAnswer(null);
    }
  }, [timeLeft]);

  // Pause audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current && audioRef.current.pause();
    };
  }, []);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function handleAnswer(index) {
    clearInterval(timerRef.current);
    setSelected(index);
    const current = questions[currentIndex];
    const isCorrect = index === current.answerIndex;
    if (isCorrect) setScore(s => s + 1);
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(i => i + 1);
      } else {
        navigate(`/result?score=${score + (isCorrect ? 1 : 0)}`);
      }
    }, 1500);
  }

  if (!questions.length) return <div>Loading questions...</div>;

  const q = questions[currentIndex];

  return (
    <>
      {categoryKey === 'pokemon' && (
        <audio
          ref={audioRef}
          src="/Trivio/public/audio/pokemon-theme.mp3"
          loop
          muted={muted}
        />
      )}
      <div className="quiz-container">
        {categoryKey === 'pokemon' && (
          <button
            className="btn mute-btn"
            onClick={() => {
              setMuted(m => !m);
              if (audioRef.current) audioRef.current.muted = !muted;
            }}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}
        <h2>{CATEGORIES.find(c => c.key === categoryKey)?.label} Quiz</h2>
        <div>Question {currentIndex + 1} / {questions.length}</div>
        {q.question && (
          <p className="question-text">{q.question}</p>
        )}
        {q.image && (
          <img
            src={q.image}
            alt="pokemon"
            className="question-image"
          />
        )}
        <div className="timer">Time Left: {timeLeft}s</div>
        <div className="options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`btn option ${
                selected !== null
                  ? i === q.answerIndex
                    ? 'correct'
                    : i === selected
                    ? 'wrong'
                    : ''
                  : ''
              }`}
              disabled={selected !== null}
              onClick={() => handleAnswer(i)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}