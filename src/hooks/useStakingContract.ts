import {
  useAccount,
  useBalance,
  useReadContract,
  useSimulateContract,
  useWriteContract,
} from "wagmi";
import { ErrorMessage, StakeData } from "../types/staking";
import { useState } from "react";
import { formatEther } from "viem";
import { STAKING_CONTRACT_ABI } from "../constants/staking/abi";
import { STAKING_CONTRACT_ADDRESS } from "../constants";

export function useStakingContract() {
  const { address: userAddress } = useAccount();
  const { data: userBalance, refetch: refetchUserBalance } = useBalance({
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

  const { data: registeredContracts, refetch: refetchRegisteredContracts } =
    useReadContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "getRegisteredContracts",
    });

  const { data: allocationPercent, refetch: refetchAllocationPercent } =
    useReadContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "getAllocationPercent",
    }) as {
      data: bigint | undefined;
      refetch: () => Promise<{ data: bigint | undefined }>;
    };

  const { data: ownedStakingPools, refetch: refetchOwnedStakingPools } =
    useReadContract({
      abi: STAKING_CONTRACT_ABI,
      address: STAKING_CONTRACT_ADDRESS,
      functionName: "getOwnedStakingPools",
      args: [userAddress],
    });

  const { data: stakingData, refetch: refetchStakingData } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getStakingData",
    account: userAddress,
  }) as {
    data: StakeData[] | undefined;
    refetch: () => Promise<{ data: StakeData[] | undefined }>;
  };

  const { data: poolFee, refetch: refetchPoolFee } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: "getPoolFee",
  });

  const validatePoolFee = (): { isValid: boolean; error?: string } => {
    if (!userBalance?.value || !poolFee) {
      return { isValid: false, error: "Unable to validate balance" };
    }

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

  const { writeContract, isPending, error, data } = useWriteContract();

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

  const refetchAllData = async () => {
    await Promise.all([
      refetchUserBalance(),
      refetchRegisteredContracts(),
      refetchAllocationPercent(),
      refetchOwnedStakingPools(),
      refetchStakingData(),
      refetchPoolFee(),
    ]);
  };

  const createPool = async (tokenAddress: string) => {
    try {
      const feeValidation = validatePoolFee();
      if (!feeValidation.isValid) {
        throw new Error(feeValidation.error);
      }

      setCreatePoolParams({ tokenAddress });

      if (createPoolSimError) {
        throw new Error(createPoolSimError.message);
      }

      if (!createPoolSimulation?.request) {
        throw new Error("Failed to simulate transaction");
      }

      writeContract(createPoolSimulation.request);
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
    try {
      writeContract({
        abi: STAKING_CONTRACT_ABI,
        address: STAKING_CONTRACT_ADDRESS,
        functionName: "addStakingOption",
        args: [tokenAddress, duration, apy],
      });
    } catch (err) {
      const errorMessage = handleContractError(err as ErrorMessage);
      throw new Error(errorMessage);
    }
  };

  const stake = async (
    tokenAddress: string,
    stakingOptionId: string,
    amount: bigint
  ) => {
    try {
      setStakeParams({ tokenAddress, stakingOptionId, amount });

      if (stakeSimError) {
        throw new Error(stakeSimError.message);
      }

      if (!stakeSimulation?.request) {
        throw new Error("Failed to simulate transaction");
      }

      writeContract({
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
    try {
      writeContract({
        abi: STAKING_CONTRACT_ABI,
        address: STAKING_CONTRACT_ADDRESS,
        functionName: "unstake",
        args: [tokenAddress, stakingOptionId, amount],
      });
    } catch (err) {
      const errorMessage = handleContractError(err as ErrorMessage);
      throw new Error(errorMessage);
    }
  };

  const unstakeFreeze = async (
    tokenAddress: string,
    stakingOptionId: string,
    amount: bigint
  ) => {
    try {
      writeContract({
        abi: STAKING_CONTRACT_ABI,
        address: STAKING_CONTRACT_ADDRESS,
        functionName: "unstakeFreeze",
        args: [tokenAddress, stakingOptionId, amount],
      });
    } catch (err) {
      const errorMessage = handleContractError(err as ErrorMessage);
      throw new Error(errorMessage);
    }
  };

  const withdrawFrozen = async (tokenAddress: string) => {
    try {
      writeContract({
        abi: STAKING_CONTRACT_ABI,
        address: STAKING_CONTRACT_ADDRESS,
        functionName: "withdrawFrozen",
        args: [tokenAddress],
      });
    } catch (err) {
      const errorMessage = handleContractError(err as ErrorMessage);
      throw new Error(errorMessage);
    }
  };

  const hasOwnedPools =
    !!ownedStakingPools && (ownedStakingPools as any[]).length > 0;

  return {
    // Data
    registeredContracts,
    stakingData,
    poolFee,
    ownedStakingPools,
    hasOwnedPools,
    allocationPercent,

    // Action functions
    createPool,
    createStakingOption,
    stake,
    unstake,
    unstakeFreeze,
    withdrawFrozen,
    validatePoolFee,

    // Status
    isPending,
    error,
    data,

    // Refetch functions
    refetchUserBalance,
    refetchRegisteredContracts,
    refetchAllocationPercent,
    refetchOwnedStakingPools,
    refetchStakingData,
    refetchPoolFee,
    refetchAllData,
  };
}
