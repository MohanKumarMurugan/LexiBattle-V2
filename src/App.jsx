import { useState } from 'react'
import MainMenu from './components/MainMenu'
import MultiplayerMenu from './components/MultiplayerMenu'
import MultiplayerGame from './components/MultiplayerGame'
import Header from './components/Header'
import CustomPanel from './components/CustomPanel'
import GameBoard from './components/GameBoard'
import Sidebar from './components/Sidebar'
import WinModal from './components/WinModal'
import { useGameLogic } from './hooks/useGameLogic'
import { useSocket } from './hooks/useSocket'
import { useWallet } from './hooks/useWallet'

function App() {
  const [view, setView] = useState('menu') // 'menu', 'singleplayer', 'multiplayer', 'multiplayer-game'
  const [gameMode, setGameMode] = useState('singleplayer') // 'singleplayer' or 'multiplayer'
  const [roomCode, setRoomCode] = useState(null)
  const [opponentId, setOpponentId] = useState(null)
  const [multiplayerRole, setMultiplayerRole] = useState(null) // 'host' or 'guest'

  const { socket, connectionStatus } = useSocket()
  const walletHook = useWallet()

  // Debug log
  console.log('App rendered - Current view:', view, 'Game mode:', gameMode)

  const {
    grid,
    words,
    foundWords,
    gridSize,
    currentMode,
    difficulty,
    customWords,
    gameStarted,
    currentSelection,
    timer,
    showWinModal,
    finalTime,
    setMode,
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
    hintCooldown,
    selectedCells,
    hintedCells,
    opponentFoundWords,
    syncGameState,
    setMultiplayerMode
  } = useGameLogic(gameMode, socket, roomCode)

  const handleSinglePlayer = () => {
    setGameMode('singleplayer')
    setView('singleplayer')
  }

  const handleMultiplayer = () => {
    setGameMode('multiplayer')
    setView('multiplayer')
  }

  const handleRoomCreated = (code, role) => {
    setRoomCode(code)
    setMultiplayerRole(role)
    setView('multiplayer-game') // Show multiplayer game
  }

  const handleRoomJoined = (code, opponentId, role) => {
    setRoomCode(code)
    setOpponentId(opponentId)
    setMultiplayerRole(role)
    setView('multiplayer-game') // Show multiplayer game
  }

  const handleBackToMenu = () => {
    setView('menu')
    setRoomCode(null)
    setOpponentId(null)
    setMultiplayerRole(null)
    if (socket && roomCode) {
      socket.emit('leaveRoom', { roomCode })
    }
  }

  // Show main menu
  if (view === 'menu') {
    return <MainMenu onSinglePlayer={handleSinglePlayer} onMultiplayer={handleMultiplayer} />
  }

  // Show multiplayer menu
  if (view === 'multiplayer') {
    return (
      <MultiplayerMenu
        onSinglePlayer={handleBackToMenu}
        onRoomCreated={handleRoomCreated}
        onRoomJoined={handleRoomJoined}
        socket={socket}
        connectionStatus={connectionStatus}
      />
    )
  }

  // Show multiplayer game
  if (view === 'multiplayer-game' && multiplayerRole) {
    return (
      <MultiplayerGame
        socket={socket}
        roomCode={roomCode}
        role={multiplayerRole}
        onBackToMenu={handleBackToMenu}
        connectionStatus={connectionStatus}
      />
    )
  }

  // Show game (singleplayer or multiplayer)
  return (
    <div className="container">
      <Header
        currentMode={currentMode}
        difficulty={difficulty}
        gridSize={gridSize}
        onModeChange={setMode}
        onDifficultyChange={setDifficulty}
        onGridSizeChange={setGridSize}
        onNewGame={newGame}
        onHint={() => showHint(walletHook)}
        walletAddress={walletHook.account}
        onWalletConnect={walletHook.connectWallet}
        hintCooldown={hintCooldown}
        gameMode={gameMode}
        roomCode={roomCode}
        onBackToMenu={handleBackToMenu}
        onSwitchToMultiplayer={handleMultiplayer}
      />

      <main className="game-area">
        <CustomPanel
          visible={currentMode === 'custom'}
          customWords={customWords}
          onAddWord={addCustomWord}
          onRemoveWord={removeCustomWord}
          onClearWords={clearCustomWords}
        />

        <div className="game-board">
          <GameBoard
            grid={grid}
            gridSize={gridSize}
            gameStarted={gameStarted}
            selectedCells={selectedCells}
            hintedCells={hintedCells}
            onCellMouseDown={handleCellMouseDown}
            onCellMouseOver={handleCellMouseOver}
            onCellMouseUp={handleCellMouseUp}
            onStartGame={startGame}
          />

          <Sidebar
            words={words}
            foundWords={foundWords}
            totalWords={words.length}
            timer={timer}
            currentSelection={currentSelection}
            gameMode={gameMode}
            roomCode={roomCode}
            opponentFoundWords={opponentFoundWords}
          />
        </div>
      </main>

      <WinModal
        visible={showWinModal}
        finalTime={finalTime}
        onPlayAgain={newGame}
      />
    </div>
  )
}

export default App
