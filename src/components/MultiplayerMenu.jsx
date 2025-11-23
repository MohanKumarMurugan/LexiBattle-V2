import { useState, useEffect } from 'react'
import './MultiplayerMenu.css'
import WalletConnect from './WalletConnect'
import { useWallet } from '../hooks/useWallet'

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
  const [betAmount, setBetAmount] = useState(0.001) // Default bet: 0.001 ETH
  const [hostBetPlaced, setHostBetPlaced] = useState(false)
  const [guestBetPlaced, setGuestBetPlaced] = useState(false)
  
  const walletHook = useWallet()

  // Clear error when wallet connects
  useEffect(() => {
    if (walletHook.account) {
      // Clear wallet-related errors when wallet connects
      if (error && (
        error.includes('connect your MetaMask') || 
        error.includes('MetaMask wallet') ||
        error.includes('wallet')
      )) {
        setError('')
      }
    }
  }, [walletHook.account, error])

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

    const handlePlayerBetPlaced = (data) => {
      if (data.role === 'host') {
        setHostBetPlaced(true)
        setSuccess('Host bet placed! Waiting for guest...')
      } else if (data.role === 'guest') {
        setGuestBetPlaced(true)
        setSuccess('Guest bet placed! Both players ready!')
      }
    }

    const handleBothPlayersReady = (data) => {
      setSuccess('Both players have placed bets! Game can start.')
    }

    socket.on('hostCreatedRoom', handleHostCreatedRoom)
    socket.on('guestJoinedRoom', handleGuestJoinedRoom)
    socket.on('opponentJoined', handleOpponentJoined)
    socket.on('joinError', handleJoinError)
    socket.on('createError', handleCreateError)
    socket.on('playerBetPlaced', handlePlayerBetPlaced)
    socket.on('bothPlayersReady', handleBothPlayersReady)

    return () => {
      socket.off('hostCreatedRoom', handleHostCreatedRoom)
      socket.off('guestJoinedRoom', handleGuestJoinedRoom)
      socket.off('opponentJoined', handleOpponentJoined)
      socket.off('joinError', handleJoinError)
      socket.off('createError', handleCreateError)
      socket.off('playerBetPlaced', handlePlayerBetPlaced)
      socket.off('bothPlayersReady', handleBothPlayersReady)
    }
  }, [socket, onRoomCreated, onRoomJoined])

  const handleCreateRoom = async () => {
    if (!socket) {
      setError('Socket not initialized. Please refresh the page.')
      return
    }
    if (!socket.connected) {
      setError('Not connected to server. Make sure the server is running on port 4000.')
      return
    }
    if (!walletHook.account) {
      setError('Please connect your MetaMask wallet first.')
      return
    }
    
    setError('')
    setSuccess('')
    
    try {
      setIsCreatingRoom(true)
      console.log('Creating room...')
      
      // Emit wallet connection
      socket.emit('playerWalletConnected', {
        walletAddress: walletHook.account,
        role: 'host'
      })
      
      // Place bet only if bet amount is greater than 0
      let txHash = null
      if (betAmount > 0) {
        const recipientAddress = '0x0000000000000000000000000000000000000000' // Replace with your game wallet
        setSuccess('Placing bet...')
        txHash = await walletHook.placeBet(recipientAddress, betAmount)
        console.log('Bet placed:', txHash)
      } else {
        setSuccess('Creating room with free bet...')
      }
      
      socket.emit('playerBetPlaced', {
        walletAddress: walletHook.account,
        betAmount: betAmount,
        txHash: txHash,
        role: 'host'
      })
      
      socket.emit('createRoom')
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (isCreatingRoom) {
          setIsCreatingRoom(false)
          setError('Room creation timed out. Please try again.')
        }
      }, 10000)
    } catch (err) {
      setError(`Bet failed: ${err.message}`)
      setIsCreatingRoom(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!socket || !socket.connected) {
      setError('Not connected to server')
      return
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }
    if (!walletHook.account) {
      setError('Please connect your MetaMask wallet first.')
      return
    }
    
    setError('')
    setIsJoiningRoom(true)
    
    try {
      // Place bet only if bet amount is greater than 0
      let txHash = null
      if (betAmount > 0) {
        const recipientAddress = '0x0000000000000000000000000000000000000000' // Replace with your game wallet
        setSuccess('Placing bet...')
        txHash = await walletHook.placeBet(recipientAddress, betAmount)
        console.log('Bet placed:', txHash)
      } else {
        setSuccess('Joining room with free bet...')
      }
      
      // Emit wallet connection and bet
      socket.emit('playerWalletConnected', {
        walletAddress: walletHook.account,
        role: 'guest'
      })
      
      socket.emit('playerBetPlaced', {
        walletAddress: walletHook.account,
        betAmount: betAmount,
        txHash: txHash,
        role: 'guest'
      })
      
      socket.emit('joinRoom', { roomCode: roomCode.trim().toUpperCase() })
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (isJoiningRoom) {
          setIsJoiningRoom(false)
          setError('Join request timed out. Please try again.')
        }
      }, 10000)
    } catch (err) {
      setError(`Failed to join: ${err.message}`)
      setIsJoiningRoom(false)
    }
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

        <div className="wallet-section">
          <WalletConnect 
            onConnect={(account) => {
              // Clear any wallet-related errors when wallet connects
              if (account && error && error.includes('wallet')) {
                setError('')
              }
            }}
            required={true}
            betAmount={betAmount}
          />
        </div>

        <div className="bet-section">
          <label htmlFor="betAmount" className="bet-label">Bet Amount (ETH):</label>
          <input
            type="number"
            id="betAmount"
            className="bet-input"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            min="0"
            step="0.001"
            disabled={isCreatingRoom || isJoiningRoom}
          />
          <div className="bet-info">
            {betAmount === 0 ? (
              <>🎮 <strong>Friendly Match:</strong> No bet required! Perfect for practice games.</>
            ) : (
              <>💰 Both players must place the same bet. Winner takes all!</>
            )}
          </div>
        </div>

        <button 
          className="create-room-btn"
          onClick={handleCreateRoom}
          disabled={isCreatingRoom || connectionStatus !== 'connected' || !walletHook.account}
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
            disabled={isJoiningRoom || !roomCode.trim() || connectionStatus !== 'connected' || !walletHook.account}
          >
            {isJoiningRoom ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {success && (
          <div className="success-message">{success}</div>
        )}
        {error && !(error.includes('wallet') && walletHook.account) && (
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

