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
const rooms = new Map() // roomCode -> { players: Map<socketId, {role, score}>, gameState: {}, host: socketId, timer: {}, gameActive: false, usedWords: Set }

// Master word pool
const MASTER_WORD_POOL = [
  'RIVER', 'OCEAN', 'FOREST', 'STORM', 'CLOUD', 'BREEZE', 'DESERT', 'MOUNTAIN', 'FLOWER', 'SUNSET',
  'TIGER', 'ZEBRA', 'MONKEY', 'PANDA', 'KOALA', 'CAMEL', 'HORSE', 'EAGLE', 'OTTER', 'RABBIT',
  'APPLE', 'BERRY', 'MANGO', 'LEMON', 'TOMATO', 'CARROT', 'BREAD', 'CHEESE', 'HONEY', 'OLIVES',
  'DRAGON', 'FAIRY', 'POTION', 'WIZARD', 'CASTLE', 'SPELLS', 'SWORD', 'QUEST', 'CRYSTAL', 'PHOENIX',
  'GALAXY', 'PLANET', 'ROBOTS', 'ATOMOS', 'ORBITS', 'LASERS', 'ASTEROID', 'NEBULA', 'ROCKET', 'GRAVITY',
  'CHAIR', 'TABLE', 'CLOCK', 'PHONE', 'LIGHTS', 'PENCIL', 'BOTTLE', 'CAMERA', 'PILLOW', 'WALLET',
  'SMILE', 'LAUGH', 'HAPPY', 'CALM', 'BRAVE', 'KINDLY', 'HOPEFUL', 'STRONG', 'FOCUSED', 'PEACE',
  'SOCCER', 'CRICKET', 'TENNIS', 'SKATER', 'BOXING', 'CYCLER', 'RUNNER', 'HOCKEY', 'DANCER', 'SWIMMER',
  'TICKET', 'JOURNEY', 'AIRPORT', 'SAFARI', 'ISLAND', 'COMPASS', 'CABINS', 'CAMPER', 'CRUISE', 'TRAILS',
  'SERVER', 'BINARY', 'PYTHON', 'CIRCUIT', 'WIDGET', 'DRIVER', 'SCREEN', 'MODEMS', 'SOCKET',
  'DOCTOR', 'ARTIST', 'SINGER', 'PILOTS', 'CHEFES', 'FARMER', 'ENGINEER', 'WRITER', 'TEACHER', 'BAKER',
  'PURPLE', 'ORANGE', 'INDIGO', 'VIOLET', 'SCARLET', 'MAROON', 'TEAL', 'YELLOW', 'GREEN', 'AZURE',
  'SUMMER', 'WINTER', 'THUNDER', 'RAINY', 'BREEZY', 'SNOWED', 'FROSTY', 'SUNNY', 'CYCLONE', 'MISTED',
  'GOBLIN', 'ORCISH', 'MERMAID', 'TITANS', 'UNICORN', 'KRAKEN', 'SPIRIT', 'SHADOW', 'ANGELS', 'DEMONS',
  'ENERGY', 'CANDY', 'SQUARE', 'PUZZLE', 'DREAMS', 'NINJAS', 'BLAZER', 'CANDLE', 'FROZEN', 'JELLYS'
].map(w => w.toUpperCase())

// Board generation functions (server-side)
function createGrid(size = 10) {
  const grid = []
  for (let i = 0; i < size; i++) {
    grid[i] = []
    for (let j = 0; j < size; j++) {
      grid[i][j] = {
        letter: '',
        isWordLetter: false,
        wordIndex: -1,
        found: false
      }
    }
  }
  return grid
}

function canPlaceWord(grid, word, startRow, startCol, direction, gridSize) {
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * direction.dx
    const col = startCol + i * direction.dy
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return false
    }
    const cell = grid[row][col]
    if (cell.letter !== '' && cell.letter !== word[i]) {
      return false
    }
  }
  return true
}

function placeWords(grid, words, gridSize) {
  const allDirections = [
    { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
    { dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 }
  ]
  
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
  const placedWords = []

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex]
    let placed = false
    let attempts = 0
    const maxAttempts = 200

    while (!placed && attempts < maxAttempts) {
      const direction = allDirections[Math.floor(Math.random() * allDirections.length)]
      const startRow = Math.floor(Math.random() * gridSize)
      const startCol = Math.floor(Math.random() * gridSize)

      if (canPlaceWord(newGrid, word, startRow, startCol, direction, gridSize)) {
        for (let i = 0; i < word.length; i++) {
          const row = startRow + i * direction.dx
          const col = startCol + i * direction.dy
          newGrid[row][col] = {
            letter: word[i],
            isWordLetter: true,
            wordIndex: wordIndex,
            found: false
          }
        }
        placedWords[wordIndex] = { word, startRow, startCol, direction }
        placed = true
      }
      attempts++
    }
  }

  return { grid: newGrid, placedWords }
}

