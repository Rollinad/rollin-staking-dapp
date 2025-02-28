import { useAccount, useReadContract } from "wagmi";
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from "../constants";
import { StakingOption } from "../types/staking";

export function useStakingToken(tokenAddress: `0x${string}`) {
  const { address: userAddress } = useAccount();

  const { data: availableBalance, refetch: refetchAvailableBalance } =
    useReadContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "getAvailablePoolBalance",
      args: [tokenAddress],
    });

  const { data: totalStakedAmount, refetch: refetchTotalStakedAmount } =
    useReadContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "getTotalStakedAmount",
      args: [tokenAddress],
    });

  const { data: stakingOptions, refetch: refetchStakingOptions } =
    useReadContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "getStakingOptions",
      args: [tokenAddress],
    }) as {
      data: StakingOption[] | undefined;
      refetch: () => Promise<{ data: StakingOption[] | undefined }>;
    };

  const { data: freezingBalance, refetch: refetchFreezingBalance } =
    useReadContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: "getFreezingBalance",
      args: [tokenAddress],
      account: userAddress,
    });

  const { data: availableFrozen, refetch: refetchAvailableFrozen } =
    useReadContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: "getAvailableFrozen",
      args: [tokenAddress],
      account: userAddress,
    });

  const tvl = totalStakedAmount || undefined;
  const reward = availableBalance || undefined;

  // Function to refetch all data
  const refetchAll = async () => {
    await Promise.all([
      refetchAvailableBalance(),
      refetchTotalStakedAmount(),
      refetchStakingOptions(),
      refetchFreezingBalance(),
      refetchAvailableFrozen(),
    ]);
  };

  return {
    // Data
    tvl: tvl?.toString(),
    reward: reward?.toString(),
    totalStakedAmount,
    availableBalance,
    stakingOptions,
    freezingBalance,
    availableFrozen,

    // Refetch functions
    refetchAvailableBalance,
    refetchTotalStakedAmount,
    refetchStakingOptions,
    refetchFreezingBalance,
    refetchAvailableFrozen,
    refetchAll,
  };
}
