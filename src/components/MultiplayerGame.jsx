import { useState, useEffect, useRef } from 'react'
import { useMultiplayerGame } from '../hooks/useMultiplayerGame'
import Header from './Header'
import GameBoard from './GameBoard'
import Sidebar from './Sidebar'
import WinnerScreen from './WinnerScreen'
import './MultiplayerGame.css'

function MultiplayerGame({ 
  socket, 
  roomCode, 
  role, 
  onBackToMenu,
  connectionStatus 
}) {
  const {
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
  } = useMultiplayerGame(socket, roomCode, role)

  return (
    <div className="multiplayer-game-container">
      {showWinnerScreen ? (
        <WinnerScreen
          winnerData={winnerData}
          hostScore={hostScore}
          guestScore={guestScore}
          hostWordsFound={hostWordsFound}
          guestWordsFound={guestWordsFound}
          role={role}
          onBackToMenu={onBackToMenu}
          onPlayAgain={() => {
            // Reset game state and go back to multiplayer menu
            window.location.reload()
          }}
        />
      ) : (
        <>
          <div className="multiplayer-header">
            <div className="header-left">
              <div className="room-code-display">
                <span className="room-code-label">Room Code:</span>
                <span className="room-code-value">{roomCode || 'N/A'}</span>
              </div>
              <div className={`connection-status ${connectionStatus === 'connected' ? 'connected' : connectionStatus === 'error' ? 'error' : 'disconnected'}`}>
                <span className="status-dot"></span>
                <span className="status-text">
                  {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="header-center">
              <div className="role-badge">
                {role === 'host' ? '👑 Host' : '👤 Guest'}
              </div>
              <div className={`shared-timer ${timer <= 10 && timer > 0 ? 'timer-warning' : timer === 0 ? 'timer-ended' : ''}`}>
                ⏱️ {typeof timer === 'number' ? (timer > 0 ? `${timer}s` : 'TIME UP!') : '60s'}
              </div>
            </div>
            <div className="header-right">
              <div className="scoreboard-header">
                <div className="score-item">
                  <span className="score-label">Host:</span>
                  <span className="score-value">{hostScore}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Guest:</span>
                  <span className="score-value">{guestScore}</span>
                </div>
              </div>
              <button 
                className="back-to-menu-btn"
                onClick={onBackToMenu}
              >
                Back to Menu
              </button>
            </div>
          </div>

          {!gameStarted && (
            <div className="waiting-screen">
              {role === 'host' ? (
                <div className="waiting-content">
                  <h2>Ready to Start?</h2>
                  <p>Both players are in the room</p>
                  {connectionStatus !== 'connected' && (
                    <div className="connection-warning">
                      ⚠️ WebSocket not connected. Please check your connection.
                    </div>
                  )}
                  <button 
                    className="start-game-btn"
                    onClick={handleStartGame}
                    disabled={connectionStatus !== 'connected' || !socket}
                  >
                    🚀 Start Game
                  </button>
                </div>
              ) : (
                <div className="waiting-content">
                  <h2>Waiting for Host...</h2>
                  <p>The host will start the game soon</p>
                  {connectionStatus !== 'connected' && (
                    <div className="connection-warning">
                      ⚠️ WebSocket not connected. Please check your connection.
                    </div>
                  )}
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
          )}

          {gameStarted && (
            <div className="container">
              <main className="game-area">
                {grid.length > 0 ? (
                  <div className="game-board">
                    <GameBoard
                      grid={grid}
                      gridSize={10}
                      gameStarted={gameStarted}
                    selectedCells={selectedCells}
                    hintedCells={hintedCells}
                    wordColors={wordColors}
                    onCellMouseDown={handleCellMouseDown}
                      onCellMouseOver={handleCellMouseOver}
                      onCellMouseUp={handleCellMouseUp}
                      onStartGame={() => {}}
                    />

                    <Sidebar
                      words={words}
                      foundWords={foundWords}
                      totalWords={words.length}
                      timer={`${timer}s`}
                      currentSelection={currentSelection}
                      gameMode="multiplayer"
                      roomCode={roomCode}
                      opponentFoundWords={opponentFoundWords}
                    />
                  </div>
                ) : (
                  <div className="loading-screen">
                    <div className="loading-spinner"></div>
                    <p>Loading game board...</p>
                  </div>
                )}
              </main>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MultiplayerGame

