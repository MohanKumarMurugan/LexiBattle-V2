import { useState } from 'react'

function CustomPanel({ visible, customWords, onAddWord, onRemoveWord, onClearWords }) {
  const [wordInput, setWordInput] = useState('')

  const handleAddWord = () => {
    if (wordInput.trim()) {
      onAddWord(wordInput)
      setWordInput('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddWord()
    }
  }

  if (!visible) return null

  return (
    <div className="custom-panel">
      <h3>Custom Words</h3>
      <div className="custom-input">
        <input
          type="text"
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a word and press Enter"
        />
        <button onClick={handleAddWord}>Add Word</button>
      </div>
      <div className="custom-words-list">
        <h4>Your Words:</h4>
        <ul>
          {customWords.map((word, index) => (
            <li key={index} onClick={() => onRemoveWord(index)}>
              {word}
            </li>
          ))}
        </ul>
        <button className="clear-btn" onClick={onClearWords}>
          Clear All
        </button>
      </div>
    </div>
  )
}

export default CustomPanel

