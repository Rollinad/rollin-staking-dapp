// @ts-nocheck
import {
  useAccount,
  useBalance,
  useReadContract,
  useSimulateContract,
  useWriteContract,
} from "wagmi";
import { STAKING_CONTRACT_ABI, STAKING_CONTRACT_ADDRESS } from "../constants";
import { ErrorMessage, StakeData } from "../types/staking";
import { useState } from "react";
import { formatEther } from "viem";

export function useStakingContract() {
  const { address: userAddress } = useAccount();
  const { data: userBalance } = useBalance({
    address: userAddress,
  });

  const [createPoolParams, setCreatePoolParams] = useState<{
    tokenAddress: string;
  }>({ tokenAddress: "" });

  const [stakeParams, setStakeParams] = useState<{
    tokenAddress: string;
    stakingOptionId: string;
    amount: bigint;
  }>({
    tokenAddress: "",
    stakingOptionId: "",
    amount: BigInt(0),
  });

  const { data: registeredContracts } = useReadContract({
    abi: STAKING_CONTRACT_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getRegisteredContracts",
  });

  // Get allocation percent
  const { data: allocationPercent } = useReadContract({
    abi: STAKING_CONTRACT_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getAllocationPercent",
  }) as { data: bigint | undefined };

  // New query to get staking pools owned by the user
  const { data: ownedStakingPools } = useReadContract({
    abi: STAKING_CONTRACT_ABI,
    address: STAKING_CONTRACT_ADDRESS,
    functionName: "getOwnedStakingPools",
    args: [userAddress],
    enabled: !!userAddress,
  });

  const { data: stakingData } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getStakingData",
    account: userAddress,
  }) as { data: StakeData[] | undefined };

  const { data: poolFee } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getPoolFee",
  });

  const validatePoolFee = (): { isValid: boolean; error?: string } => {
    if (!userBalance?.value || !poolFee) {
      return { isValid: false, error: "Unable to validate balance" };
    }

    // Ensure both values are BigInt for comparison
    const balanceValue = userBalance.value;
    const feeValue = poolFee as bigint;

    if (balanceValue < feeValue) {
      return {
        isValid: false,
        error: `Insufficient balance for pool fee. Required: ${formatEther(
          feeValue
        )} MON`,
      };
    }

    return { isValid: true };
  };

  const { writeContract, isPending, error } = useWriteContract();

  const { data: createPoolSimulation, error: createPoolSimError } =
    useSimulateContract({
      address: STAKING_CONTRACT_ADDRESS,
      abi: STAKING_CONTRACT_ABI,
      functionName: "addStakingPool",
      args: createPoolParams.tokenAddress
        ? [createPoolParams.tokenAddress]
        : undefined,
      value: poolFee as bigint,
      account: userAddress,
    });

  const { data: stakeSimulation, error: stakeSimError } = useSimulateContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "stake",
    args: stakeParams.tokenAddress
      ? [
          stakeParams.tokenAddress,
          stakeParams.stakingOptionId,
          stakeParams.amount,
        ]
      : undefined,
    account: userAddress,
  });

  const handleContractError = (error: ErrorMessage): string => {
    const errorMessage = error.message || error.details || String(error);

    if (errorMessage.includes("Invalid token")) {
      return "Invalid token address provided";
    }
    if (errorMessage.includes("Pool exists")) {
      return "Staking pool already exists for this token";
    }
    if (errorMessage.includes("Insufficient allocation")) {
      return "Insufficient token allocation for pool creation. You need to own the required minimum percentage of the token's total supply.";
    }
    if (errorMessage.includes("Insufficient fee")) {
      return "Insufficient fee provided for pool creation";
    }
    if (errorMessage.includes("Not authorized")) {
      return "Not authorized to perform this action";
    }

    return `Transaction failed: ${errorMessage}`;
  };

  const createPool = async (tokenAddress: string) => {
    try {
      // Check fee
      const feeValidation = validatePoolFee();
      if (!feeValidation.isValid) {
        throw new Error(feeValidation.error);
      }

      // Set params and wait for simulation to update
      setCreatePoolParams({ tokenAddress });

      // Check simulation results
      if (createPoolSimError) {
        throw new Error(createPoolSimError.message);
      }

      if (!createPoolSimulation?.request) {
        throw new Error("Failed to simulate transaction");
      }

      return await writeContract(createPoolSimulation.request);
    } catch (err) {
      const errorMessage = handleContractError(err as ErrorMessage);
      console.log(`errorMessage ${JSON.stringify(errorMessage)}`);
      throw new Error(errorMessage);
    }
  };

  const createStakingOption = async (
    tokenAddress: string,
    duration: bigint,
    apy: bigint
  ) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "addStakingOption",
      args: [tokenAddress, duration, apy],
    });
  };

  const stake = async (
    tokenAddress: string,
    stakingOptionId: string,
    amount: bigint
  ) => {
    try {
      // Set params and wait for simulation to update
      setStakeParams({ tokenAddress, stakingOptionId, amount });

      // Check simulation results
      if (stakeSimError) {
        throw new Error(stakeSimError.message);
      }

      if (!stakeSimulation?.request) {
        throw new Error("Failed to simulate transaction");
      }

      return writeContract({
        abi: STAKING_CONTRACT_ABI,
        address: STAKING_CONTRACT_ADDRESS,
        functionName: "stake",
        args: [tokenAddress, stakingOptionId, amount],
      });
    } catch (err) {
      const errorMessage = handleContractError(err as ErrorMessage);
      console.log(`error staking ${errorMessage}`);
      throw new Error(errorMessage);
    }
  };

  const unstake = async (
    tokenAddress: string,
    stakingOptionId: string,
    amount: bigint
  ) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "unstake",
      args: [tokenAddress, stakingOptionId, amount],
    });
  };

  const unstakeFreeze = async (
    tokenAddress: string,
    stakingOptionId: string,
    amount: bigint
  ) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "unstakeFreeze",
      args: [tokenAddress, stakingOptionId, amount],
    });
  };

  const withdrawFrozen = async (tokenAddress: string) => {
    return writeContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "withdrawFrozen",
      args: [tokenAddress],
    });
  };

  // Function to check if user has any owned staking pools
  const hasOwnedPools = !!ownedStakingPools && ownedStakingPools.length > 0;

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
    poolFee,
    validatePoolFee,
    ownedStakingPools,
    hasOwnedPools,
    allocationPercent
  };
}