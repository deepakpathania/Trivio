// src/pages/Result.jsx
import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";

export default function Result() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const score = params.get("score") || "0";

  const [copiedLink, setCopiedLink] = useState(false);

  // Base URL without query params
  const cleanUrl = `${window.location.origin}/Trivio/`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cleanUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const shareText = encodeURIComponent(
    `I scored ${score}/10 on QuizUp Retro! Try to beat me: ${cleanUrl}`
  );

  return (
    <div className="quiz-container">
      <h2>Quiz Complete!</h2>
      <p>Your Score: {score}/10</p>
      <div className="options">
        <button className="btn share-btn" onClick={handleCopyLink}>
          {copiedLink ? "Link Copied! ✓" : "Share Link"}
        </button>
        <a
          className="btn share-btn"
          href={`https://x.com/intent/tweet?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Share on X
        </a>
        <Link className="btn share-btn" to="/">
          Play Again
        </Link>
      </div>
    </div>
  );
}
