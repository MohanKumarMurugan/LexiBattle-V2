import { useRef, useEffect } from 'react'
import Cell from './Cell'

function Grid({
  grid,
  gridSize,
  gameStarted,
  selectedCells,
  hintedCells,
  wordColors,
  onCellMouseDown,
  onCellMouseOver,
  onCellMouseUp
}) {
  const gridRef = useRef(null)

  useEffect(() => {
    const handleSelectStart = (e) => {
      e.preventDefault()
    }
    
    const gridElement = gridRef.current
    if (gridElement) {
      gridElement.addEventListener('selectstart', handleSelectStart)
      return () => {
        gridElement.removeEventListener('selectstart', handleSelectStart)
      }
    }
  }, [])

  const isCellSelected = (row, col) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col)
  }

  const isCellHinted = (row, col) => {
    return hintedCells.some(cell => cell.row === row && cell.col === col)
  }

  return (
    <div
      ref={gridRef}
      className={`grid ${!gameStarted ? 'blurred' : ''}`}
      data-size={gridSize}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            row={rowIndex}
            col={colIndex}
            letter={cell.letter}
            found={cell.found}
            foundColor={cell.foundColor}
            isSelected={isCellSelected(rowIndex, colIndex)}
            isHinted={isCellHinted(rowIndex, colIndex)}
            onMouseDown={() => onCellMouseDown(rowIndex, colIndex)}
            onMouseOver={() => onCellMouseOver(rowIndex, colIndex)}
            onMouseUp={() => onCellMouseUp()}
          />
        ))
      )}
    </div>
  )
}

export default Grid

