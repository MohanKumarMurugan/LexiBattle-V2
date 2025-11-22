import './WinnerScreen.css'

function WinnerScreen({ winnerData, hostScore, guestScore, hostWordsFound, guestWordsFound, role, onBackToMenu, onPlayAgain }) {
  const isTie = winnerData?.isTie || false
  const isWinner = !isTie && winnerData && (
    (role === 'host' && winnerData.winner?.role === 'host') ||
    (role === 'guest' && winnerData.winner?.role === 'guest')
  )

  // Use winnerData scores if available, otherwise use props
  const finalHostScore = winnerData?.hostScore !== undefined ? winnerData.hostScore : (hostScore ?? 0)
  const finalGuestScore = winnerData?.guestScore !== undefined ? winnerData.guestScore : (guestScore ?? 0)
  const finalHostWordsFound = winnerData?.hostWordsFound !== undefined ? winnerData.hostWordsFound : (hostWordsFound ?? 0)
  const finalGuestWordsFound = winnerData?.guestWordsFound !== undefined ? winnerData.guestWordsFound : (guestWordsFound ?? 0)

  return (
    <div className="winner-screen">
      <div className="winner-content">
        <div className={`winner-badge ${isTie ? 'tie' : isWinner ? 'winner' : 'loser'}`}>
          {isTie ? '🤝 TIE!' : isWinner ? '🏆 WINNER!' : '😔 LOSER'}
        </div>

        <h1 className="winner-title">
          {isTie ? 'It\'s a Tie!' : isWinner ? 'Congratulations!' : 'Better Luck Next Time!'}
        </h1>

        <div className="scores-container">
          <div className={`score-card ${!isTie && winnerData?.winner?.role === 'host' ? 'highlight' : isTie ? 'tie-highlight' : ''}`}>
            <div className="score-card-header">
              <span className="role-icon">👑</span>
              <span className="role-name">Host</span>
            </div>
            <div className="score-value-large">{finalHostScore}</div>
            <div className="score-label">Points</div>
            <div className="words-found-count">
              {finalHostWordsFound} word{finalHostWordsFound !== 1 ? 's' : ''} found
            </div>
            {!isTie && winnerData?.winner?.role === 'host' && (
              <div className="winner-indicator">WINNER</div>
            )}
            {isTie && (
              <div className="winner-indicator tie-indicator">TIE</div>
            )}
          </div>

          <div className="vs-divider">VS</div>

          <div className={`score-card ${!isTie && winnerData?.winner?.role === 'guest' ? 'highlight' : isTie ? 'tie-highlight' : ''}`}>
            <div className="score-card-header">
              <span className="role-icon">👤</span>
              <span className="role-name">Guest</span>
            </div>
            <div className="score-value-large">{finalGuestScore}</div>
            <div className="score-label">Points</div>
            <div className="words-found-count">
              {finalGuestWordsFound} word{finalGuestWordsFound !== 1 ? 's' : ''} found
            </div>
            {!isTie && winnerData?.winner?.role === 'guest' && (
              <div className="winner-indicator">WINNER</div>
            )}
            {isTie && (
              <div className="winner-indicator tie-indicator">TIE</div>
            )}
          </div>
        </div>

        <div className="final-message">
          {isTie ? (
            <p>Both players scored equally! What a match! 🤝</p>
          ) : isWinner ? (
            <p>You found more words! Great job! 🎉</p>
          ) : (
            <p>Your opponent found more words. Keep practicing! 💪</p>
          )}
        </div>

        <div className="winner-actions">
          <button 
            className="play-again-btn"
            onClick={onPlayAgain || (() => window.location.reload())}
          >
            Play Again
          </button>
          <button 
            className="back-to-menu-btn-large"
            onClick={onBackToMenu}
          >
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default WinnerScreen

