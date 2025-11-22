import { useState, useEffect, useRef, useCallback } from 'react'

// Word highlight colors (cycle through these)
const WORD_COLORS = [
  '#48bb78', // green
  '#667eea', // purple
  '#ed8936', // orange
  '#e53e3e', // red
  '#3182ce', // blue
  '#805ad5', // violet
  '#d69e2e', // yellow
  '#38b2ac'  // teal
]

let colorIndex = 0

function getNextColor() {
  const color = WORD_COLORS[colorIndex % WORD_COLORS.length]
  colorIndex++
  return color
}

// Create 10x10 grid
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

// Check if word can be placed
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

// Place words in grid
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

// Fill empty spaces
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

// Generate board from words (called when server sends words)
function generateBoardFromWords(words) {
  console.log('🔨 generateBoardFromWords called with words:', words)
  const emptyGrid = createGrid(10)
  console.log('✅ Empty grid created:', emptyGrid.length, 'x', emptyGrid[0]?.length)
  
  const result = placeWords(emptyGrid, words, 10)
  if (!result || !result.grid) {
    console.error('❌ placeWords failed to return grid')
    throw new Error('Failed to place words in grid')
  }
  
  const { grid: gridWithWords } = result
  console.log('✅ Words placed in grid:', gridWithWords.length, 'x', gridWithWords[0]?.length)
  
  const finalGrid = fillEmptySpaces(gridWithWords, 10)
  console.log('✅ Final grid filled:', finalGrid.length, 'x', finalGrid[0]?.length)
  console.log('📊 Sample cells from final grid:', 
    finalGrid[0]?.[0]?.letter, 
    finalGrid[0]?.[1]?.letter, 
    finalGrid[1]?.[0]?.letter
  )
  
  return finalGrid
}

