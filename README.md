# Find the Words Game 🎮

A comprehensive word search puzzle game built with HTML, CSS, and JavaScript. Features both random and custom game modes with an intuitive drag-and-select interface.

## 🌟 Features

### Game Modes
- **Random Mode**: Play with predefined word lists of varying difficulty
- **Custom Mode**: Create your own word lists and save them for future sessions

### Grid Options
- Multiple grid sizes: 10x10, 12x12, 15x15, 18x18, 20x20
- Dynamic grid generation with random letter filling
- Responsive design that works on desktop and mobile

### Word Placement
- Advanced algorithm places words in 8 directions:
  - Horizontal (left-to-right and right-to-left)
  - Vertical (top-to-bottom and bottom-to-top)
  - Diagonal (all 4 diagonal directions)

### Interactive Features
- **Click-and-drag selection**: Select words by dragging across grid cells
- **Real-time feedback**: See your current selection highlighted
- **Word validation**: Automatic detection of found words (forward and backward)
- **Visual feedback**: Found words are highlighted and marked in the word list
- **Game timer**: Track your completion time
- **Win detection**: Celebrate when all words are found!

### Data Persistence
- Custom words are saved to localStorage
- Your custom word lists persist between browser sessions

## 🎯 How to Play

### Random Mode
1. Select "Random Mode" (default)
2. Choose your preferred grid size
3. Click "New Game" to generate a puzzle
4. Find all the words in the list by clicking and dragging across the letters
5. Words can be found in any direction (horizontal, vertical, diagonal)
6. Try to find all words as quickly as possible!

### Custom Mode
1. Select "Custom Mode"
2. Add your own words using the input field
3. Words must be 3-15 letters long and contain only A-Z
4. Choose your grid size
5. Click "New Game" to generate a puzzle with your words
6. Your custom words are automatically saved for future sessions

## 🛠️ Technical Implementation

### File Structure
```
Find_Words/
├── index.html      # Main HTML structure
├── styles.css      # Complete styling and animations
├── script.js       # Game logic and functionality
└── README.md       # This documentation
```

### Key Components

#### HTML Structure
- Semantic HTML5 with proper accessibility
- Modal dialogs for game completion
- Responsive layout with flexbox and grid

#### CSS Features
- Modern design with glassmorphism effects
- Smooth animations and transitions
- Responsive breakpoints for mobile devices
- CSS Grid for dynamic grid sizing

#### JavaScript Architecture
- Object-oriented design with a main `FindWordsGame` class
- Modular functions for different game aspects
- Event-driven user interactions
- LocalStorage integration for data persistence

### Core Algorithms

#### Word Placement Algorithm
```javascript
// Places words in 8 possible directions
const directions = [
    { dx: 0, dy: 1 },   // horizontal
    { dx: 1, dy: 0 },   // vertical
    { dx: 1, dy: 1 },   // diagonal down-right
    { dx: 1, dy: -1 },  // diagonal down-left
    // ... and 4 more directions
];
```

#### Selection Detection
- Calculates straight-line paths between start and end points
- Validates selections for horizontal, vertical, and diagonal lines
- Supports both forward and backward word detection

#### Grid Generation
1. Create empty grid matrix
2. Place words using collision detection
3. Fill remaining spaces with random letters
4. Render to DOM with event bindings

## 🎨 Design Features

### Visual Elements
- **Gradient backgrounds** with modern color schemes
- **Glassmorphism effects** for panels and cards
- **Smooth animations** for user interactions
- **Responsive typography** that scales with screen size

### User Experience
- **Intuitive controls** with clear visual feedback
- **Accessible design** with proper contrast ratios
- **Performance optimized** for smooth gameplay
- **Mobile-friendly** touch interactions

## 🚀 Getting Started

1. **Clone or download** the project files
2. **Open `index.html`** in any modern web browser
3. **Start playing** immediately - no installation required!

### Browser Compatibility
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 🔧 Customization

### Adding New Word Lists
Edit the `wordLists` object in `script.js`:
```javascript
this.wordLists = {
    easy: ['CAT', 'DOG', ...],
    medium: ['COMPUTER', 'RAINBOW', ...],
    hard: ['JAVASCRIPT', 'ALGORITHM', ...]
};
```

### Styling Modifications
- Modify `styles.css` for visual changes
- CSS custom properties make theming easy
- Grid sizing is controlled via CSS Grid

### Functionality Extensions
- Add new game modes by extending the class
- Implement hints system
- Add difficulty levels
- Create multiplayer functionality

## 📱 Responsive Design

The game automatically adapts to different screen sizes:
- **Desktop**: Full sidebar layout with large grid
- **Tablet**: Stacked layout with optimized spacing
- **Mobile**: Compact layout with touch-friendly controls

## 🎮 Game Statistics

Track your performance with built-in statistics:
- **Words found** vs total words
- **Completion time** with mm:ss format
- **Win celebration** with completion modal

## 💾 Data Management

### LocalStorage Usage
- Custom words are automatically saved
- Data persists across browser sessions
- Easy to clear via the "Clear All" button

### Privacy
- All data is stored locally in your browser
- No external servers or data collection
- Complete offline functionality

## 🔍 Troubleshooting

### Common Issues
1. **Grid not displaying**: Check browser JavaScript is enabled
2. **Words not found**: Ensure you're selecting in a straight line
3. **Mobile selection issues**: Try shorter, more precise gestures

### Performance Tips
- Use smaller grid sizes on older devices
- Clear browser cache if experiencing issues
- Ensure adequate screen resolution for larger grids

## 🤝 Contributing

Feel free to enhance this game! Some ideas:
- Add sound effects and music
- Implement different themes
- Create difficulty-based scoring
- Add word definitions or hints
- Implement save/load game states

## 📄 License

This project is open source. Feel free to use, modify, and distribute as needed.

---

**Enjoy playing Find the Words!** 🎉
