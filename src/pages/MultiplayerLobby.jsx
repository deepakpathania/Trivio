import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function MultiplayerLobby() {
  const navigate = useNavigate()
  const [joinRoomId, setJoinRoomId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isDev = import.meta.env.DEV
  const base = isDev ? "" : import.meta.env.VITE_API_BASE_URL

  async function joinRoom(roomId) {
    try {
      setLoading(true)
      setError("")

      const playerId = crypto.randomUUID()
      const res = await fetch(
        `${base}/api/rooms/${encodeURIComponent(
          roomId
        )}/join?playerId=${playerId}`,
        { method: "POST" }
      )
      if (!res.ok) throw new Error("Failed to join room")
      navigate(`/multiplayer/${roomId}/${playerId}`)
    } catch (e) {
      console.error(e)
      setError(e.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    try {
      setLoading(true)
      setError("")

      const res1 = await fetch(`${base}/api/rooms`, { method: "POST" })
      if (!res1.ok) throw new Error("Failed to create room")
      const { roomId } = await res1.json()
      await joinRoom(roomId)
    } catch (e) {
      console.error(e)
      setError(e.message || "Unknown error")
      setLoading(false)
    }
  }

  function handleJoinClick(e) {
    e.preventDefault()
    if (!joinRoomId.trim()) {
      setError("Please enter a room ID")
      return
    }
    joinRoom(joinRoomId.trim())
  }

  return (
    <div className="multiplayer-lobby">
      <h3 className="lobby-title">Multiplayer Lobby</h3>
      {error && <div className="error">{error}</div>}

      <div className="lobby-row">
        <button
          className="btn lobby-btn create-btn"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating…" : "Create New Room"}
        </button>
      </div>

      <div className="lobby-row join-row">
        <form onSubmit={handleJoinClick} className="join-form">
          <input
            type="text"
            placeholder="Enter room ID"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            className="join-input"
          />
          <button type="submit" className="btn lobby-btn join-btn" disabled={loading}>
            {loading ? "Joining…" : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  )
}