export function useMultiplayerGame(socket, roomCode, role) {
  const [grid, setGrid] = useState([])
  const [words, setWords] = useState([])
  const [foundWords, setFoundWords] = useState(new Set())
  const [opponentFoundWords, setOpponentFoundWords] = useState(new Set())
  const [gameStarted, setGameStarted] = useState(false)
  const [timer, setTimer] = useState(60) // Initialize to 60 so it shows in UI
  
  // Keep refs in sync with state
  useEffect(() => {
    gameStartedRef.current = gameStarted
  }, [gameStarted])
  
  useEffect(() => {
    gridRef.current = grid
  }, [grid])
  
  useEffect(() => {
    wordsRef.current = words
  }, [words])
  
  useEffect(() => {
    timerRef.current = timer
  }, [timer])
  const [hostScore, setHostScore] = useState(0)
  const [guestScore, setGuestScore] = useState(0)
  const [hostWordsFound, setHostWordsFound] = useState(0)
  const [guestWordsFound, setGuestWordsFound] = useState(0)
  const [currentSelection, setCurrentSelection] = useState('-')
  const [selectedCells, setSelectedCells] = useState([])
  const [hintedCells, setHintedCells] = useState([])
  const [showWinnerScreen, setShowWinnerScreen] = useState(false)
  const [winnerData, setWinnerData] = useState(null)
  const [wordColors, setWordColors] = useState(new Map()) // wordIndex -> color

  const isSelectingRef = useRef(false)
  const selectedCellsRef = useRef([])
  const startCellRef = useRef(null)
  const currentRoundRef = useRef(0)
  const usedWordsRef = useRef(new Set()) // Track all words used across rounds
  const gameStartedRef = useRef(false)
  const gridRef = useRef([])
  const wordsRef = useRef([])
  const timerRef = useRef(60)


  // Socket event handlers
  useEffect(() => {
    if (!socket || !roomCode) {
      console.warn('⚠️ Socket or roomCode missing:', { socket: !!socket, roomCode })
      return
    }

    console.log(`🔌 [${role}] Setting up WebSocket listeners for room: ${roomCode}`)


    const handleGenerateBoards = ({ words: newWords, role: playerRole }) => {
      console.log(`📋 [${playerRole}] Generating board with words:`, newWords)
      
      if (!newWords || newWords.length === 0) {
        console.error('❌ No words received for board generation')
        alert('No words received from server. Please try again.')
        return
      }

      try {
        // Generate board with these words
        console.log(`🔨 [${playerRole}] Starting board generation with ${newWords.length} words...`)
        const finalGrid = generateBoardFromWords(newWords)
        
        // Validate grid
        if (!finalGrid || !Array.isArray(finalGrid) || finalGrid.length === 0) {
          console.error('❌ Failed to generate grid - invalid result:', finalGrid)
          alert('Failed to generate game board. Please try again.')
          return
        }
        
        if (!finalGrid[0] || !Array.isArray(finalGrid[0]) || finalGrid[0].length === 0) {
          console.error('❌ Failed to generate grid - invalid row structure')
          alert('Failed to generate game board. Please try again.')
          return
        }
        
        console.log(`✅ [${playerRole}] Board generated successfully, grid size: ${finalGrid.length}x${finalGrid[0]?.length || 0}`)
        console.log(`📊 [${playerRole}] Grid sample (first row):`, finalGrid[0]?.map(cell => cell?.letter || '?').join(''))
        
        // Update state - use functional update to ensure we're setting the latest state
        console.log(`🔄 [${playerRole}] Setting grid state...`)
        setGrid(() => {
          console.log(`✅ [${playerRole}] Grid setter called with ${finalGrid.length}x${finalGrid[0]?.length} grid`)
          return finalGrid
        })
        setWords(newWords)
        setFoundWords(new Set())
        setOpponentFoundWords(new Set())
        setWordColors(new Map())
        usedWordsRef.current = new Set(newWords)
        currentRoundRef.current = 1
        
        // Verify grid was set correctly after a short delay
        setTimeout(() => {
          const currentGrid = gridRef.current
          console.log(`✅ [${playerRole}] Grid state check. Current grid length: ${currentGrid.length}`)
          if (currentGrid.length === 0) {
            console.error(`❌ [${playerRole}] Grid is still empty after setGrid! Attempting to set again...`)
            // Try setting again as a fallback
            setGrid(finalGrid)
          } else {
            console.log(`✅ [${playerRole}] Grid is valid! First cell:`, currentGrid[0]?.[0]?.letter || 'N/A')
          }
        }, 200)
        
        // Only reset scores when starting a completely new game (round 1, first time)
        // For chain-rounds (round > 1), we want to keep accumulating scores
        if (currentRoundRef.current === 1 && !gameStartedRef.current) {
          // This is the start of a new game, reset scores
          setHostScore(0)
          setGuestScore(0)
          setHostWordsFound(0)
          setGuestWordsFound(0)
        }
        // Timer will be set by server sync, but initialize to 60
        setTimer(60)
        setShowWinnerScreen(false)
        
        console.log(`✅ [${playerRole}] Board ready! Grid: ${finalGrid.length}x${finalGrid[0]?.length}, Words: ${newWords.length}`)
        console.log(`📊 [${playerRole}] Grid sample (first row):`, finalGrid[0]?.map(cell => cell.letter).join(''))
      } catch (error) {
        console.error('❌ Error generating board:', error)
        alert(`Failed to generate game board: ${error.message}. Please try again.`)
      }
    }

    const handleHostStartGame = (data) => {
      console.log(`🎮 [${role}] Game start signal received:`, data)
      console.log(`📊 [${role}] Current state - Grid: ${gridRef.current.length}, Words: ${wordsRef.current.length}, GameStarted: ${gameStartedRef.current}`)
      
      // Mark that game start was requested
      gameStartRequestedRef.current = true
      
      // Try to start immediately if board is ready
      if (gridRef.current.length > 0 && wordsRef.current.length > 0) {
        console.log(`✅ [${role}] Board ready, starting game immediately`)
        setGameStarted(true)
        gameStartRequestedRef.current = false
        // Timer is now started automatically by the server when hostStartGame is called
      } else {
        console.warn(`⚠️ [${role}] Board not ready yet (Grid: ${gridRef.current.length}, Words: ${wordsRef.current.length}), will auto-start when ready`)
        // The useEffect will handle starting when board becomes ready
      }
    }

    const handleStartGameError = ({ error }) => {
      console.error('❌ Error starting game:', error)
      alert(`Error starting game: ${error}`)
    }

    const handleTimerSync = (data) => {
      // Handle both object destructuring and direct data
      const timeRemaining = data?.timeRemaining ?? data
      const isRunning = data?.isRunning ?? true
      
      if (typeof timeRemaining === 'number' && timeRemaining >= 0) {
        setTimer(timeRemaining)
      }
      
      if (!isRunning && timeRemaining === 0) {
        setGameStarted(false)
      }
    }

    const handleUpdateScores = ({ scores, foundWordIndex, foundWord, foundBy }) => {
      // Update scores and words found count
      const hostId = Object.keys(scores).find(id => scores[id].role === 'host')
      const guestId = Object.keys(scores).find(id => scores[id].role === 'guest')
      
      if (hostId) {
        setHostScore(scores[hostId].score)
        setHostWordsFound(scores[hostId].wordsFound || 0)
      }
      if (guestId) {
        setGuestScore(scores[guestId].score)
        setGuestWordsFound(scores[guestId].wordsFound || 0)
      }

      // Update found words - mark the word as found for the player who found it
      if (foundBy === socket.id) {
        // I found this word - assign color and mark as found
        const color = getNextColor()
        setWordColors(prev => new Map(prev).set(foundWordIndex, color))
        setFoundWords(prev => new Set([...prev, foundWordIndex]))
        
        // Update grid to show found cells with color
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => row.map(cell => {
            if (cell.wordIndex === foundWordIndex) {
              return { ...cell, found: true, foundColor: color }
            }
            return cell
          }))
          return newGrid
        })
      } else {
        // Opponent found this word (we don't highlight opponent's words on our board)
        setOpponentFoundWords(prev => new Set([...prev, foundWordIndex]))
      }
    }

    const handleRoundComplete = ({ newWords, round }) => {
      console.log(`🔄 New round ${round} started for ${role}`)
      
      if (!newWords || newWords.length === 0) {
        console.error('No words received for new round')
        return
      }

      // Generate new board with new words
      const finalGrid = generateBoardFromWords(newWords)
      
      setGrid(finalGrid)
      setWords(newWords)
      setFoundWords(new Set())
      setWordColors(new Map())
      usedWordsRef.current = new Set([...usedWordsRef.current, ...newWords])
      currentRoundRef.current = round
    }

    // Handle nextBoard event (chain-round mechanic)
    const handleNextBoard = ({ words: newWords, round, message }) => {
      console.log(`🔄 [${role}] Next board received for round ${round}:`, newWords)
      
      if (!newWords || newWords.length === 0) {
        console.error('No words received for next board')
        return
      }

      // Only process if game is still active and timer is running
      if (!gameStartedRef.current || timerRef.current <= 0) {
        console.log('⏱️ Game not active or timer ended, ignoring next board')
        return
      }

      // Generate new board with new words
      const finalGrid = generateBoardFromWords(newWords)
      
      setGrid(finalGrid)
      setWords(newWords)
      setFoundWords(new Set())
      setWordColors(new Map())
      usedWordsRef.current = new Set([...usedWordsRef.current, ...newWords])
      currentRoundRef.current = round
      
      console.log(`✅ [${role}] New board generated for round ${round}`)
    }

    const handleFinalResults = ({ scores, winner, loser, isTie, hostScore, guestScore, hostWordsFound, guestWordsFound }) => {
      console.log('🏁 Game ended. Results:', { winner, loser, isTie })
      setGameStarted(false)
      setShowWinnerScreen(true)
      
      // Update final scores
      if (hostScore !== undefined) setHostScore(hostScore)
      if (guestScore !== undefined) setGuestScore(guestScore)
      if (hostWordsFound !== undefined) setHostWordsFound(hostWordsFound)
      if (guestWordsFound !== undefined) setGuestWordsFound(guestWordsFound)
      
      setWinnerData({ 
        scores, 
        winner, 
        loser, 
        isTie,
        hostScore: hostScore || hostScore,
        guestScore: guestScore || guestScore,
        hostWordsFound: hostWordsFound || hostWordsFound,
        guestWordsFound: guestWordsFound || guestWordsFound
      })
      setTimer(0)
    }

    // Register event listeners with debug logging
    console.log(`📡 [${role}] Registering WebSocket event listeners`)
    
    socket.on('generateBoards', (data) => {
      console.log(`📥 [${role}] Received generateBoards event:`, data)
      handleGenerateBoards(data)
    })
    
    socket.on('hostStartGame', (data) => {
      console.log(`📥 [${role}] Received hostStartGame event:`, data)
      handleHostStartGame(data)
    })
    
    socket.on('timerSync', (data) => {
      handleTimerSync(data)
    })
    
    socket.on('updateScores', (data) => {
      handleUpdateScores(data)
    })
    
    socket.on('roundComplete', (data) => {
      console.log(`📥 [${role}] Received roundComplete event:`, data)
      handleRoundComplete(data)
    })
    
    socket.on('nextBoard', (data) => {
      console.log(`📥 [${role}] Received nextBoard event:`, data)
      handleNextBoard(data)
    })
    
    socket.on('finalResults', (data) => {
      console.log(`📥 [${role}] Received finalResults event:`, data)
      handleFinalResults(data)
    })
    
    socket.on('startGameError', (data) => {
      console.error(`❌ [${role}] Received startGameError:`, data)
      handleStartGameError(data)
    })
    
    socket.on('opponentJoined', () => {
      console.log(`👤 [${role}] Opponent joined`)
    })
    
    socket.on('opponentLeft', () => {
      console.log(`👋 [${role}] Opponent left`)
      alert('Opponent has left the room')
    })
    
    socket.on('connect', () => {
      console.log(`✅ [${role}] Socket connected:`, socket.id)
    })
    
    socket.on('disconnect', () => {
      console.log(`❌ [${role}] Socket disconnected`)
    })
    
    socket.on('connect_error', (error) => {
      console.error(`❌ [${role}] Socket connection error:`, error)
    })

    // Don't request timer sync on mount - timer will sync when game starts via startTimer event

      return () => {
        console.log(`🧹 [${role}] Cleaning up WebSocket listeners`)
        socket.off('generateBoards')
        socket.off('hostStartGame')
        socket.off('timerSync')
        socket.off('updateScores')
        socket.off('roundComplete')
        socket.off('nextBoard')
        socket.off('finalResults')
        socket.off('startGameError')
        socket.off('opponentJoined')
        socket.off('opponentLeft')
        socket.off('connect')
        socket.off('disconnect')
        socket.off('connect_error')
      }
  }, [socket, roomCode, role])

  // Auto-start game when board is ready and hostStartGame was received
  const gameStartRequestedRef = useRef(false)
  
  useEffect(() => {
    if (gameStartRequestedRef.current && gridRef.current.length > 0 && wordsRef.current.length > 0 && !gameStartedRef.current) {
      console.log(`✅ [${role}] Auto-starting game - board is ready`)
      setGameStarted(true)
      // Timer is now started automatically by the server when hostStartGame is called
      gameStartRequestedRef.current = false
    }
  }, [grid.length, words.length, gameStarted, role, socket, roomCode])

  // Check if all words found (trigger new round) - per player (chain-round mechanic)
  useEffect(() => {
    if (gameStarted && foundWords.size === words.length && words.length === 8 && timer > 0) {
      // All words found, request new round from server
      console.log(`🎯 All ${words.length} words found! Requesting new round (chain-round)...`)
      
      socket.emit('roundComplete', {
        roomCode,
        playerId: socket.id,
        role
      })
    }
  }, [foundWords.size, words.length, gameStarted, socket, roomCode, role, timer])

  const handleStartGame = useCallback(() => {
    if (role !== 'host') {
      console.warn('⚠️ Only host can start the game')
      return
    }
    
    if (!socket || !socket.connected) {
      console.error('❌ Socket not connected')
      alert('WebSocket is not connected. Please check your connection and try again.')
      return
    }
    
    if (!roomCode) {
      console.error('❌ Room code missing')
      alert('Room code is missing. Please rejoin the room.')
      return
    }
    
    console.log('🚀 Host attempting to start game:', { roomCode, socketId: socket.id })
    socket.emit('hostStartGame', { roomCode })
  }, [socket, roomCode, role])

  const getSelectionPath = useCallback((start, end, gridSize) => {
    const path = []
    const dx = end.row - start.row
    const dy = end.col - start.col
    const steps = Math.max(Math.abs(dx), Math.abs(dy))
    
    if (steps === 0) return [start]
    
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx)
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy)
    
    if (Math.abs(dx) !== 0 && Math.abs(dy) !== 0 && Math.abs(dx) !== Math.abs(dy)) {
      return [start]
    }
    
    for (let i = 0; i <= steps; i++) {
      const row = start.row + i * stepX
      const col = start.col + i * stepY
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        path.push({ row, col })
      }
    }
    
    return path
  }, [])

  const handleCellMouseDown = useCallback((row, col) => {
    if (!gameStarted) return
    
    isSelectingRef.current = true
    startCellRef.current = { row, col }
    selectedCellsRef.current = [{ row, col }]
    setSelectedCells([{ row, col }])
    
    const selectedWord = grid[row] && grid[row][col] ? grid[row][col].letter : ''
    setCurrentSelection(selectedWord || '-')
  }, [gameStarted, grid])

  const handleCellMouseOver = useCallback((row, col) => {
    if (!isSelectingRef.current || !startCellRef.current) return
    
    const newSelection = getSelectionPath(startCellRef.current, { row, col }, 10)
    selectedCellsRef.current = newSelection
    setSelectedCells(newSelection)
    
    const selectedWord = newSelection.map(({ row, col }) => 
      grid[row] && grid[row][col] ? grid[row][col].letter : ''
    ).join('')
    setCurrentSelection(selectedWord || '-')
  }, [grid, getSelectionPath])

  const handleCellMouseUp = useCallback(() => {
    if (!isSelectingRef.current) return
    
    isSelectingRef.current = false
    
    const selectedWord = selectedCellsRef.current.map(({ row, col }) => 
      grid[row] && grid[row][col] ? grid[row][col].letter : ''
    ).join('')
    
    const reversedWord = selectedWord.split('').reverse().join('')
    
    let foundWordIndex = -1
    for (let i = 0; i < words.length; i++) {
      if (words[i] === selectedWord || words[i] === reversedWord) {
        foundWordIndex = i
        break
      }
    }
    
    if (foundWordIndex !== -1 && !foundWords.has(foundWordIndex)) {
      const newFoundWords = new Set(foundWords)
      newFoundWords.add(foundWordIndex)
      setFoundWords(newFoundWords)
      
      const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
      selectedCellsRef.current.forEach(({ row, col }) => {
        if (newGrid[row] && newGrid[row][col]) {
          newGrid[row][col].found = true
        }
      })
      setGrid(newGrid)
      
      // Notify server about word found
      socket.emit('wordFound', {
        roomCode,
        wordIndex: foundWordIndex,
        word: words[foundWordIndex],
        playerId: socket.id
      })
    }
    
    selectedCellsRef.current = []
    startCellRef.current = null
    setSelectedCells([])
    setCurrentSelection('-')
  }, [grid, words, foundWords, socket, roomCode])

  useEffect(() => {
    const handleMouseUp = () => {
      if (isSelectingRef.current) {
        handleCellMouseUp()
      }
    }
    
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleCellMouseUp])

  return {
    grid,
    words,
    foundWords,
    opponentFoundWords,
    gameStarted,
    timer,
    hostScore,
    guestScore,
    hostWordsFound,
    guestWordsFound,
    currentSelection,
    selectedCells,
    hintedCells,
    wordColors,
    handleCellMouseDown,
    handleCellMouseOver,
    handleCellMouseUp,
    handleStartGame,
    showWinnerScreen,
    winnerData
  }
}

