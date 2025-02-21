// hooks/useStakingPoolTVL.ts
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from '@/constants'
import { useReadContract } from 'wagmi'

export function useStakingPoolTVL(tokenAddress: `0x${string}`) {
  // Get pool available balance
  const { data: availableBalance } = useReadContract({
    abi: STAKING_CONTRACT_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: 'getAvailablePoolBalance',
    args: [tokenAddress],
  })

  // Get total staked amount through staking options
  const { data: stakingOptions } = useReadContract({
    abi: STAKING_CONTRACT_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: 'getStakingOptions',
    args: [tokenAddress],
  })

  // Calculate total TVL (available balance + staked amount)
  const tvl = availableBalance || 0n

  return {
    tvl: tvl.toString(),
    stakingOptions,
  }
}