import { useReadContract, useWriteContract } from 'wagmi'
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from '../constants'
import { StakeData } from '../types/staking'

export function useStakingContract() {
  const { data: registeredContracts } = useReadContract({
    abi: STAKING_CONTRACT_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: 'getRegisteredContracts',
  })

  const { data: stakingData } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'getStakingData',
  }) as { data: StakeData[] | undefined }

  const { writeContract, isPending, error } = useWriteContract()

  const createPool = async (tokenAddress: string) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: 'addStakingPool',
      args: [tokenAddress],
    })
  }

  const createStakingOption = async (
    tokenAddress: string,
    duration: bigint,
    apy: bigint
  ) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: 'addStakingOption',
      args: [tokenAddress, duration, apy],
    })
  }

  const stake = async (
    tokenAddress: string,
    stakingOptionId: string,
    amount: bigint
  ) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: 'stake',
      args: [tokenAddress, stakingOptionId, amount],
    })
  }

  const unstake = async (
    tokenAddress: string,
    stakingOptionId: string,
    amount: bigint
  ) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: 'unstake',
      args: [tokenAddress, stakingOptionId, amount],
    })
  }

  const unstakeFreeze = async (
    tokenAddress: string,
    stakingOptionId: string,
    amount: bigint
  ) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: 'unstakeFreeze',
      args: [tokenAddress, stakingOptionId, amount],
    })
  }

  const withdrawFrozen = async (tokenAddress: string) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: 'withdrawFrozen',
      args: [tokenAddress],
    })
  }

  return {
    registeredContracts,
    stakingData,
    createPool,
    createStakingOption,
    stake,
    unstake,
    unstakeFreeze,
    withdrawFrozen,
    isPending,
    error,
  }
}