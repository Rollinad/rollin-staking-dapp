import { useAccount, useReadContract } from "wagmi";
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from "../constants";
import { StakingOption } from "../types/staking";

export function useStakingToken(tokenAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();

  // Get pool available balance
  const { data: availableBalance } = useReadContract({
    abi: STAKING_CONTRACT_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getAvailablePoolBalance",
    args: [tokenAddress],
  });

  // Get total staked amount through staking options
  const { data: stakingOptions } = useReadContract({
    abi: STAKING_CONTRACT_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getStakingOptions",
    args: [tokenAddress],
  }) as { data: StakingOption[] | undefined; refetch: () => void };

  // Calculate total TVL (available balance + staked amount)
  const tvl = availableBalance || 0n;

  const { data: freezingBalance } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getFreezingBalance",
    args: [tokenAddress],
    account: userAddress,
  });

  const { data: availableFrozen } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getAvailableFrozen",
    args: [tokenAddress],
    account: userAddress,
  });

  return {
    tvl: tvl.toString(),
    stakingOptions,
    freezingBalance,
    availableFrozen,
  };
}
