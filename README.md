# Find the Words Game 🎮

A comprehensive word search puzzle game built with **React** and **Socket.IO**. Features both single-player and multiplayer modes with an intuitive drag-and-select interface.

## 🌟 Features

### Game Modes
- **Single Player**: Play solo with random or custom word lists
- **Multiplayer (Online)**: Play with friends in real-time using WebSockets
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
- **Hints system**: Get help finding words with cooldown timer

### Multiplayer Features
- Real-time synchronization of found words
- Both players see each other's progress
- Shared game board and word list
- Room-based matchmaking with 6-character room codes
- Connection status indicator

### Data Persistence
- Custom words are saved to localStorage
- Your custom word lists persist between browser sessions

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download** the project
2. **Install dependencies**:
   ```bash
   npm install
   ```

### Running the Application

#### Step 1: Install Dependencies (One-time setup)
```bash
npm install
```

#### Step 2: Start the Application

**For Single Player Mode:**
```bash
npm run dev
```
Then open `http://localhost:5173` in your browser.

**For Multiplayer Mode (REQUIRED):**

You need **TWO terminal windows**:

**Terminal 1 - Start WebSocket Server:**
```bash
npm run server
```
You should see:
```
Server running on port 4000
WebSocket server ready at ws://localhost:4000
```
⚠️ **Keep this terminal open** - the server must stay running!

**Terminal 2 - Start React App:**
```bash
npm run dev
```
You should see:
```
VITE v5.x.x  ready in XXXX ms
➜  Local:   http://localhost:5173/
```
Then open `http://localhost:5173` in your browser.

**Important:** Both servers must be running simultaneously for multiplayer to work!

## 🎯 How to Play

### Single Player Mode

1. Click **"Single Player"** from the main menu
2. Select **"Random Mode"** or **"Custom Mode"**
3. Choose your preferred grid size and difficulty (if random mode)
4. Click **"New Game"** to generate a puzzle
5. Click **"Start Game"** to begin
6. Find all the words by clicking and dragging across the letters
7. Words can be found in any direction (horizontal, vertical, diagonal)
8. Use the **Hint** button if you need help (5-second cooldown)

### Multiplayer Mode

**Prerequisites:**
- Make sure the WebSocket server is running (`npm run server` in Terminal 1)
- Make sure the React app is running (`npm run dev` in Terminal 2)
- Check that the connection status shows **"Connected"** (green dot) in the multiplayer menu

**Step-by-Step Guide:**

1. **Start both servers** (see "Running the Application" above)
2. **Open the game** in your browser: `http://localhost:5173`
3. Click **"Multiplayer (Online)"** from the main menu
4. **Wait for connection** - You should see a green dot with "Connected" status
5. **Host (Player 1)**:
   - Click **"Create Room"** button
   - Wait a moment - you'll see a room code appear (e.g., "ABC123")
   - **Copy or share this code** with Player 2
   - The game will automatically start after room creation
6. **Player 2**:
   - Enter the room code in the input field (6 characters, uppercase)
   - Click **"Join Room"** button
   - Once joined, the game will start automatically
7. **Play!** Both players compete to find words first!
8. See your opponent's progress in real-time in the sidebar

**Troubleshooting Create Room:**
- If "Create Room" button is disabled, check connection status
- If you see "Not connected to server", make sure the server is running on port 4000
- Check browser console (F12) for any error messages
- Make sure both servers are running before clicking "Create Room"

### Custom Mode

1. Select **"Custom Mode"**
2. Add your own words using the input field
3. Words must be 3-15 letters long and contain only A-Z
4. Click on words in the list to remove them
5. Choose your grid size
6. Click **"New Game"** to generate a puzzle with your words

## 🛠️ Project Structure

