import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function Result() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const score = params.get('score') || 0;

  const shareText = encodeURIComponent(
    `I scored ${score}/10 on QuizUp Retro! Try to beat me: ${window.location.href}`
  );

  return (
    <div className="quiz-container">
      <h2>Quiz Complete!</h2>
      <p>Your Score: {score}/10</p>
      <div className="options">
        <button className="btn" onClick={() => navigator.clipboard.writeText(window.location.href)}>
          Copy Share Link
        </button>
        <a className="btn" href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank" rel="noopener noreferrer">
          Share on Twitter
        </a>
        <Link className="btn" to="/">
          Play Again
        </Link>
      </div>
    </div>
  );
}