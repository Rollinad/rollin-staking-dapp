import { useCallback } from 'react'
import { useAccount, useConnect as useWagmiConnect } from 'wagmi'

export function useConnect() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, status, error } = useWagmiConnect()

  const handleConnect = useCallback(async () => {
    if (window.ethereum) {
      const connector = connectors[0] // MetaMask connector
      connect({ connector })
    } else {
      console.error('MetaMask not found')
    }
  }, [connect, connectors])

  return {
    connect: handleConnect,
    isConnected,
    address,
    status,
    error
  }
}