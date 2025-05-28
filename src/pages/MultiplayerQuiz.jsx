import React from "react"
import { useParams } from "react-router-dom"

export default function MultiplayerQuiz() {
  const { roomId, playerId } = useParams()
  return (
    <div className="multiplayer-quiz">
      <h2>Room: {roomId}</h2>
      <p>Player ID: {playerId}</p>
      <p>Loading game…</p>
    </div>
  )
}
