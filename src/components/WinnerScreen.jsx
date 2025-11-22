import './WinnerScreen.css'

function WinnerScreen({ winnerData, hostScore, guestScore, role, onBackToMenu }) {
  const isWinner = winnerData && (
    (role === 'host' && winnerData.winner.role === 'host') ||
    (role === 'guest' && winnerData.winner.role === 'guest')
  )

  return (
    <div className="winner-screen">
      <div className="winner-content">
        <div className={`winner-badge ${isWinner ? 'winner' : 'loser'}`}>
          {isWinner ? '🏆 WINNER!' : '😔 LOSER'}
        </div>

        <h1 className="winner-title">
          {isWinner ? 'Congratulations!' : 'Better Luck Next Time!'}
        </h1>

        <div className="scores-container">
          <div className={`score-card ${winnerData?.winner.role === 'host' ? 'highlight' : ''}`}>
            <div className="score-card-header">
              <span className="role-icon">👑</span>
              <span className="role-name">Host</span>
            </div>
            <div className="score-value-large">{hostScore}</div>
            <div className="score-label">Points</div>
            {winnerData?.winner.role === 'host' && (
              <div className="winner-indicator">WINNER</div>
            )}
          </div>

          <div className="vs-divider">VS</div>

          <div className={`score-card ${winnerData?.winner.role === 'guest' ? 'highlight' : ''}`}>
            <div className="score-card-header">
              <span className="role-icon">👤</span>
              <span className="role-name">Guest</span>
            </div>
            <div className="score-value-large">{guestScore}</div>
            <div className="score-label">Points</div>
            {winnerData?.winner.role === 'guest' && (
              <div className="winner-indicator">WINNER</div>
            )}
          </div>
        </div>

        <div className="final-message">
          {isWinner ? (
            <p>You found more words! Great job! 🎉</p>
          ) : (
            <p>Your opponent found more words. Keep practicing! 💪</p>
          )}
        </div>

        <button 
          className="back-to-menu-btn-large"
          onClick={onBackToMenu}
        >
          Back to Main Menu
        </button>
      </div>
    </div>
  )
}

export default WinnerScreen

