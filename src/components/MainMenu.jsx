import './MainMenu.css'

function MainMenu({ onSinglePlayer, onMultiplayer }) {
  console.log('MainMenu rendered - Multiplayer button available')
  
  return (
    <div className="main-menu">
      <div className="menu-header">
        <h1 className="game-title">LexiBattle</h1>
      </div>

      <div className="menu-options">
        <button 
          className="menu-option-btn single-player-option"
          onClick={onSinglePlayer}
        >
          <span className="btn-icon">🎮</span>
          <span className="btn-text">Single Player</span>
        </button>
        
        <button 
          className="menu-option-btn multiplayer-option"
          onClick={onMultiplayer}
        >
          <span className="btn-icon">🌐</span>
          <span className="btn-text">Multiplayer (Online)</span>
        </button>
      </div>
    </div>
  )
}

export default MainMenu

