function Cell({ row, col, letter, found, foundColor, isSelected, isHinted, onMouseDown, onMouseOver, onMouseUp }) {
  const handleMouseDown = (e) => {
    e.preventDefault()
    onMouseDown()
  }

  const cellStyle = found && foundColor ? {
    background: foundColor,
    borderColor: foundColor,
    color: 'white',
    fontWeight: '700',
    boxShadow: `0 0 10px ${foundColor}40`
  } : {}

  return (
    <div
      className={`cell ${found ? 'found' : ''} ${isSelected ? 'selecting' : ''} ${isHinted && !found ? 'hinted' : ''}`}
      data-row={row}
      data-col={col}
      style={cellStyle}
      onMouseDown={handleMouseDown}
      onMouseOver={onMouseOver}
      onMouseUp={onMouseUp}
    >
      {letter}
    </div>
  )
}

export default Cell

