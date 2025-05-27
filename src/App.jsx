import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import { CATEGORIES } from "./constants/categories";

export default function App() {
  return (
    <Router basename="/Trivio">
      <div className="app-container">
        <h1 className="app-title">Trivio</h1>
        <Routes>
          <Route
            path="/"
            element={
              <div className="category-list">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.key}
                    to={cat.enabled ? `/quiz/${cat.key}` : "#"}
                    className={`btn category-btn ${
                      !cat.enabled ? "disabled" : ""
                    }`}
                    onClick={(e) => !cat.enabled && e.preventDefault()}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            }
          />
          <Route path="/quiz/:categoryKey" element={<Quiz />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </div>
    </Router>
  );
}
