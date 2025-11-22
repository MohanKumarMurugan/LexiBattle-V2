/**
 * Find the Words Game
 * A word search puzzle game with random and custom modes
 */

class FindWordsGame {
    constructor() {
        this.grid = [];
        this.words = [];
        this.foundWords = new Set();
        this.gridSize = 15;
        this.isSelecting = false;
        this.selectedCells = [];
        this.startCell = null;
        this.currentMode = 'random';
        this.difficulty = 'medium';
        this.customWords = this.loadCustomWords();
        this.gameStartTime = null;
        this.timerInterval = null;
        this.hintedCells = [];
        this.hintCooldown = false;
        this.placedWords = []; // Store word positions for hints
        this.currentHintWordIndex = -1; // Track the current word being hinted
        this.gameStarted = false; // Track if game has started
        
        // Predefined word lists for random mode
        this.wordLists = {
            easy: ['CAT', 'DOG', 'SUN', 'MOON', 'TREE', 'BOOK', 'FISH', 'BIRD'],
            medium: ['COMPUTER', 'RAINBOW', 'OCEAN', 'MOUNTAIN', 'GARDEN', 'PLANET', 'CRYSTAL', 'THUNDER'],
            hard: ['JAVASCRIPT', 'ALGORITHM', 'ADVENTURE', 'BUTTERFLY', 'KNOWLEDGE', 'TELESCOPE', 'SYMPHONY', 'MYSTERY']
        };
        
        this.init();
    }

