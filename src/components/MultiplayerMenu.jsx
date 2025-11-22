import { useState, useEffect } from 'react'
import './MultiplayerMenu.css'

function MultiplayerMenu({ 
  onSinglePlayer, 
  onRoomCreated, 
  onRoomJoined,
  socket,
  connectionStatus 
}) {
  const [roomCode, setRoomCode] = useState('')
  const [createdRoomCode, setCreatedRoomCode] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!socket) return

    const handleHostCreatedRoom = (data) => {
      setIsCreatingRoom(false)
      if (data.roomCode) {
        setCreatedRoomCode(data.roomCode)
        setSuccess(`Room created! Code: ${data.roomCode}`)
        setError('')
        console.log('Room created with code:', data.roomCode, 'Role:', data.role)
        // Pass role to parent
        setTimeout(() => {
          onRoomCreated(data.roomCode, data.role)
        }, 1500)
      } else {
        setError('Failed to create room. Please try again.')
        setIsCreatingRoom(false)
      }
    }

    const handleCreateError = (data) => {
      setIsCreatingRoom(false)
      setError(data.error || 'Failed to create room')
    }

    const handleGuestJoinedRoom = (data) => {
      setIsJoiningRoom(false)
      if (data.roomCode) {
        setSuccess(`Joined room ${data.roomCode}!`)
        setError('')
        console.log('Joined room:', data.roomCode, 'Role:', data.role)
        // Pass role to parent
        setTimeout(() => {
          onRoomJoined(data.roomCode, data.hostId, data.role)
        }, 500)
      } else {
        setError('Failed to join room')
      }
    }

    const handleJoinError = (data) => {
      setIsJoiningRoom(false)
      setError(data.error || 'Failed to join room')
    }

    const handleOpponentJoined = (data) => {
      setSuccess('Opponent joined! Ready to start.')
    }

    socket.on('hostCreatedRoom', handleHostCreatedRoom)
    socket.on('guestJoinedRoom', handleGuestJoinedRoom)
    socket.on('opponentJoined', handleOpponentJoined)
    socket.on('joinError', handleJoinError)
    socket.on('createError', handleCreateError)

    return () => {
      socket.off('hostCreatedRoom', handleHostCreatedRoom)
      socket.off('guestJoinedRoom', handleGuestJoinedRoom)
      socket.off('opponentJoined', handleOpponentJoined)
      socket.off('joinError', handleJoinError)
      socket.off('createError', handleCreateError)
    }
  }, [socket, onRoomCreated, onRoomJoined])

  const handleCreateRoom = () => {
    if (!socket) {
      setError('Socket not initialized. Please refresh the page.')
      return
    }
    if (!socket.connected) {
      setError('Not connected to server. Make sure the server is running on port 4000.')
      return
    }
    setError('')
    setSuccess('')
    setIsCreatingRoom(true)
    console.log('Creating room...')
    socket.emit('createRoom')
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (isCreatingRoom) {
        setIsCreatingRoom(false)
        setError('Room creation timed out. Please try again.')
      }
    }, 10000)
  }

  const handleJoinRoom = () => {
    if (!socket || !socket.connected) {
      setError('Not connected to server')
      return
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }
    setError('')
    setIsJoiningRoom(true)
    socket.emit('joinRoom', { roomCode: roomCode.trim().toUpperCase() })
  }

  const handleRoomCodeChange = (e) => {
    setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    setError('')
  }

  return (
    <div className="multiplayer-menu">
      <div className="menu-header">
        <h1 className="game-title">LexiBattle</h1>
      </div>

      <div className="menu-buttons">
        <button 
          className="menu-btn single-player-btn"
          onClick={onSinglePlayer}
        >
          Single Player
        </button>
        
        <button 
          className="menu-btn multiplayer-btn"
          disabled
        >
          Multiplayer (Online)
        </button>
      </div>

      <div className="room-panel">
        <div className="connection-status">
          <div className={`status-indicator ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}></div>
          <span className="status-text">
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <button 
          className="create-room-btn"
          onClick={handleCreateRoom}
          disabled={isCreatingRoom || connectionStatus !== 'connected'}
        >
          {isCreatingRoom ? 'Creating...' : 'Create Room'}
        </button>

        <div className="join-room-section">
          <input
            type="text"
            className="room-code-input"
            placeholder="ENTER ROOM CODE"
            value={roomCode}
            onChange={handleRoomCodeChange}
            maxLength={6}
            disabled={isJoiningRoom || connectionStatus !== 'connected'}
          />
          <button
            className="join-room-btn"
            onClick={handleJoinRoom}
            disabled={isJoiningRoom || !roomCode.trim() || connectionStatus !== 'connected'}
          >
            {isJoiningRoom ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {success && (
          <div className="success-message">{success}</div>
        )}
        {error && (
          <div className="error-message">{error}</div>
        )}
        {createdRoomCode && (
          <div className="room-code-display">
            <h4>Your Room Code:</h4>
            <div className="room-code-box">{createdRoomCode}</div>
            <p className="room-code-hint">Share this code with your friend to join!</p>
          </div>
        )}
      </div>

      <button 
        className="menu-btn new-game-btn"
        onClick={onSinglePlayer}
      >
        New Game
      </button>
    </div>
  )
}

export default MultiplayerMenu

