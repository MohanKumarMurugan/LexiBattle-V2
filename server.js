import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Store rooms and players
const rooms = new Map() // roomCode -> { players: Map<socketId, {role, score}>, gameState: {}, host: socketId, timer: {}, gameActive: false }

// Generate random room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Create a new room (Host)
  socket.on('createRoom', () => {
    try {
      let roomCode = generateRoomCode()
      let attempts = 0
      const maxAttempts = 10
      
      while (rooms.has(roomCode) && attempts < maxAttempts) {
        roomCode = generateRoomCode()
        attempts++
      }

      if (attempts >= maxAttempts) {
        socket.emit('createError', { error: 'Failed to generate unique room code. Please try again.' })
        return
      }

      const players = new Map()
      players.set(socket.id, { role: 'host', score: 0 })

      rooms.set(roomCode, {
        players,
        gameState: null,
        host: socket.id,
        timer: null,
        gameActive: false,
        timerInterval: null
      })

      socket.join(roomCode)
      socket.emit('hostCreatedRoom', { roomCode, role: 'host' })
      console.log(`✅ Room created: ${roomCode} by host ${socket.id}`)
    } catch (error) {
      console.error('Error creating room:', error)
      socket.emit('createError', { error: 'An error occurred while creating the room. Please try again.' })
    }
  })

  // Join an existing room (Guest)
  socket.on('joinRoom', ({ roomCode }) => {
    if (!roomCode) {
      socket.emit('joinError', { error: 'Room code is required' })
      return
    }

    const room = rooms.get(roomCode)
    
    if (!room) {
      socket.emit('joinError', { error: 'Room not found' })
      return
    }

    if (room.players.size >= 2) {
      socket.emit('joinError', { error: 'Room is full' })
      return
    }

    room.players.set(socket.id, { role: 'guest', score: 0 })
    socket.join(roomCode)
    
    socket.emit('guestJoinedRoom', { 
      roomCode,
      role: 'guest',
      hostId: room.host
    })

    // Notify host that guest joined
    socket.to(roomCode).emit('opponentJoined', {
      guestId: socket.id
    })

    console.log(`Guest ${socket.id} joined room ${roomCode}`)
  })

  // Host starts the game
  socket.on('hostStartGame', ({ roomCode }) => {
    if (!roomCode || !rooms.has(roomCode)) {
      socket.emit('startGameError', { error: 'Room not found' })
      return
    }

    const room = rooms.get(roomCode)
    
    if (room.host !== socket.id) {
      socket.emit('startGameError', { error: 'Only host can start the game' })
      return
    }

    if (room.players.size < 2) {
      socket.emit('startGameError', { error: 'Waiting for opponent' })
      return
    }

    if (room.gameActive) {
      socket.emit('startGameError', { error: 'Game already in progress' })
      return
    }

    // Mark game as active
    room.gameActive = true

    // Reset scores
    room.players.forEach((playerData) => {
      playerData.score = 0
    })

    // Broadcast to all players in room
    io.to(roomCode).emit('hostStartGame', {
      message: 'Game starting!'
    })

    console.log(`✅ Game started in room ${roomCode} by host ${socket.id}`)
  })

  // Word found by a player
  socket.on('wordFound', ({ roomCode, wordIndex, playerId }) => {
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)
    const player = room.players.get(playerId || socket.id)
    
    if (!player) return

    // Add points (10 points per word)
    player.score += 10

    // Broadcast score update
    const scores = {}
    room.players.forEach((playerData, id) => {
      scores[id] = {
        score: playerData.score,
        role: playerData.role
      }
    })

    io.to(roomCode).emit('updateScores', {
      scores,
      foundWordIndex: wordIndex,
      foundBy: playerId || socket.id
    })

    console.log(`Word ${wordIndex} found by ${playerId || socket.id} in room ${roomCode}. Score: ${player.score}`)
  })

  // Timer sync (server maintains master timer)
  socket.on('requestTimerSync', ({ roomCode }) => {
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)
    
    if (room.timer) {
      socket.emit('timerSync', {
        timeRemaining: room.timer.timeRemaining,
        isRunning: room.timer.isRunning
      })
    }
  })

  // Start timer (called by host)
  socket.on('startTimer', ({ roomCode, duration = 60 }) => {
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)
    
    if (room.host !== socket.id) return

    // Clear existing timer if any
    if (room.timerInterval) {
      clearInterval(room.timerInterval)
    }

    room.timer = {
      timeRemaining: duration,
      isRunning: true,
      startTime: Date.now()
    }

    // Broadcast initial timer
    io.to(roomCode).emit('timerSync', {
      timeRemaining: duration,
      isRunning: true
    })

    // Start countdown
    room.timerInterval = setInterval(() => {
      if (!room.timer) return

      const elapsed = Math.floor((Date.now() - room.timer.startTime) / 1000)
      const remaining = Math.max(0, duration - elapsed)

      room.timer.timeRemaining = remaining

      io.to(roomCode).emit('timerSync', {
        timeRemaining: remaining,
        isRunning: remaining > 0
      })

      // Timer ended
      if (remaining === 0) {
        clearInterval(room.timerInterval)
        room.timer.isRunning = false
        room.gameActive = false

        // Get final scores
        const finalScores = {}
        room.players.forEach((playerData, id) => {
          finalScores[id] = {
            score: playerData.score,
            role: playerData.role
          }
        })

        // Determine winner
        const scoresArray = Array.from(room.players.entries()).map(([id, data]) => ({
          id,
          score: data.score,
          role: data.role
        }))
        
        scoresArray.sort((a, b) => b.score - a.score)
        const winner = scoresArray[0]
        const loser = scoresArray[1]

        io.to(roomCode).emit('finalResults', {
          scores: finalScores,
          winner: {
            id: winner.id,
            score: winner.score,
            role: winner.role
          },
          loser: {
            id: loser.id,
            score: loser.score,
            role: loser.role
          }
        })

        console.log(`Game ended in room ${roomCode}. Winner: ${winner.id} with ${winner.score} points`)
      }
    }, 1000)
  })

  // Round complete (all words found, start new round)
  socket.on('roundComplete', ({ roomCode, boardData }) => {
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)
    
    if (!room.gameActive) return

    // Broadcast new round
    io.to(roomCode).emit('roundComplete', {
      newBoard: boardData.grid,
      newWords: boardData.words,
      message: 'New round started!'
    })

    console.log(`New round started in room ${roomCode}`)
  })

  // Leave room
  socket.on('leaveRoom', ({ roomCode }) => {
    if (roomCode && rooms.has(roomCode)) {
      const room = rooms.get(roomCode)
      
      // Clear timer if host leaves
      if (room.host === socket.id && room.timerInterval) {
        clearInterval(room.timerInterval)
      }

      room.players.delete(socket.id)
      
      if (room.players.size === 0) {
        if (room.timerInterval) {
          clearInterval(room.timerInterval)
        }
        rooms.delete(roomCode)
        console.log(`Room ${roomCode} deleted (empty)`)
      } else {
        socket.to(roomCode).emit('opponentLeft')
      }
      
      socket.leave(roomCode)
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    for (const [roomCode, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        // Clear timer if host disconnects
        if (room.host === socket.id && room.timerInterval) {
          clearInterval(room.timerInterval)
        }

        room.players.delete(socket.id)
        
        if (room.players.size === 0) {
          if (room.timerInterval) {
            clearInterval(room.timerInterval)
          }
          rooms.delete(roomCode)
          console.log(`Room ${roomCode} deleted (host disconnected)`)
        } else {
          socket.to(roomCode).emit('opponentLeft')
        }
        break
      }
    }
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket server ready at ws://localhost:${PORT}`)
})
