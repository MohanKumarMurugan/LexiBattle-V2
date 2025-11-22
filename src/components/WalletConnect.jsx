import { useState, useEffect } from 'react'
import { useWallet } from '../hooks/useWallet'
import './WalletConnect.css'

function WalletConnect({ onConnect, onDisconnect, required = false, betAmount = null }) {
  const { account, isConnecting, error, connectWallet, disconnectWallet, getBalance, isConnected } = useWallet()
  const [balance, setBalance] = useState(null)
  const [shortAddress, setShortAddress] = useState('')

  useEffect(() => {
    if (account) {
      // Format address: 0x1234...5678
      setShortAddress(`${account.slice(0, 6)}...${account.slice(-4)}`)
      getBalance().then(setBalance)
      if (onConnect) onConnect(account)
    } else {
      setShortAddress('')
      setBalance(null)
      if (onDisconnect) onDisconnect()
    }
  }, [account, getBalance, onConnect, onDisconnect])

  const handleConnect = async () => {
    const success = await connectWallet()
    if (success && onConnect) {
      onConnect(account)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    if (onDisconnect) {
      onDisconnect()
    }
  }

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <div className="wallet-icon">🦊</div>
          <div className="wallet-details">
            <div className="wallet-address">{shortAddress}</div>
            {balance !== null && (
              <div className="wallet-balance">{parseFloat(balance).toFixed(4)} ETH</div>
            )}
          </div>
        </div>
        <button className="wallet-disconnect-btn" onClick={handleDisconnect}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-connect-container">
      {required && (
        <div className="wallet-required-notice">
          {betAmount ? `💰 Bet Required: ${betAmount} ETH` : '🔗 Wallet connection required'}
        </div>
      )}
      <button 
        className="wallet-connect-btn" 
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : '🦊 Connect MetaMask'}
      </button>
      {error && <div className="wallet-error">{error}</div>}
      {!window.ethereum && (
        <div className="wallet-install-notice">
          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
            Install MetaMask
          </a>
        </div>
      )}
    </div>
  )
}

export default WalletConnect

