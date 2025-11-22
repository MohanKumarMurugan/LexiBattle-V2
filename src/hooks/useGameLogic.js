import { useState, useEffect, useRef, useCallback } from 'react'

const WORD_LISTS = {
  easy: ['CAT', 'DOG', 'SUN', 'MOON', 'TREE', 'BOOK', 'FISH', 'BIRD'],
  medium: ['COMPUTER', 'RAINBOW', 'OCEAN', 'MOUNTAIN', 'GARDEN', 'PLANET', 'CRYSTAL', 'THUNDER'],
  hard: ['JAVASCRIPT', 'ALGORITHM', 'ADVENTURE', 'BUTTERFLY', 'KNOWLEDGE', 'TELESCOPE', 'SYMPHONY', 'MYSTERY']
}

const loadCustomWords = () => {
  const saved = localStorage.getItem('findWordsCustomWords')
  return saved ? JSON.parse(saved) : ['JAVASCRIPT', 'CODING', 'PUZZLE', 'GAME']
}

const saveCustomWords = (words) => {
  localStorage.setItem('findWordsCustomWords', JSON.stringify(words))
}

export function useGameLogic(gameMode = 'singleplayer', socket = null, roomCode = null) {
  const [grid, setGrid] = useState([])
  const [words, setWords] = useState([])
  const [foundWords, setFoundWords] = useState(new Set())
  const [gridSize, setGridSize] = useState(15)
  const [currentMode, setCurrentMode] = useState('random')
  const [difficulty, setDifficulty] = useState('medium')
  const [customWords, setCustomWords] = useState(loadCustomWords())
  const [gameStarted, setGameStarted] = useState(false)
  const [currentSelection, setCurrentSelection] = useState('-')
  const [timer, setTimer] = useState('00:00')
  const [showWinModal, setShowWinModal] = useState(false)
  const [finalTime, setFinalTime] = useState('00:00')
  const [hintCooldown, setHintCooldown] = useState(false)
  const [selectedCells, setSelectedCells] = useState([])
  const [hintedCells, setHintedCells] = useState([])
  const [opponentFoundWords, setOpponentFoundWords] = useState(new Set())
  
  const isSelectingRef = useRef(false)
  const selectedCellsRef = useRef([])
  const startCellRef = useRef(null)
  const gameStartTimeRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const placedWordsRef = useRef([])
  const hintedCellsRef = useRef([])
  const currentHintWordIndexRef = useRef(-1)
  const isMultiplayerRef = useRef(gameMode === 'multiplayer')

  const getDirectionsForDifficulty = useCallback(() => {
    const easyDirections = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
    ]
    const mediumDirections = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
      { dx: 0, dy: -1 }, { dx: -1, dy: 0 }
    ]
    const hardDirections = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
      { dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 }
    ]
    
    switch (difficulty) {
      case 'easy': return easyDirections
      case 'medium': return mediumDirections
      case 'hard': return hardDirections
      default: return mediumDirections
    }
  }, [difficulty])

  const generateRandomWords = useCallback(() => {
    const allWords = [...WORD_LISTS.easy, ...WORD_LISTS.medium, ...WORD_LISTS.hard]
    const numWords = Math.floor(Math.random() * 5) + 8
    const shuffled = [...allWords].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(numWords, shuffled.length))
  }, [])

  const canPlaceWord = useCallback((grid, word, startRow, startCol, direction, gridSize) => {
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
  }, [])

  const createGrid = useCallback(() => {
    const newGrid = []
    for (let i = 0; i < gridSize; i++) {
      newGrid[i] = []
      for (let j = 0; j < gridSize; j++) {
        newGrid[i][j] = {
          letter: '',
          isWordLetter: false,
          wordIndex: -1,
          found: false
        }
      }
    }
    return newGrid
  }, [gridSize])

  const placeWords = useCallback((grid, words, gridSize, mode, difficulty) => {
    const allDirections = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
      { dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 }
    ]
    
    const directions = mode === 'random' ? getDirectionsForDifficulty() : allDirections
    const placedWords = []
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })))

    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex]
      let placed = false
      let attempts = 0
      const maxAttempts = 100

      while (!placed && attempts < maxAttempts) {
        const direction = directions[Math.floor(Math.random() * directions.length)]
        const startRow = Math.floor(Math.random() * gridSize)
        const startCol = Math.floor(Math.random() * gridSize)

        if (canPlaceWord(newGrid, word, startRow, startCol, direction, gridSize)) {
          const wordCells = []
          for (let i = 0; i < word.length; i++) {
            const row = startRow + i * direction.dx
            const col = startCol + i * direction.dy
            newGrid[row][col] = {
              letter: word[i],
              isWordLetter: true,
              wordIndex: wordIndex,
              found: false
            }
            wordCells.push({ row, col })
          }
          placedWords[wordIndex] = {
            word: word,
            cells: wordCells,
            startRow,
            startCol,
            direction
          }
          placed = true
        }
        attempts++
      }
    }

    return { grid: newGrid, placedWords }
  }, [canPlaceWord, getDirectionsForDifficulty])

  const fillEmptySpaces = useCallback((grid, gridSize) => {
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
  }, [])

  const syncGameState = useCallback((gameState) => {
    if (gameState.grid) setGrid(gameState.grid)
    if (gameState.words) setWords(gameState.words)
    if (gameState.foundWords) setFoundWords(new Set(gameState.foundWords))
    if (gameState.opponentFoundWords) setOpponentFoundWords(new Set(gameState.opponentFoundWords))
  }, [])

  const setMultiplayerMode = useCallback((isMultiplayer) => {
    isMultiplayerRef.current = isMultiplayer
  }, [])

  const newGame = useCallback(() => {
    setFoundWords(new Set())
    setOpponentFoundWords(new Set())
    setGameStarted(false)
    setShowWinModal(false)
    setCurrentSelection('-')
    setSelectedCells([])
    setTimer('00:00')
    setHintCooldown(false)
    setHintedCells([])
    hintedCellsRef.current = []
    currentHintWordIndexRef.current = -1
    isSelectingRef.current = false
    selectedCellsRef.current = []
    startCellRef.current = null

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    const gameWords = currentMode === 'random' ? generateRandomWords() : [...customWords]
    
    if (gameWords.length === 0) {
      alert('Please add some words in custom mode or switch to random mode!')
      return
    }

    setWords(gameWords)
    
    const emptyGrid = createGrid()
    const { grid: gridWithWords, placedWords } = placeWords(emptyGrid, gameWords, gridSize, currentMode, difficulty)
    placedWordsRef.current = placedWords
    const finalGrid = fillEmptySpaces(gridWithWords, gridSize)
    setGrid(finalGrid)

    // In multiplayer, sync game state with opponent
    if (isMultiplayerRef.current && socket && socket.connected && roomCode) {
      socket.emit('gameStateSync', {
        roomCode,
        grid: finalGrid,
        words: gameWords,
        foundWords: [],
        opponentFoundWords: []
      })
    }
  }, [currentMode, customWords, gridSize, difficulty, generateRandomWords, createGrid, placeWords, fillEmptySpaces, socket, roomCode])

  // Socket event listeners for multiplayer
  useEffect(() => {
    if (!socket || gameMode !== 'multiplayer') return

    isMultiplayerRef.current = true

    const handleOpponentJoined = (data) => {
      console.log('Opponent joined:', data)
    }

    const handleGameStart = (data) => {
      console.log('Game starting with shared state:', data)
      if (data.grid && data.words) {
        setGrid(data.grid)
        setWords(data.words)
        setFoundWords(new Set())
        setOpponentFoundWords(new Set())
        setGameStarted(true)
        // Start timer
        gameStartTimeRef.current = Date.now()
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - gameStartTimeRef.current
          const minutes = Math.floor(elapsed / 60000)
          const seconds = Math.floor((elapsed % 60000) / 1000)
          const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          setTimer(timeString)
        }, 1000)
      }
    }

    const handleSyncMove = (data) => {
      if (data.foundWordIndex !== undefined) {
        const newOpponentFoundWords = new Set(opponentFoundWords)
        newOpponentFoundWords.add(data.foundWordIndex)
        setOpponentFoundWords(newOpponentFoundWords)
      }
    }

    const handleGameStateSync = (data) => {
      if (data.grid) setGrid(data.grid)
      if (data.words) setWords(data.words)
      if (data.foundWords) setFoundWords(new Set(data.foundWords))
      if (data.opponentFoundWords) setOpponentFoundWords(new Set(data.opponentFoundWords))
      // If game state is synced and we have both grid and words, start the game
      if (data.grid && data.words && !gameStarted) {
        setGameStarted(true)
        gameStartTimeRef.current = Date.now()
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - gameStartTimeRef.current
          const minutes = Math.floor(elapsed / 60000)
          const seconds = Math.floor((elapsed % 60000) / 1000)
          const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          setTimer(timeString)
        }, 1000)
      }
    }

    socket.on('opponentJoined', handleOpponentJoined)
    socket.on('gameStart', handleGameStart)
    socket.on('syncMove', handleSyncMove)
    socket.on('gameStateSync', handleGameStateSync)

    return () => {
      socket.off('opponentJoined', handleOpponentJoined)
      socket.off('gameStart', handleGameStart)
      socket.off('syncMove', handleSyncMove)
      socket.off('gameStateSync', handleGameStateSync)
    }
  }, [socket, gameMode, opponentFoundWords, gameStarted])

  useEffect(() => {
    if (gameMode === 'singleplayer') {
      newGame()
    }
  }, [currentMode, gridSize])

  useEffect(() => {
    if (currentMode === 'random' && gameMode === 'singleplayer') {
      newGame()
    }
  }, [difficulty])

  const startGame = useCallback(() => {
    setGameStarted(true)
    gameStartTimeRef.current = Date.now()
    
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - gameStartTimeRef.current
      const minutes = Math.floor(elapsed / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      setTimer(timeString)
    }, 1000)
  }, [])

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
    
    const selectedWord = grid[row][col].letter
    setCurrentSelection(selectedWord || '-')
  }, [gameStarted, grid])

  const handleCellMouseOver = useCallback((row, col) => {
    if (!isSelectingRef.current || !startCellRef.current) return
    
    const newSelection = getSelectionPath(startCellRef.current, { row, col }, gridSize)
    selectedCellsRef.current = newSelection
    setSelectedCells(newSelection)
    
    const selectedWord = newSelection.map(({ row, col }) => grid[row][col].letter).join('')
    setCurrentSelection(selectedWord || '-')
  }, [grid, gridSize, getSelectionPath])

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
      
      // Sync move in multiplayer mode
      if (isMultiplayerRef.current && socket && socket.connected && roomCode) {
        socket.emit('syncMove', {
          roomCode,
          foundWordIndex,
          grid: newGrid,
          foundWords: Array.from(newFoundWords)
        })
      }
      
      if (currentHintWordIndexRef.current === foundWordIndex) {
        currentHintWordIndexRef.current = -1
        hintedCellsRef.current = []
        setHintedCells([])
      }
      
      if (newFoundWords.size === words.length) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
        setFinalTime(timer)
        setTimeout(() => setShowWinModal(true), 500)
      }
    }
    
    selectedCellsRef.current = []
    startCellRef.current = null
    setSelectedCells([])
    setCurrentSelection('-')
  }, [grid, words, foundWords, timer, socket, roomCode])

  useEffect(() => {
    const handleMouseUp = () => {
      if (isSelectingRef.current) {
        handleCellMouseUp()
      }
    }
    
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleCellMouseUp])

  const showHint = useCallback(() => {
    if (!gameStarted || hintCooldown) return
    
    const unfoundWordIndices = []
    for (let i = 0; i < words.length; i++) {
      if (!foundWords.has(i)) {
        unfoundWordIndices.push(i)
      }
    }
    
    if (unfoundWordIndices.length === 0) return
    
    let wordIndexToHint
    if (currentHintWordIndexRef.current === -1 || foundWords.has(currentHintWordIndexRef.current)) {
      wordIndexToHint = unfoundWordIndices[Math.floor(Math.random() * unfoundWordIndices.length)]
      currentHintWordIndexRef.current = wordIndexToHint
    } else {
      wordIndexToHint = currentHintWordIndexRef.current
    }
    
    const wordData = placedWordsRef.current[wordIndexToHint]
    if (wordData) {
      hintedCellsRef.current = [...wordData.cells]
      setHintedCells([...wordData.cells])
      
      setHintCooldown(true)
      
      setTimeout(() => {
        hintedCellsRef.current = []
        setHintedCells([])
        setHintCooldown(false)
      }, 5000)
    }
  }, [gameStarted, hintCooldown, words, foundWords])

  const addCustomWord = useCallback((word) => {
    const upperWord = word.trim().toUpperCase()
    if (upperWord && upperWord.length >= 3 && upperWord.length <= 15 && /^[A-Z]+$/.test(upperWord)) {
      if (!customWords.includes(upperWord)) {
        const newCustomWords = [...customWords, upperWord]
        setCustomWords(newCustomWords)
        saveCustomWords(newCustomWords)
        if (currentMode === 'custom') {
          setTimeout(() => newGame(), 0)
        }
      } else {
        alert('Word already exists!')
      }
    } else {
      alert('Please enter a valid word (3-15 letters, A-Z only)')
    }
  }, [customWords, currentMode, newGame])

  const removeCustomWord = useCallback((index) => {
    const newCustomWords = customWords.filter((_, i) => i !== index)
    setCustomWords(newCustomWords)
    saveCustomWords(newCustomWords)
    if (currentMode === 'custom') {
      setTimeout(() => newGame(), 0)
    }
  }, [customWords, currentMode, newGame])

  const clearCustomWords = useCallback(() => {
    if (confirm('Are you sure you want to clear all custom words?')) {
      setCustomWords([])
      saveCustomWords([])
      if (currentMode === 'custom') {
        setTimeout(() => newGame(), 0)
      }
    }
  }, [currentMode, newGame])

  return {
    grid,
    words,
    foundWords,
    opponentFoundWords,
    gridSize,
    currentMode,
    difficulty,
    customWords,
    gameStarted,
    currentSelection,
    selectedCells,
    hintedCells,
    timer,
    showWinModal,
    finalTime,
    hintCooldown,
    setMode: setCurrentMode,
    setGridSize,
    setDifficulty,
    addCustomWord,
    removeCustomWord,
    clearCustomWords,
    startGame,
    newGame,
    handleCellMouseDown,
    handleCellMouseOver,
    handleCellMouseUp,
    showHint,
    syncGameState,
    setMultiplayerMode
  }
}