```
Find-Words-Game/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/         # React components
│   │   ├── MainMenu.jsx    # Main menu (Single/Multiplayer)
│   │   ├── MultiplayerMenu.jsx  # Room creation/joining
│   │   ├── Header.jsx      # Game header with controls
│   │   ├── GameBoard.jsx   # Game board container
│   │   ├── Grid.jsx        # Grid component
│   │   ├── Cell.jsx        # Individual cell component
│   │   ├── Sidebar.jsx     # Words list and stats
│   │   └── WinModal.jsx   # Win celebration modal
│   ├── hooks/
│   │   ├── useGameLogic.js # Game logic hook
│   │   └── useSocket.js    # WebSocket connection hook
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── styles.css          # All styles
├── server.js               # WebSocket server (Socket.IO)
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── README.md              # This file
```

## 🏗️ Technical Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Socket.IO Client** - WebSocket communication

### Backend
- **Node.js** - Runtime
- **Express** - HTTP server
- **Socket.IO** - WebSocket server
- **CORS** - Cross-origin resource sharing

## 📡 WebSocket Events

### Client → Server
- `createRoom` - Create a new game room
- `joinRoom` - Join an existing room
- `syncMove` - Send a found word to opponent
- `gameStateSync` - Sync full game state
- `startGame` - Start the multiplayer game
- `leaveRoom` - Leave current room

### Server → Client
- `roomCreated` - Room code generated
- `roomJoined` - Successfully joined room
- `opponentJoined` - Another player joined
- `gameStart` - Game started with shared state
- `syncMove` - Opponent found a word
- `gameStateSync` - Full game state update
- `joinError` - Error joining room
- `opponentLeft` - Opponent disconnected

## 🎨 Design Features

- **Modern UI** with gradient backgrounds
- **Glassmorphism effects** for panels and cards
- **Smooth animations** for user interactions
- **Responsive design** for all screen sizes
- **Accessible** with proper contrast ratios

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start WebSocket server

## 🌐 Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 🔍 Troubleshooting

### Multiplayer Issues

1. **"Create Room" Button Not Working**:
   - ✅ Check that WebSocket server is running (`npm run server`)
   - ✅ Verify connection status shows "Connected" (green dot)
   - ✅ Open browser console (F12) and check for errors
   - ✅ Make sure you're on `http://localhost:5173` (not cached page)
   - ✅ Try refreshing the page (Ctrl+Shift+R)

2. **Connection Issues**: 
   - Make sure the server is running on port 4000
   - Check browser console for WebSocket errors
   - Verify firewall isn't blocking port 4000
   - Try restarting both servers

3. **Room Not Found**: 
   - Verify the room code is correct (6 characters, uppercase)
   - Room codes expire when host disconnects
   - Make sure you're entering the exact code (case-sensitive)

4. **Can't Join**: 
   - Room might be full (max 2 players)
   - Room might have already started
   - Host might have disconnected

5. **State Not Syncing**: 
   - Check browser console for errors
   - Verify both players are connected
   - Try refreshing both browsers
   - Make sure both players are in the same room

6. **Server Won't Start**:
   - Check if port 4000 is already in use: `netstat -ano | findstr :4000`
   - Kill the process if needed or use a different port
   - Make sure Node.js is installed: `node --version`

### General Issues

1. **Grid not displaying**: Check browser JavaScript is enabled
2. **Words not found**: Ensure you're selecting in a straight line
3. **Mobile selection issues**: Try shorter, more precise gestures

## 🚀 Production Deployment

For production deployment:

1. **Update Socket URL**:
   - Edit `src/hooks/useSocket.js`
   - Change `SOCKET_URL` to your production server URL

2. **Update CORS Settings**:
   - Edit `server.js`
   - Update CORS origin to your frontend domain

3. **Environment Variables**:
   - Use environment variables for ports and URLs
   - Consider using Redis for room storage in production

4. **Build**:
   ```bash
   npm run build
   ```
   Deploy the `dist` folder to your hosting service

## 📄 License

This project is open source. Feel free to use, modify, and distribute as needed.

---

**Enjoy playing Find the Words!** 🎉
