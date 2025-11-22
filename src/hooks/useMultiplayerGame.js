import { useState, useEffect, useRef, useCallback } from 'react'

const WORD_LISTS = {
  easy: ['CAT', 'DOG', 'SUN', 'MOON', 'TREE', 'BOOK', 'FISH', 'BIRD'],
  medium: ['COMPUTER', 'RAINBOW', 'OCEAN', 'MOUNTAIN', 'GARDEN', 'PLANET', 'CRYSTAL', 'THUNDER'],
  hard: ['JAVASCRIPT', 'ALGORITHM', 'ADVENTURE', 'BUTTERFLY', 'KNOWLEDGE', 'TELESCOPE', 'SYMPHONY', 'MYSTERY']
}

// Generate 8 random words for multiplayer
function generateMultiplayerWords() {
  const allWords = [...WORD_LISTS.easy, ...WORD_LISTS.medium, ...WORD_LISTS.hard]
  const shuffled = [...allWords].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 8).map(w => w.toUpperCase())
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

// Generate new board
function generateBoard() {
  const words = generateMultiplayerWords()
  const emptyGrid = createGrid(10)
  const { grid: gridWithWords } = placeWords(emptyGrid, words, 10)
  const finalGrid = fillEmptySpaces(gridWithWords, 10)
  return { grid: finalGrid, words }
}

export function useMultiplayerGame(socket, roomCode, role) {
  const [grid, setGrid] = useState([])
  const [words, setWords] = useState([])
  const [foundWords, setFoundWords] = useState(new Set())
  const [opponentFoundWords, setOpponentFoundWords] = useState(new Set())
  const [gameStarted, setGameStarted] = useState(false)
  const [timer, setTimer] = useState(60) // Initialize to 60 so it shows in UI
  const [hostScore, setHostScore] = useState(0)
  const [guestScore, setGuestScore] = useState(0)
  const [currentSelection, setCurrentSelection] = useState('-')
  const [selectedCells, setSelectedCells] = useState([])
  const [hintedCells, setHintedCells] = useState([])
  const [showWinnerScreen, setShowWinnerScreen] = useState(false)
  const [winnerData, setWinnerData] = useState(null)

  const isSelectingRef = useRef(false)
  const selectedCellsRef = useRef([])
  const startCellRef = useRef(null)
  const currentRoundRef = useRef(0)


  // Socket event handlers
  useEffect(() => {
    if (!socket || !roomCode) {
      console.warn('⚠️ Socket or roomCode missing:', { socket: !!socket, roomCode })
      return
    }


    const handleHostStartGame = (data) => {
      // Generate board for both host and guest
      const { grid: newGrid, words: newWords } = generateBoard()
      
      if (!newGrid || newGrid.length === 0 || !newWords || newWords.length === 0) {
        alert('Failed to generate game board. Please try again.')
        return
      }
      
      // Update all state immediately
      setGrid(newGrid)
      setWords(newWords)
      setFoundWords(new Set())
      setOpponentFoundWords(new Set())
      setHostScore(0)
      setGuestScore(0)
      setTimer(60)
      setShowWinnerScreen(false)
      setGameStarted(true)
      currentRoundRef.current = 1

      // Host starts the timer after a short delay
      if (role === 'host') {
        setTimeout(() => {
          socket.emit('startTimer', { roomCode, duration: 60 })
        }, 500)
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

    const handleUpdateScores = ({ scores, foundWordIndex, foundBy }) => {
      // Update scores
      const hostId = Object.keys(scores).find(id => scores[id].role === 'host')
      const guestId = Object.keys(scores).find(id => scores[id].role === 'guest')
      
      if (hostId) setHostScore(scores[hostId].score)
      if (guestId) setGuestScore(scores[guestId].score)

      // Update found words - mark the word as found for the player who found it
      if (foundBy === socket.id) {
        // I found this word
        setFoundWords(prev => new Set([...prev, foundWordIndex]))
        // Update grid to show found cells
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => row.map(cell => {
            if (cell.wordIndex === foundWordIndex) {
              return { ...cell, found: true }
            }
            return cell
          }))
          return newGrid
        })
      } else {
        // Opponent found this word
        setOpponentFoundWords(prev => new Set([...prev, foundWordIndex]))
      }
    }

    const handleRoundComplete = ({ newBoard, newWords }) => {
      console.log('New round started')
      setGrid(newBoard)
      setWords(newWords)
      setFoundWords(new Set())
      setOpponentFoundWords(new Set())
      currentRoundRef.current++
    }

    const handleFinalResults = ({ scores, winner, loser }) => {
      console.log('🏁 Game ended. Winner:', winner)
      setGameStarted(false)
      setShowWinnerScreen(true)
      setWinnerData({ scores, winner, loser })
      setTimer(0)
    }

    // Register event listeners
    socket.on('hostStartGame', handleHostStartGame)
    socket.on('timerSync', handleTimerSync)
    socket.on('updateScores', handleUpdateScores)
    socket.on('roundComplete', handleRoundComplete)
    socket.on('finalResults', handleFinalResults)
    socket.on('startGameError', handleStartGameError)
    socket.on('opponentJoined', () => {
      // Opponent joined - no action needed, UI will update
    })
    socket.on('opponentLeft', () => {
      alert('Opponent has left the room')
    })

    // Don't request timer sync on mount - timer will sync when game starts via startTimer event

    return () => {
      socket.off('hostStartGame', handleHostStartGame)
      socket.off('timerSync', handleTimerSync)
      socket.off('updateScores', handleUpdateScores)
      socket.off('roundComplete', handleRoundComplete)
      socket.off('finalResults', handleFinalResults)
      socket.off('startGameError', handleStartGameError)
      socket.off('opponentJoined')
      socket.off('opponentLeft')
    }
  }, [socket, roomCode, role])

  // Check if all words found (trigger new round) - only host triggers new round
  useEffect(() => {
    if (gameStarted && role === 'host' && foundWords.size === words.length && words.length > 0 && words.length === 8) {
      // All words found, start new round
      console.log('All words found! Starting new round...')
      const { grid: newGrid, words: newWords } = generateBoard()
      
      socket.emit('roundComplete', {
        roomCode,
        boardData: {
          grid: newGrid,
          words: newWords
        }
      })

      // Update local state immediately for host
      setGrid(newGrid)
      setWords(newWords)
      setFoundWords(new Set())
      setOpponentFoundWords(new Set())
      currentRoundRef.current++
    }
  }, [foundWords.size, words.length, gameStarted, socket, roomCode, role])

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
    currentSelection,
    selectedCells,
    hintedCells,
    handleCellMouseDown,
    handleCellMouseOver,
    handleCellMouseUp,
    handleStartGame,
    showWinnerScreen,
    winnerData
  }
}

