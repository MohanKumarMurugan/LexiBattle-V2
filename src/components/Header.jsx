function Header({
  currentMode,
  difficulty,
  gridSize,
  onModeChange,
  onDifficultyChange,
  onGridSizeChange,
  onNewGame,
  onHint,
  hintCooldown
}) {
  return (
    <header>
      <h1>Find the Words</h1>
      <div className="game-controls">
        <div className="mode-selector">
          <button
            className={`mode-btn ${currentMode === 'random' ? 'active' : ''}`}
            onClick={() => onModeChange('random')}
          >
            Random Mode
          </button>
          <button
            className={`mode-btn ${currentMode === 'custom' ? 'active' : ''}`}
            onClick={() => onModeChange('custom')}
          >
            Custom Mode
          </button>
        </div>
        
        {currentMode === 'random' && (
          <div className="difficulty-selector">
            <label htmlFor="difficulty">Difficulty:</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        )}
        
        <div className="grid-size-selector">
          <label htmlFor="gridSize">Grid Size:</label>
          <select
            id="gridSize"
            value={gridSize}
            onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
          >
            <option value="10">10x10</option>
            <option value="12">12x12</option>
            <option value="15">15x15</option>
            <option value="18">18x18</option>
            <option value="20">20x20</option>
          </select>
        </div>
        
        <button className="new-game-btn" onClick={onNewGame}>
          New Game
        </button>
        
        <button
          className="hint-btn"
          onClick={onHint}
          disabled={hintCooldown}
        >
          {hintCooldown ? '⏰ Wait...' : '💡 Hint'}
        </button>
      </div>
    </header>
  )
}

export default Header

