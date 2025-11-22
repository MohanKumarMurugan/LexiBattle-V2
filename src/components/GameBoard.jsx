import Grid from './Grid'
import StartOverlay from './StartOverlay'

function GameBoard({
  grid,
  gridSize,
  gameStarted,
  selectedCells,
  hintedCells,
  onCellMouseDown,
  onCellMouseOver,
  onCellMouseUp,
  onStartGame
}) {
  return (
    <div className="grid-container">
      <Grid
        grid={grid}
        gridSize={gridSize}
        gameStarted={gameStarted}
        selectedCells={selectedCells}
        hintedCells={hintedCells}
        onCellMouseDown={onCellMouseDown}
        onCellMouseOver={onCellMouseOver}
        onCellMouseUp={onCellMouseUp}
      />
      {!gameStarted && (
        <StartOverlay onStartGame={onStartGame} />
      )}
    </div>
  )
}

export default GameBoard