function fillEmptySpaces(grid, gridSize) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (newGrid[i][j].letter === '') {
        newGrid[i][j].letter = letters[Math.floor(Math.random() * letters.length)]
      }
    }
  }
  return newGrid
}

function generateBoardFromWords(words) {
  const emptyGrid = createGrid(10)
  const { grid: gridWithWords } = placeWords(emptyGrid, words, 10)
  const finalGrid = fillEmptySpaces(gridWithWords, 10)
  return finalGrid
}

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
      players.set(socket.id, { 
        role: 'host', 
        score: 0,
        wordsFound: 0,
        currentRound: 1
      })

      rooms.set(roomCode, {
        players,
        gameState: null,
        host: socket.id,
        timer: null,
        gameActive: false,
        timerInterval: null,
        usedWords: new Set(), // Track all words used across all rounds for both players
        hostUsedWords: new Set(), // Track words used by host
        guestUsedWords: new Set() // Track words used by guest
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

        room.players.set(socket.id, { 
          role: 'guest', 
          score: 0,
          wordsFound: 0,
          currentRound: 1
        })
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

  // Generate shared word set for both players (same puzzle)
  function generateSharedWordSet(room) {
    // Get all words that have been used in this room
    const allUsedWords = new Set([...room.usedWords])
    
    // Filter out used words from master pool
    const availableWords = MASTER_WORD_POOL.filter(w => !allUsedWords.has(w))
    
    if (availableWords.length < 8) {
      // If we're running low on words, reset the used words set
      console.log('⚠️ Running low on words, resetting room used words pool')
      room.usedWords.clear()
      const freshWords = [...MASTER_WORD_POOL]
      const shuffled = freshWords.sort(() => Math.random() - 0.5)
      const sharedWords = shuffled.slice(0, 8)
      
      // Update tracking
      sharedWords.forEach(w => {
        room.usedWords.add(w)
      })
      
      return sharedWords
    }
    
    // Shuffle available words and select 8 words for both players
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5)
    const sharedWords = shuffled.slice(0, 8)
    
    // Update tracking
    sharedWords.forEach(w => {
      room.usedWords.add(w)
    })
    
    return sharedWords
  }

  // Generate new shared words for both players (for chain-rounds)
  function generateNewSharedWords(room) {
    // Get words not used in this room
    const availableWords = MASTER_WORD_POOL.filter(w => !room.usedWords.has(w))
    
    if (availableWords.length < 8) {
      // Reset used words if running low
      console.log(`⚠️ Running low on words, resetting room word pool`)
      room.usedWords.clear()
      const freshWords = [...MASTER_WORD_POOL]
      const shuffled = freshWords.sort(() => Math.random() - 0.5)
      const newWords = shuffled.slice(0, 8)
      
      // Update tracking
      newWords.forEach(w => {
        room.usedWords.add(w)
      })
      
      return newWords
    }
    
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5)
    const newWords = shuffled.slice(0, 8)
    
    // Update tracking
    newWords.forEach(w => {
      room.usedWords.add(w)
    })
    
    return newWords
  }

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

    // Reset scores and words found
    room.players.forEach((playerData) => {
      playerData.score = 0
      playerData.wordsFound = 0
      playerData.currentRound = 1
    })

    // Reset word tracking for new game
    room.usedWords.clear()
    room.hostUsedWords.clear()
    room.guestUsedWords.clear()

    // Generate shared word set (same puzzle for both players)
    const sharedWords = generateSharedWordSet(room)
    
    // Generate the board on server to ensure both players get identical layout
    const sharedBoard = generateBoardFromWords(sharedWords)
    
    // Store shared word set and board in room
    room.sharedWords = sharedWords
    room.sharedBoard = sharedBoard

    // Send the same words and board to both players
    console.log(`📤 Sending shared puzzle to both players: ${sharedWords.join(', ')}`)
    io.to(roomCode).emit('generateBoards', {
      words: sharedWords,
      grid: sharedBoard,
      role: 'shared'
    })

    // Start the timer immediately
    if (room.timerInterval) {
      clearInterval(room.timerInterval)
    }

    const duration = 60 // 60 seconds
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
        
        // Send final timer sync to ensure all clients know timer ended
        io.to(roomCode).emit('timerSync', {
          timeRemaining: 0,
          isRunning: false
        })

        // Get final scores
        const finalScores = {}
        room.players.forEach((playerData, id) => {
          finalScores[id] = {
            score: playerData.score,
            role: playerData.role
          }
        })

        // Determine winner (handle ties)
        const scoresArray = Array.from(room.players.entries()).map(([id, data]) => ({
          id,
          score: data.score,
          wordsFound: data.wordsFound || 0,
          role: data.role
        }))
        
        scoresArray.sort((a, b) => {
          // First sort by score, then by words found
          if (b.score !== a.score) return b.score - a.score
          return b.wordsFound - a.wordsFound
        })
        
        const isTie = scoresArray.length === 2 && 
                      scoresArray[0].score === scoresArray[1].score &&
                      scoresArray[0].wordsFound === scoresArray[1].wordsFound

        const result = {
          scores: finalScores,
          isTie,
          hostScore: scoresArray.find(p => p.role === 'host')?.score || 0,
          guestScore: scoresArray.find(p => p.role === 'guest')?.score || 0,
          hostWordsFound: scoresArray.find(p => p.role === 'host')?.wordsFound || 0,
          guestWordsFound: scoresArray.find(p => p.role === 'guest')?.wordsFound || 0
        }

        if (!isTie) {
          const winner = scoresArray[0]
          const loser = scoresArray[1]
          result.winner = {
            id: winner.id,
            score: winner.score,
            wordsFound: winner.wordsFound,
            role: winner.role
          }
          result.loser = {
            id: loser.id,
            score: loser.score,
            wordsFound: loser.wordsFound,
            role: loser.role
          }
        }

        io.to(roomCode).emit('finalResults', result)

        if (isTie) {
          console.log(`Game ended in room ${roomCode}. TIE! Both players scored ${scoresArray[0].score} points`)
        } else {
          console.log(`Game ended in room ${roomCode}. Winner: ${scoresArray[0].role} (${scoresArray[0].id}) with ${scoresArray[0].score} points`)
        }
      }
    }, 1000)

    // Wait a moment for boards to be generated, then broadcast game start
    setTimeout(() => {
      console.log(`📢 Broadcasting game start to room ${roomCode}`)
      io.to(roomCode).emit('hostStartGame', {
        message: 'Game starting!',
        roomCode
      })
    }, 500) // Small delay to ensure boards are received first

    console.log(`✅ Game started in room ${roomCode} by host ${socket.id}`)
    console.log(`   Host words: ${hostWords.join(', ')}`)
    console.log(`   Guest words: ${guestWords.join(', ')}`)
    console.log(`   ⏱️ Timer started: 60 seconds`)
  })

    // Word found by a player
  socket.on('wordFound', ({ roomCode, wordIndex, word, playerId }) => {
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)
    const player = room.players.get(playerId || socket.id)
    
    // Prevent word finding if game is not active or timer has ended
    if (!player || !room.gameActive) {
      console.log(`⏱️ Word finding blocked - game not active for player ${playerId || socket.id}`)
      return
    }
    
    // Check if timer has ended
    if (!room.timer || room.timer.timeRemaining <= 0 || !room.timer.isRunning) {
      console.log(`⏱️ Word finding blocked - timer has ended`)
      return
    }

    // Add points (10 points per word)
    player.score += 10
    player.wordsFound = (player.wordsFound || 0) + 1

    // Broadcast score update
    const scores = {}
    room.players.forEach((playerData, id) => {
      scores[id] = {
        score: playerData.score,
        role: playerData.role,
        wordsFound: playerData.wordsFound || 0
      }
    })

    io.to(roomCode).emit('updateScores', {
      scores,
      foundWordIndex: wordIndex,
      foundWord: word,
      foundBy: playerId || socket.id
    })

    console.log(`Word "${word}" (index ${wordIndex}) found by ${playerId || socket.id} in room ${roomCode}. Score: ${player.score}, Words found: ${player.wordsFound}`)
  })

  // Round complete - player found all words, generate new board (chain-round mechanic)
  socket.on('roundComplete', ({ roomCode, playerId, role }) => {
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)
    const player = room.players.get(playerId || socket.id)
    
    if (!player || !room.gameActive) return

    // Check if timer is still running
    if (!room.timer || room.timer.timeRemaining <= 0) {
      console.log(`⏱️ Timer ended, cannot start new round for ${role}`)
      return
    }

    // Generate new shared words for both players (same puzzle)
    const newWords = generateNewSharedWords(room)

    // Generate the board on server to ensure both players get identical layout
    const newBoard = generateBoardFromWords(newWords)

    // Update shared word set and board in room
    room.sharedWords = newWords
    room.sharedBoard = newBoard

    // Update player's current round
    player.currentRound = (player.currentRound || 1) + 1

    // Send new board and words to BOTH players (same puzzle)
    io.to(roomCode).emit('nextBoard', {
      words: newWords,
      grid: newBoard,
      round: player.currentRound,
      message: `Round ${player.currentRound} started! Keep going!`
    })

    console.log(`🔄 Round ${player.currentRound} started for both players in room ${roomCode}. New words: ${newWords.join(', ')}`)
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

  // Generate shared boards event (for explicit board generation requests)
  socket.on('generateUniqueBoards', ({ roomCode }) => {
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)
    
    if (room.host !== socket.id) {
      socket.emit('generateError', { error: 'Only host can request board generation' })
      return
    }

    // Generate shared word set (same puzzle for both players)
    const sharedWords = generateSharedWordSet(room)
    
    // Generate the board on server to ensure both players get identical layout
    const sharedBoard = generateBoardFromWords(sharedWords)
    
    // Store shared word set and board
    room.sharedWords = sharedWords
    room.sharedBoard = sharedBoard

    // Send same word set and board to both players
    io.to(roomCode).emit('generateBoards', {
      words: sharedWords,
      grid: sharedBoard,
      role: 'shared'
    })

    console.log(`📤 Generated shared puzzle for room ${roomCode}: ${sharedWords.join(', ')}`)
  })

  // Start timer (called by host) - kept for backward compatibility
  // Note: Timer is now automatically started in hostStartGame, but this handler remains for manual control
  socket.on('startTimer', ({ roomCode, duration = 60 }) => {
    if (!roomCode || !rooms.has(roomCode)) return

    const room = rooms.get(roomCode)
    
    if (room.host !== socket.id) return

    // Don't start a new timer if one is already running
    if (room.timer && room.timer.isRunning) {
      console.log(`⏱️ Timer already running in room ${roomCode}, ignoring startTimer request`)
      return
    }

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
        
        // Send final timer sync to ensure all clients know timer ended
        io.to(roomCode).emit('timerSync', {
          timeRemaining: 0,
          isRunning: false
        })

        // Get final scores
        const finalScores = {}
        room.players.forEach((playerData, id) => {
          finalScores[id] = {
            score: playerData.score,
            role: playerData.role
          }
        })

        // Determine winner (handle ties)
        const scoresArray = Array.from(room.players.entries()).map(([id, data]) => ({
          id,
          score: data.score,
          wordsFound: data.wordsFound || 0,
          role: data.role
        }))
        
        scoresArray.sort((a, b) => {
          // First sort by score, then by words found
          if (b.score !== a.score) return b.score - a.score
          return b.wordsFound - a.wordsFound
        })
        
        const isTie = scoresArray.length === 2 && 
                      scoresArray[0].score === scoresArray[1].score &&
                      scoresArray[0].wordsFound === scoresArray[1].wordsFound

        const result = {
          scores: finalScores,
          isTie,
          hostScore: scoresArray.find(p => p.role === 'host')?.score || 0,
          guestScore: scoresArray.find(p => p.role === 'guest')?.score || 0,
          hostWordsFound: scoresArray.find(p => p.role === 'host')?.wordsFound || 0,
          guestWordsFound: scoresArray.find(p => p.role === 'guest')?.wordsFound || 0
        }

        if (!isTie) {
          const winner = scoresArray[0]
          const loser = scoresArray[1]
          result.winner = {
            id: winner.id,
            score: winner.score,
            wordsFound: winner.wordsFound,
            role: winner.role
          }
          result.loser = {
            id: loser.id,
            score: loser.score,
            wordsFound: loser.wordsFound,
            role: loser.role
          }
        }

        io.to(roomCode).emit('finalResults', result)

        if (isTie) {
          console.log(`Game ended in room ${roomCode}. TIE! Both players scored ${scoresArray[0].score} points`)
        } else {
          console.log(`Game ended in room ${roomCode}. Winner: ${scoresArray[0].role} (${scoresArray[0].id}) with ${scoresArray[0].score} points`)
        }
      }
    }, 1000)
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

