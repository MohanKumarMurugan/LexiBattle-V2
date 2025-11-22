function WinModal({ visible, finalTime, onPlayAgain }) {
  if (!visible) return null

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Congratulations!</h2>
        <p>You found all the words!</p>
        <p>Time: <span>{finalTime}</span></p>
        <button className="play-again-btn" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  )
}

export default WinModal

