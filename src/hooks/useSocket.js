import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:4000'

export function useSocket() {
  const [socket, setSocket] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const socketRef = useRef(null)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketRef.current = newSocket

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id)
      setConnectionStatus('connected')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setConnectionStatus('disconnected')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setConnectionStatus('error')
    })

    setSocket(newSocket)

    return () => {
      if (newSocket) {
        newSocket.close()
      }
    }
  }, [])

  return { socket, connectionStatus }
}

