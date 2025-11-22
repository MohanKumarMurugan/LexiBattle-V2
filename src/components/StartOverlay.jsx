function StartOverlay({ onStartGame }) {
  return (
    <div className="start-overlay">
      <button className="start-btn" onClick={onStartGame}>
        🚀 Start Game
      </button>
    </div>
  )
}

export default StartOverlay

