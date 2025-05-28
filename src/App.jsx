import React from "react"
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"

import ModeSelect from "./pages/ModeSelect.jsx"
import CategoryList from "./pages/CategoryList.jsx"
import Quiz from "./pages/Quiz.jsx"
import Result from "./pages/Result.jsx"
import MultiplayerLobby from "./pages/MultiplayerLobby.jsx"
import MultiplayerQuiz from "./pages/MultiplayerQuiz.jsx"

export default function App() {
  return (
    <Router basename="/Trivio">
      <div className="app-container">
        <h1 className="app-title">Trivio</h1>
        <Routes>
          {/* 1) Mode selection */}
          <Route path="/" element={<ModeSelect />} />

          {/* 2) Single‐player category list */}
          <Route path="/single" element={<CategoryList />} />

          {/* 3) Single‐player quiz & result */}
          <Route path="/single/:categoryKey" element={<Quiz />} />
          <Route path="/result" element={<Result />} />

          {/* 4) Multiplayer flow (to be implemented) */}
          <Route path="/multiplayer" element={<MultiplayerLobby />} />
          <Route
            path="/multiplayer/:roomId/:playerId"
            element={<MultiplayerQuiz />}
          />

          {/* Fallback */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </div>
    </Router>
  )
}
