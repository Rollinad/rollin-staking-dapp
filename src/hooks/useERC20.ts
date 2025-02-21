import { useReadContract, useWriteContract } from 'wagmi'
import { formatUnits, erc20Abi } from 'viem'
import { useAccount } from 'wagmi'
import { STAKING_CONTRACT_ADDRESS } from '@/constants'

export function useERC20(address: `0x${string}`) {
  const { address: accountAddress } = useAccount()
  const { writeContract } = useWriteContract()

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
  })

  const approve = async (spender: `0x${string}`, amount: bigint) => {
    if (!writeContract) return
    return writeContract({
      address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return {
    name,
    symbol,
    decimals,
    balance: balance ? formatUnits(balance as bigint, Number(decimals) || 18) : '0',
    allowance: allowance ? formatUnits(allowance as bigint, Number(decimals) || 18) : '0',
    approve,
    refetchAllowance,
  }
}