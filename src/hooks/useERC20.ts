import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { formatUnits, erc20Abi } from 'viem'
import { STAKING_CONTRACT_ADDRESS } from '@/constants'
import { useEffect } from 'react'

export function useERC20(address: `0x${string}`) {
  const { address: accountAddress } = useAccount()
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract()
  
  const { isLoading: isWaitingForTransaction, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const { data: name } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: 'name',
  })

  const { data: symbol } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: 'symbol',
  })

  const { data: decimals } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  const { data: balance } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: accountAddress ? [accountAddress] : undefined,
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: accountAddress ? [accountAddress, STAKING_CONTRACT_ADDRESS] : undefined,
    query: {
      // More aggressive refetching during approval
      refetchInterval: (isWritePending || isWaitingForTransaction) ? 1000 : false,
      // Refetch immediately when transaction succeeds
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  })

  // Watch for transaction success and refetch
  useEffect(() => {
    if (isTransactionSuccess) {
      refetchAllowance()
    }
  }, [isTransactionSuccess, refetchAllowance])

  const approve = async (spender: `0x${string}`, amount: bigint) => {
    if (!writeContract) return
    
    try {
      const hash = await writeContract({
        address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
      })
      
      // Immediate refetch after sending transaction
      await refetchAllowance()
      
      return hash
    } catch (error) {
      console.error('Approval error:', error)
      throw error
    }
  }

  return {
    name,
    symbol,
    decimals,
    balance: balance ? formatUnits(balance as bigint, Number(decimals) || 18) : '0',
    allowance: allowance ? formatUnits(allowance as bigint, Number(decimals) || 18) : '0',
    approve,
    refetchAllowance,
    isApproving: isWritePending || isWaitingForTransaction,
  }
}