    /**
     * Initialize the game
     */
    init() {
        this.bindEvents();
        this.newGame();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Mode selection
        document.getElementById('randomMode').addEventListener('click', () => this.setMode('random'));
        document.getElementById('customMode').addEventListener('click', () => this.setMode('custom'));
        
        // Grid size selection
        document.getElementById('gridSize').addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            this.newGame();
        });
        
        // Difficulty selection
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            if (this.currentMode === 'random') {
                this.newGame();
            }
        });
        
        // New game button
        document.getElementById('newGame').addEventListener('click', () => this.newGame());
        
        // Hint button
        document.getElementById('hintBtn').addEventListener('click', () => this.showHint());
        
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        
        // Custom words functionality
        document.getElementById('addWord').addEventListener('click', () => this.addCustomWord());
        document.getElementById('wordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCustomWord();
        });
        document.getElementById('clearWords').addEventListener('click', () => this.clearCustomWords());
        
        // Modal
        document.getElementById('playAgain').addEventListener('click', () => {
            document.getElementById('winModal').classList.add('hidden');
            this.newGame();
        });

        // Grid interaction will be bound dynamically when grid is created
    }

    /**
     * Set game mode (random or custom)
     */
    setMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'Mode').classList.add('active');
        
        // Show/hide custom panel and difficulty selector
        const customPanel = document.getElementById('customPanel');
        const difficultySelector = document.getElementById('difficultySelector');
        
        if (mode === 'custom') {
            customPanel.classList.remove('hidden');
            difficultySelector.classList.add('hidden');
        } else {
            customPanel.classList.add('hidden');
            difficultySelector.classList.remove('hidden');
        }
        
        this.newGame();
    }

    /**
     * Start a new game
     */
    newGame() {
        this.foundWords.clear();
        this.selectedCells = [];
        this.startCell = null;
        this.isSelecting = false;
        this.hintedCells = [];
        this.hintCooldown = false;
        this.placedWords = [];
        this.currentHintWordIndex = -1;
        this.gameStarted = false;
        
        // Stop existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Generate words based on mode
        if (this.currentMode === 'random') {
            this.generateRandomWords();
        } else {
            this.words = [...this.customWords];
        }
        
        if (this.words.length === 0) {
            alert('Please add some words in custom mode or switch to random mode!');
            return;
        }
        
        // Create and populate grid
        this.createGrid();
        this.placeWords();
        this.fillEmptySpaces();
        this.renderGrid();
        this.renderWordsList();
        this.updateStats();
        this.showStartOverlay();
        
        // Clear current selection display
        document.getElementById('currentSelection').textContent = '-';
    }

    /**
     * Generate random words for random mode
     */
    generateRandomWords() {
        const allWords = [
            ...this.wordLists.easy,
            ...this.wordLists.medium,
            ...this.wordLists.hard
        ];
        
        // Select 8-12 random words
        const numWords = Math.floor(Math.random() * 5) + 8;
        this.words = [];
        
        const shuffled = [...allWords].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(numWords, shuffled.length); i++) {
            this.words.push(shuffled[i]);
        }
    }

    /**
     * Create empty grid
     */
    createGrid() {
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = {
                    letter: '',
                    isWordLetter: false,
                    wordIndex: -1,
                    found: false
                };
            }
        }
    }

    /**
     * Get directions based on difficulty level
     */
    getDirectionsForDifficulty() {
        const easyDirections = [
            { dx: 0, dy: 1 },   // horizontal
            { dx: 1, dy: 0 },   // vertical
            { dx: 1, dy: 1 },   // diagonal down-right
            { dx: 1, dy: -1 }   // diagonal down-left
        ];
        
        const mediumDirections = [
            { dx: 0, dy: 1 },   // horizontal
            { dx: 1, dy: 0 },   // vertical
            { dx: 1, dy: 1 },   // diagonal down-right
            { dx: 1, dy: -1 },  // diagonal down-left
            { dx: 0, dy: -1 },  // horizontal backwards
            { dx: -1, dy: 0 }   // vertical backwards
        ];
        
        const hardDirections = [
            { dx: 0, dy: 1 },   // horizontal
            { dx: 1, dy: 0 },   // vertical
            { dx: 1, dy: 1 },   // diagonal down-right
            { dx: 1, dy: -1 },  // diagonal down-left
            { dx: 0, dy: -1 },  // horizontal backwards
            { dx: -1, dy: 0 },  // vertical backwards
            { dx: -1, dy: -1 }, // diagonal up-left
            { dx: -1, dy: 1 }   // diagonal up-right
        ];
        
        switch (this.difficulty) {
            case 'easy':
                return easyDirections;
            case 'medium':
                return mediumDirections;
            case 'hard':
                return hardDirections;
            default:
                return mediumDirections;
        }
    }

    /**
     * Place words in the grid
     */
    placeWords() {
        const allDirections = [
            { dx: 0, dy: 1 },   // horizontal
            { dx: 1, dy: 0 },   // vertical
            { dx: 1, dy: 1 },   // diagonal down-right
            { dx: 1, dy: -1 },  // diagonal down-left
            { dx: 0, dy: -1 },  // horizontal backwards
            { dx: -1, dy: 0 },  // vertical backwards
            { dx: -1, dy: -1 }, // diagonal up-left
            { dx: -1, dy: 1 }   // diagonal up-right
        ];
        
        // Filter directions based on difficulty (only for random mode)
        let directions = allDirections;
        if (this.currentMode === 'random') {
            directions = this.getDirectionsForDifficulty();
        }

        for (let wordIndex = 0; wordIndex < this.words.length; wordIndex++) {
            const word = this.words[wordIndex];
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;

            while (!placed && attempts < maxAttempts) {
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const startRow = Math.floor(Math.random() * this.gridSize);
                const startCol = Math.floor(Math.random() * this.gridSize);

                if (this.canPlaceWord(word, startRow, startCol, direction)) {
                    this.placeWord(word, startRow, startCol, direction, wordIndex);
                    placed = true;
                }
                attempts++;
            }

            if (!placed) {
                console.warn(`Could not place word: ${word}`);
            }
        }
    }

    /**
     * Check if word can be placed at given position and direction
     */
    canPlaceWord(word, startRow, startCol, direction) {
        for (let i = 0; i < word.length; i++) {
            const row = startRow + i * direction.dx;
            const col = startCol + i * direction.dy;

            // Check bounds
            if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
                return false;
            }

            // Check if cell is empty or contains the same letter
            const cell = this.grid[row][col];
            if (cell.letter !== '' && cell.letter !== word[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Place word in the grid
     */
    placeWord(word, startRow, startCol, direction, wordIndex) {
        const wordCells = [];
        
        for (let i = 0; i < word.length; i++) {
            const row = startRow + i * direction.dx;
            const col = startCol + i * direction.dy;
            
            this.grid[row][col] = {
                letter: word[i],
                isWordLetter: true,
                wordIndex: wordIndex,
                found: false
            };
            
            wordCells.push({ row, col });
        }
        
        // Store word position for hints
        this.placedWords[wordIndex] = {
            word: word,
            cells: wordCells,
            startRow,
            startCol,
            direction
        };
    }

    /**
     * Fill empty spaces with random letters
     */
    fillEmptySpaces() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j].letter === '') {
                    // this.grid[i][j].letter = "-";
                    this.grid[i][j].letter = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    /**
     * Render the grid in HTML
     */
    renderGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        gridElement.dataset.size = this.gridSize;
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = this.grid[i][j].letter;
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Add hint styling if cell is hinted
                if (this.hintedCells.some(hinted => hinted.row === i && hinted.col === j)) {
                    if (!this.grid[i][j].found) {
                        cell.classList.add('hinted');
                    }
                }
                
                // Add found styling if cell is found
                if (this.grid[i][j].found) {
                    cell.classList.add('found');
                }
                
                // Bind mouse events for selection
                cell.addEventListener('mousedown', (e) => this.startSelection(e, i, j));
                cell.addEventListener('mouseover', (e) => this.continueSelection(e, i, j));
                cell.addEventListener('mouseup', (e) => this.endSelection(e));
                
                gridElement.appendChild(cell);
            }
        }
        
        // Prevent text selection
        gridElement.addEventListener('selectstart', (e) => e.preventDefault());
        document.addEventListener('mouseup', () => this.endSelection());
    }

    /**
     * Start cell selection
     */
    startSelection(event, row, col) {
        event.preventDefault();
        
        // Don't allow selection if game hasn't started
        if (!this.gameStarted) return;
        
        this.isSelecting = true;
        this.startCell = { row, col };
        this.selectedCells = [{ row, col }];
        this.updateSelection();
    }

    /**
     * Continue cell selection (drag)
     */
    continueSelection(event, row, col) {
        if (!this.isSelecting || !this.startCell) return;
        
        const newSelection = this.getSelectionPath(this.startCell, { row, col });
        this.selectedCells = newSelection;
        this.updateSelection();
    }

    /**
     * End cell selection
     */
    endSelection(event) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.checkSelectedWord();
        this.clearSelection();
    }

    /**
     * Get path between two cells (straight line only)
     */
    getSelectionPath(start, end) {
        const path = [];
        const dx = end.row - start.row;
        const dy = end.col - start.col;
        
        // Only allow straight lines (horizontal, vertical, diagonal)
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        if (steps === 0) return [start];
        
        const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
        const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
        
        // Check if it's a valid straight line
        if (Math.abs(dx) !== 0 && Math.abs(dy) !== 0 && Math.abs(dx) !== Math.abs(dy)) {
            return [start]; // Not a valid diagonal
        }
        
        for (let i = 0; i <= steps; i++) {
            const row = start.row + i * stepX;
            const col = start.col + i * stepY;
            
            if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
                path.push({ row, col });
            }
        }
        
        return path;
    }

    /**
     * Update visual selection
     */
    updateSelection() {
        // Clear previous selection styling
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selecting');
        });
        
        // Apply selection styling
        this.selectedCells.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('selecting');
            }
        });
        
        // Update current selection display
        const selectedWord = this.selectedCells.map(({ row, col }) => 
            this.grid[row][col].letter
        ).join('');
        document.getElementById('currentSelection').textContent = selectedWord || '-';
    }

    /**
     * Clear selection styling
     */
    clearSelection() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selecting');
        });
        this.selectedCells = [];
        document.getElementById('currentSelection').textContent = '-';
    }

    /**
     * Check if selected word is valid
     */
    checkSelectedWord() {
        const selectedWord = this.selectedCells.map(({ row, col }) => 
            this.grid[row][col].letter
        ).join('');
        
        // Check forward and backward
        const reversedWord = selectedWord.split('').reverse().join('');
        
        let foundWordIndex = -1;
        let isReversed = false;
        
        for (let i = 0; i < this.words.length; i++) {
            if (this.words[i] === selectedWord) {
                foundWordIndex = i;
                break;
            } else if (this.words[i] === reversedWord) {
                foundWordIndex = i;
                isReversed = true;
                break;
            }
        }
        
        if (foundWordIndex !== -1 && !this.foundWords.has(foundWordIndex)) {
            this.markWordAsFound(foundWordIndex);
            this.foundWords.add(foundWordIndex);
            
            // If the found word was the current hint word, reset hint tracking
            if (this.currentHintWordIndex === foundWordIndex) {
                this.currentHintWordIndex = -1;
                this.clearHints();
            }
            
            this.updateStats();
            this.checkWinCondition();
            
            // Animate found cells
            this.selectedCells.forEach(({ row, col }) => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    setTimeout(() => cell.classList.add('found'), 100);
                }
                this.grid[row][col].found = true;
            });
        }
    }

    /**
     * Mark word as found in the words list
     */
    markWordAsFound(wordIndex) {
        const wordElements = document.querySelectorAll('.words-list li');
        if (wordElements[wordIndex]) {
            wordElements[wordIndex].classList.add('found');
        }
    }

    /**
     * Render words list
     */
    renderWordsList() {
        const wordsList = document.getElementById('wordsList');
        wordsList.innerHTML = '';
        
        this.words.forEach((word, index) => {
            const li = document.createElement('li');
            li.textContent = word;
            if (this.foundWords.has(index)) {
                li.classList.add('found');
            }
            wordsList.appendChild(li);
        });
    }

    /**
     * Update game statistics
     */
    updateStats() {
        document.getElementById('foundCount').textContent = this.foundWords.size;
        document.getElementById('totalCount').textContent = this.words.length;
    }

    /**
     * Start game timer
     */
    startTimer() {
        this.gameStartTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.gameStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update both timer displays
            document.getElementById('timer').textContent = timeString;
            document.getElementById('gameTimer').textContent = timeString;
        }, 1000);
    }

    /**
     * Show start overlay and blur grid
     */
    showStartOverlay() {
        const startOverlay = document.getElementById('startOverlay');
        const grid = document.getElementById('grid');
        
        startOverlay.classList.remove('hidden');
        grid.classList.add('blurred');
        
        // Reset timer displays
        document.getElementById('timer').textContent = '00:00';
        document.getElementById('gameTimer').textContent = '00:00';
    }

    /**
     * Start the game
     */
    startGame() {
        this.gameStarted = true;
        const startOverlay = document.getElementById('startOverlay');
        const grid = document.getElementById('grid');
        
        // Hide start overlay and remove blur
        startOverlay.classList.add('hidden');
        grid.classList.remove('blurred');
        
        // Start the timer
        this.startTimer();
    }

    /**
     * Check if player has won
     */
    checkWinCondition() {
        if (this.foundWords.size === this.words.length) {
            clearInterval(this.timerInterval);
            const finalTime = document.getElementById('timer').textContent;
            document.getElementById('finalTime').textContent = finalTime;
            
            setTimeout(() => {
                document.getElementById('winModal').classList.remove('hidden');
            }, 500);
        }
    }

    /**
     * Show hint for a random unfound word
     */
    showHint() {
        // Don't allow hints if game hasn't started
        if (!this.gameStarted) return;
        
        // Check if hint is on cooldown
        if (this.hintCooldown) {
            return;
        }
        
        // Find unfound words
        const unfoundWordIndices = [];
        for (let i = 0; i < this.words.length; i++) {
            if (!this.foundWords.has(i)) {
                unfoundWordIndices.push(i);
            }
        }
        
        // If no unfound words, do nothing
        if (unfoundWordIndices.length === 0) {
            return;
        }
        
        // Clear previous hints
        this.clearHints();
        
        // Select word to hint
        let wordIndexToHint;
        
        // If no current hint word is set or the current hint word is found, select a new one
        if (this.currentHintWordIndex === -1 || this.foundWords.has(this.currentHintWordIndex)) {
            // Select a random unfound word
            wordIndexToHint = unfoundWordIndices[Math.floor(Math.random() * unfoundWordIndices.length)];
            this.currentHintWordIndex = wordIndexToHint;
        } else {
            // Use the current hint word if it's still unfound
            wordIndexToHint = this.currentHintWordIndex;
        }
        const wordData = this.placedWords[wordIndexToHint];
        
        if (wordData) {
            // Highlight the word cells
            this.hintedCells = [...wordData.cells];
            
            // Re-render grid to show hints
            this.renderGrid();
            
            // Set cooldown
            this.hintCooldown = true;
            const hintBtn = document.getElementById('hintBtn');
            hintBtn.disabled = true;
            hintBtn.textContent = '⏰ Wait...';
            
            // Remove hint after 3 seconds and enable button after 5 seconds
            setTimeout(() => {
                this.clearHints();
                this.renderGrid();
            }, 3000);
            
            setTimeout(() => {
                this.hintCooldown = false;
                hintBtn.disabled = false;
                hintBtn.textContent = '💡 Hint';
            }, 5000);
        }
    }

    /**
     * Clear all hints
     */
    clearHints() {
        this.hintedCells = [];
    }

    /**
     * Add custom word
     */
    addCustomWord() {
        const input = document.getElementById('wordInput');
        const word = input.value.trim().toUpperCase();
        
        if (word && word.length >= 3 && word.length <= 15 && /^[A-Z]+$/.test(word)) {
            if (!this.customWords.includes(word)) {
                this.customWords.push(word);
                this.saveCustomWords();
                this.renderCustomWords();
                input.value = '';
                
                // If we're in custom mode, restart the game
                if (this.currentMode === 'custom') {
                    this.newGame();
                }
            } else {
                alert('Word already exists!');
            }
        } else {
            alert('Please enter a valid word (3-15 letters, A-Z only)');
        }
    }

    /**
     * Clear all custom words
     */
    clearCustomWords() {
        if (confirm('Are you sure you want to clear all custom words?')) {
            this.customWords = [];
            this.saveCustomWords();
            this.renderCustomWords();
            
            if (this.currentMode === 'custom') {
                this.newGame();
            }
        }
    }

    /**
     * Render custom words list
     */
    renderCustomWords() {
        const list = document.getElementById('customWordsList');
        list.innerHTML = '';
        
        this.customWords.forEach((word, index) => {
            const li = document.createElement('li');
            li.textContent = word;
            li.addEventListener('click', () => {
                this.customWords.splice(index, 1);
                this.saveCustomWords();
                this.renderCustomWords();
                
                if (this.currentMode === 'custom') {
                    this.newGame();
                }
            });
            list.appendChild(li);
        });
    }

    /**
     * Save custom words to localStorage
     */
    saveCustomWords() {
        localStorage.setItem('findWordsCustomWords', JSON.stringify(this.customWords));
    }

    /**
     * Load custom words from localStorage
     */
    loadCustomWords() {
        const saved = localStorage.getItem('findWordsCustomWords');
        return saved ? JSON.parse(saved) : ['JAVASCRIPT', 'CODING', 'PUZZLE', 'GAME'];
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FindWordsGame();
});
