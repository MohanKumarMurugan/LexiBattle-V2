import { useState, useEffect, useRef, useCallback } from 'react'
import Header from './components/Header'
import CustomPanel from './components/CustomPanel'
import GameBoard from './components/GameBoard'
import Sidebar from './components/Sidebar'
import WinModal from './components/WinModal'
import { useGameLogic } from './hooks/useGameLogic'

function App() {
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
    hintedCells
  } = useGameLogic()

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
        onHint={showHint}
        hintCooldown={hintCooldown}
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

