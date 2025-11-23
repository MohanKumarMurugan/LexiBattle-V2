import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'

const HINT_COST = ethers.parseEther('0.0001') // 0.0001 ETH

// Testnet configuration
const TESTNET_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex (Sepolia)
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
}

const TESTNET_CHAIN_ID = 11155111 // Sepolia testnet

export function useWallet() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isTestnet, setIsTestnet] = useState(false)

  // Check if MetaMask is installed
  const checkMetaMask = useCallback(() => {
    if (typeof window.ethereum !== 'undefined') {
      return true
    }
    return false
  }, [])

  // Switch to testnet
  const switchToTestnet = useCallback(async () => {
    if (!checkMetaMask()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return false
    }

    try {
      const ethereum = window.ethereum
      
      // Try to switch to testnet
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TESTNET_CONFIG.chainId }]
      })
      
      return true
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add the testnet to MetaMask
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [TESTNET_CONFIG]
          })
          return true
        } catch (addError) {
          console.error('Error adding testnet:', addError)
          setError('Failed to add testnet. Please add Sepolia testnet manually in MetaMask.')
          return false
        }
      } else {
        console.error('Error switching to testnet:', switchError)
        setError('Failed to switch to testnet. Please switch manually in MetaMask.')
        return false
      }
    }
  }, [checkMetaMask])

  // Check if connected to testnet
  const checkTestnet = useCallback((currentChainId) => {
    return currentChainId === TESTNET_CHAIN_ID
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
      const currentChainId = Number(network.chainId)
      
      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(accounts[0])
      setChainId(currentChainId)
      setIsTestnet(checkTestnet(currentChainId))
      
      // Note: Auto-switching to testnet is disabled by default
      // Users can manually switch using the button in the UI
      // Uncomment below to enable auto-switch:
      // if (!checkTestnet(currentChainId)) {
      //   const switched = await switchToTestnet()
      //   if (switched) {
      //     // Reload to get updated chainId
      //     window.location.reload()
      //   }
      // }

      // Listen for account changes
      ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          setAccount(null)
          setProvider(null)
          setSigner(null)
          setChainId(null)
          setIsTestnet(false)
          setError(null)
        } else {
          setAccount(newAccounts[0])
          web3Provider.getSigner().then(setSigner)
        }
      })

      // Listen for chain changes
      ethereum.on('chainChanged', (newChainId) => {
        const newChainIdNum = parseInt(newChainId, 16)
        setIsTestnet(checkTestnet(newChainIdNum))
        setChainId(newChainIdNum)
        // Optionally reload on chain change
        // window.location.reload()
      })

      setIsConnecting(false)
      return true
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet')
      setIsConnecting(false)
      return false
    }
  }, [checkMetaMask, checkTestnet, switchToTestnet])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setChainId(null)
    setIsTestnet(false)
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
    isTestnet,
    isConnected: !!account,
    connectWallet,
    disconnectWallet,
    switchToTestnet,
    getBalance,
    payForHint,
    placeBet,
    HINT_COST: ethers.formatEther(HINT_COST)
  }
}

