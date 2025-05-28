import React from "react"
import { useNavigate } from "react-router-dom"

export default function ModeSelect() {
  const navigate = useNavigate()
  return (
    <div className="mode-select">
      <button
        className="btn mode-btn text-wrap"
        onClick={() => navigate("/single")}
      >
        Single Player
      </button>
      <button
        className="btn mode-btn text-wrap"
        onClick={() => navigate("/multiplayer")}
      >
        Multiplayer
      </button>
    </div>
  )
}
