function Sidebar({ words, foundWords, totalWords, timer, currentSelection }) {
  return (
    <div className="game-sidebar">
      <div className="words-to-find">
        <h3>Words to Find</h3>
        <ul className="words-list">
          {words.map((word, index) => (
            <li
              key={index}
              className={foundWords.has(index) ? 'found' : ''}
            >
              {word}
            </li>
          ))}
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

