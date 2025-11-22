function Cell({ row, col, letter, found, isSelected, isHinted, onMouseDown, onMouseOver, onMouseUp }) {
  const handleMouseDown = (e) => {
    e.preventDefault()
    onMouseDown()
  }

  return (
    <div
      className={`cell ${found ? 'found' : ''} ${isSelected ? 'selecting' : ''} ${isHinted && !found ? 'hinted' : ''}`}
      data-row={row}
      data-col={col}
      onMouseDown={handleMouseDown}
      onMouseOver={onMouseOver}
      onMouseUp={onMouseUp}
    >
      {letter}
    </div>
  )
}

export default Cell

