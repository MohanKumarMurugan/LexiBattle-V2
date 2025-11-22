function Sidebar({ words, foundWords, totalWords, timer, currentSelection, gameMode, roomCode, opponentFoundWords }) {
  return (
    <div className="game-sidebar">
      {gameMode === 'multiplayer' && (
        <div className="multiplayer-stats" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '15px',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4a5568', textAlign: 'center' }}>Multiplayer</h4>
          <div className="stat">
            <span className="stat-label">You:</span>
            <span style={{ color: '#48bb78' }}>{foundWords.size}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Opponent:</span>
            <span style={{ color: '#667eea' }}>{(opponentFoundWords && opponentFoundWords.size) || 0}</span>
          </div>
        </div>
      )}

      <div className="words-to-find">
        <h3>Words to Find</h3>
        <ul className="words-list">
          {words.map((word, index) => {
            const isFound = foundWords.has(index)
            const isOpponentFound = opponentFoundWords && opponentFoundWords.has(index)
            let className = ''
            if (isFound && isOpponentFound) {
              className = 'found both-found'
            } else if (isFound) {
              className = 'found you-found'
            } else if (isOpponentFound) {
              className = 'found opponent-found'
            }
            return (
              <li key={index} className={className}>
                {word}
              </li>
            )
          })}
        </ul>
      </div>
      
      <div className="game-stats">
        <div className="stat">
          <span className="stat-label">Found:</span>
          <span>{foundWords.size}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total:</span>
          <span>{totalWords}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time:</span>
          <span>{timer}</span>
        </div>
      </div>

      <div className="selection-info">
        <h4>Current Selection:</h4>
        <span id="currentSelection">{currentSelection}</span>
      </div>
    </div>
  )
}

export default Sidebar

