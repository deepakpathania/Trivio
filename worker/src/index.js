import { Router } from 'itty-router'
import RoomClass from './room.js'

const router = Router()

// 1) Create a new room (returns roomId)
router.post('/api/rooms', async () => {
    const roomId = crypto.randomUUID()
    return new Response(JSON.stringify({ roomId }), { status: 201 })
  })

// Join room
router.post('/api/rooms/:roomId/join', async (request, env) => {
    const { roomId } = request.params
    const url = new URL(request.url)
    const playerId = url.searchParams.get('playerId') || crypto.randomUUID()
    const idObj = env.ROOM.idFromName(roomId)
    const stub = env.ROOM.get(idObj)
    return stub.fetch(
      new Request(`https://unused/join?playerId=${playerId}`, { method: 'POST' })
    )
  })

// 3) Initialize questions in the room
//    Client must send { questions: [...] } or { questionsUrl: "..." }
router.post('/api/rooms/:roomId/init', async (request, env) => {
    const { roomId } = request.params
    const initPayload = await request.json()
    const idObj = env.ROOM.idFromName(roomId)
    const stub = env.ROOM.get(idObj)
    return stub.fetch(
      new Request(`https://unused/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initPayload)
      })
    )
  })
  

// 4) Submit an answer (payload: { playerId, answer })
router.post('/api/rooms/:roomId/answer', async (request, env) => {
    const { roomId } = request.params
    const { playerId, answer } = await request.json()
    const idObj = env.ROOM.idFromName(roomId)
    const stub = env.ROOM.get(idObj)
    return stub.fetch(
      new Request(`https://unused/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, answer })
      })
    )
  })

// 5) Poll room state
router.get('/api/rooms/:roomId/state', async (request, env) => {
    const { roomId } = request.params
    const idObj = env.ROOM.idFromName(roomId)
    const stub = env.ROOM.get(idObj)
    return stub.fetch(new Request(`https://unused/state`))
  })
  
  // 404
  router.all('*', () => new Response('Not found', { status: 404 }))

  export default {
    // Workers will call this fetch
    async fetch(request, env) {
      return router.handle(request, env)
    }
  }

  export const Room = RoomClass
