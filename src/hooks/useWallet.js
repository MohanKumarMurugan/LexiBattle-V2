import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const HINT_COST = ethers.parseEther('0.0001') // 0.0001 ETH

export function useWallet() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [chainId, setChainId] = useState(null)

  // Check if MetaMask is installed
  const checkMetaMask = useCallback(() => {
    if (typeof window.ethereum !== 'undefined') {
      return true
    }
    return false
  }, [])

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    if (!checkMetaMask()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      const ethereum = window.ethereum
      
      // Request account access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      
      if (accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask.')
        setIsConnecting(false)
        return false
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(ethereum)
      const web3Signer = await web3Provider.getSigner()
      const network = await web3Provider.getNetwork()
      
      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))

      // Listen for account changes
      ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(newAccounts[0])
          web3Provider.getSigner().then(setSigner)
        }
      })

      // Listen for chain changes
      ethereum.on('chainChanged', () => {
        window.location.reload()
      })

      setIsConnecting(false)
      return true
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet')
      setIsConnecting(false)
      return false
    }
  }, [checkMetaMask])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setChainId(null)
    setError(null)
  }, [])

  // Get account balance
  const getBalance = useCallback(async () => {
    if (!provider || !account) return null
    try {
      const balance = await provider.getBalance(account)
      return ethers.formatEther(balance)
    } catch (err) {
      console.error('Error getting balance:', err)
      return null
    }
  }, [provider, account])

  // Send payment for hint
  const payForHint = useCallback(async (recipientAddress) => {
    if (!signer || !account) {
      throw new Error('Wallet not connected')
    }

    try {
      // Check balance
      const balance = await provider.getBalance(account)
      if (balance < HINT_COST) {
        throw new Error('Insufficient balance. You need at least 0.0001 ETH.')
      }

      // Send transaction
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: HINT_COST
      })

      // Wait for confirmation
      await tx.wait()
      return tx.hash
    } catch (err) {
      console.error('Error paying for hint:', err)
      throw err
    }
  }, [signer, account, provider])

  // Send bet payment
  const placeBet = useCallback(async (recipientAddress, betAmount) => {
    if (!signer || !account) {
      throw new Error('Wallet not connected')
    }

    // If bet amount is 0, skip transaction
    if (betAmount === 0 || betAmount === '0' || betAmount === '0.000') {
      return null // Return null for free bets
    }

    try {
      const betAmountWei = ethers.parseEther(betAmount.toString())
      
      // Check balance
      const balance = await provider.getBalance(account)
      if (balance < betAmountWei) {
        throw new Error(`Insufficient balance. You need at least ${betAmount} ETH.`)
      }

      // Send transaction
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: betAmountWei
      })

      // Wait for confirmation
      await tx.wait()
      return tx.hash
    } catch (err) {
      console.error('Error placing bet:', err)
      throw err
    }
  }, [signer, account, provider])

  // Check if already connected
  useEffect(() => {
    if (checkMetaMask() && window.ethereum.selectedAddress) {
      connectWallet()
    }
  }, [checkMetaMask, connectWallet])

  return {
    account,
    provider,
    signer,
    isConnecting,
    error,
    chainId,
    isConnected: !!account,
    connectWallet,
    disconnectWallet,
    getBalance,
    payForHint,
    placeBet,
    HINT_COST: ethers.formatEther(HINT_COST)
  }
}

