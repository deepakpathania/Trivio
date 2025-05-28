export default class Room {
    constructor(state, env) {
      this.state = {
        players: {},           // { playerId: { score, responded } }
        questions: [],         // must be set via /init
        current: 0,            // index of current question
        hasStarted: false,     // flips true on /init
        winnerForCurrent: null // playerId who won this question
      }
      this.env = env
      this.id = state.id
      this.storage = state.storage
  
      state.blockConcurrencyWhile(async () => {
        const stored = await state.storage.get('data')
        if (stored) this.state = stored
      })
    }
  
    async fetch(request) {
      const url = new URL(request.url)
  
      switch (url.pathname) {
  
        case '/init': {
          const payload = await request.json()
          // Must be provided by client
          if (Array.isArray(payload.questions)) {
            this.state.questions = payload.questions
          } else if (typeof payload.questionsUrl === 'string') {
            const res = await fetch(payload.questionsUrl)
            if (!res.ok) {
              return new Response('Failed to fetch questions', { status: 502 })
            }
            this.state.questions = await res.json()
          } else {
            return new Response('Invalid init payload', { status: 400 })
          }
  
          // Reset game state
          this.state.current = 0
          this.state.hasStarted = true
          this.state.winnerForCurrent = null
          for (const pid in this.state.players) {
            this.state.players[pid].responded = false
          }
  
          await this._save()
          return new Response(null, { status: 204 })
        }
  
        case '/join': {
          const pid = url.searchParams.get('playerId')
          if (!pid) {
            return new Response('Missing playerId', { status: 400 })
          }
          if (!this.state.players[pid]) {
            this.state.players[pid] = { score: 0, responded: false }
            await this._save()
          }
          return new Response(JSON.stringify({ playerId: pid }), { status: 200 })
        }
  
        case '/answer': {
          const { playerId, answer } = await request.json()
          const p = this.state.players[playerId]
          if (!this.state.hasStarted || !p || p.responded || this.state.winnerForCurrent) {
            return new Response(null, { status: 204 })
          }
  
          const currentQ = this.state.questions[this.state.current]
          if (answer === currentQ.correct) {
            p.score++
            this.state.winnerForCurrent = playerId
          }
          p.responded = true
  
          // If all players answered, advance
          if (Object.values(this.state.players).every(x => x.responded)) {
            this.state.current++
            this.state.winnerForCurrent = null
            for (const pid in this.state.players) {
              this.state.players[pid].responded = false
            }
          }
  
          await this._save()
          return new Response(null, { status: 204 })
        }
  
        case '/state': {
          const { players, questions, current, hasStarted, winnerForCurrent } = this.state
          const question = questions[current] || null
          const payload = { players, hasStarted, current, question, winnerForCurrent }
          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
  
        default:
          return new Response('Not found', { status: 404 })
      }
    }
  
    async _save() {
      await this.storage.put('data', this.state)
    }
  }
  