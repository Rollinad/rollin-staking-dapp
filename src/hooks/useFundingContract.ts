// @ts-nocheck
import { useCallback } from "react";
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address, parseEther } from "viem";
import { DAOFundingABI, DAOViewABI } from "../constants/funding/abi";
import { DAO_FUNDING_CONTRACT_ADDRESS, DAO_VIEW_CONTRACT_ADDRESS } from "../constants";

// Define types for the contract responses
type UserDataResponse = [string, boolean, boolean, bigint[]];
type ContributionInfoResponse = [bigint, bigint, bigint, boolean, boolean];
type ProposalStatusResponse = [boolean, boolean, bigint, bigint];
type ProposalBasicResponse = [
  Address,
  bigint,
  bigint,
  bigint,
  boolean,
  boolean,
  boolean
];
type ProposalTokenResponse = [
  string,
  string,
  bigint,
  bigint,
  Address,
  Address,
  string
];
type ContributorCountsResponse = [bigint, bigint];

// Custom hook for user management
export function useUserManagement() {
  const { address } = useAccount();
  const {
    data: writeData,
    error: writeError,
    isPending,
    writeContract,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: writeData,
    });

  // Get user data
  const {
    data: userData,
    isLoading: userDataLoading,
    refetch: refetchUserData,
  } = useReadContract({
    address: DAO_VIEW_CONTRACT_ADDRESS,
    abi: DAOViewABI,
    functionName: "getCreatorInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const formattedUserData = userData
    ? {
        xAccountId: (userData as UserDataResponse)[0],
        isRegistered: (userData as UserDataResponse)[1],
        isCreator: (userData as UserDataResponse)[2],
        proposalIds: (userData as UserDataResponse)[3],
      }
    : null;

  // Register user
  const registerUser = useCallback(
    (xAccountId: string) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "registerUser",
        args: [xAccountId],
      });
    },
    [address, writeContract]
  );

  // Update to creator
  const updateToCreator = useCallback(
    (xAccountId: string) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "updateToCreator",
        args: [xAccountId],
      });
    },
    [address, writeContract]
  );

  return {
    userData: formattedUserData,
    userDataLoading,
    registerUser,
    updateToCreator,
    isPending,
    isConfirming,
    isConfirmed,
    writeError,
    refetchUserData,
    txHash: writeData,
  };
}

// Custom hook for proposal management
export function useProposalManagement() {
  const { address } = useAccount();
  const {
    data: writeData,
    error: writeError,
    isPending,
    writeContract,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: writeData,
    });

  // Create proposal
  const createProposal = useCallback(
    (
      targetAmount: string,
      tokenName: string,
      tokenSymbol: string,
      tokenSupply: string
    ) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "createProposal",
        args: [
          parseEther(targetAmount),
          tokenName,
          tokenSymbol,
          parseEther(tokenSupply),
        ],
      });
    },
    [address, writeContract]
  );

  // Approve proposal
  const approveProposal = useCallback(
    (proposalId: bigint) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "approveProposal",
        args: [proposalId],
      });
    },
    [address, writeContract]
  );

  return {
    createProposal,
    approveProposal,
    isPending,
    isConfirming,
    isConfirmed,
    writeError,
    txHash: writeData,
  };
}

// Custom hook for contribution management
export function useContributionManagement() {
  const { address } = useAccount();
  const {
    data: writeData,
    error: writeError,
    isPending,
    writeContract,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: writeData,
    });

  // Request to contribute
  const requestToContribute = useCallback(
    (proposalId: bigint) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "requestToContribute",
        args: [proposalId],
      });
    },
    [address, writeContract]
  );

  // Approve contributor
  const approveContributor = useCallback(
    (proposalId: bigint, contributor: Address, contributionLimit: string) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "approveContributor",
        args: [proposalId, contributor, parseEther(contributionLimit)],
      });
    },
    [address, writeContract]
  );

  // Contribute
  const contribute = useCallback(
    (proposalId: bigint, amount: string) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "contribute",
        args: [proposalId],
        value: parseEther(amount),
      });
    },
    [address, writeContract]
  );

  // Release funds
  const releaseFunds = useCallback(
    (proposalId: bigint) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "releaseFunds",
        args: [proposalId],
      });
    },
    [address, writeContract]
  );

  // Withdraw contribution
  const withdrawContribution = useCallback(
    (proposalId: bigint) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "withdrawContribution",
        args: [proposalId],
      });
    },
    [address, writeContract]
  );

  // Get contribution info
  const useContributionInfo = (proposalId: bigint | undefined) => {
    const { data, isLoading, refetch } = useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getContributionInfo",
      args: proposalId !== undefined && address ? [BigInt(proposalId), address] : undefined,
      query: {
        enabled: proposalId !== undefined && address !== undefined,
      },
    });

    const formattedData = data
      ? {
          limit: (data as ContributionInfoResponse)[0],
          currentContribution: (data as ContributionInfoResponse)[1],
          tokenAllocation: (data as ContributionInfoResponse)[2],
          isApproved: (data as ContributionInfoResponse)[3],
          hasRequested: (data as ContributionInfoResponse)[4],
        }
      : null;

    return { data: formattedData, isLoading, refetch };
  };

  return {
    requestToContribute,
    approveContributor,
    contribute,
    releaseFunds,
    withdrawContribution,
    useContributionInfo,
    isPending,
    isConfirming,
    isConfirmed,
    writeError,
    txHash: writeData,
  };
}

// Custom hook for trading
export function useTokenTrading() {
  const { address } = useAccount();
  const {
    data: writeData,
    error: writeError,
    isPending,
    writeContract,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: writeData,
    });

  // Swap ETH for tokens
  const swapETHForTokens = useCallback(
    (proposalId: bigint, amount: string) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "swapETHForTokens",
        args: [proposalId],
        value: parseEther(amount),
      });
    },
    [address, writeContract]
  );

  // Swap tokens for ETH
  const swapTokensForETH = useCallback(
    (proposalId: bigint, tokenAmount: string) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "swapTokensForETH",
        args: [proposalId, parseEther(tokenAmount)],
      });
    },
    [address, writeContract]
  );

  // Set approval for token refund
  const setApprovalForTokenRefund = useCallback(
    (proposalId: bigint) => {
      if (!address) return;
      writeContract({
        address: DAO_FUNDING_CONTRACT_ADDRESS,
        abi: DAOFundingABI,
        functionName: "setApprovalForTokenRefund",
        args: [proposalId],
      });
    },
    [address, writeContract]
  );

  return {
    swapETHForTokens,
    swapTokensForETH,
    setApprovalForTokenRefund,
    isPending,
    isConfirming,
    isConfirmed,
    writeError,
    txHash: writeData,
  };
}

// Custom hook for proposal queries
export function useProposalQueries() {
  const { address } = useAccount();

  // Get total proposals
  const useTotalProposals = () => {
    return useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getTotalProposals",
    });
  };

  // Get proposals paginated
  const useProposalsPaginated = (offset: bigint = 0n, limit: bigint = 10n) => {
    return useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getProposalsPaginated",
      args: [offset, limit],
      query: {
        enabled: true,
      },
    });
  };

  // Get proposals by creator
  const useProposalsByCreator = (creator?: Address) => {
    const creatorAddress = creator || address;
    return useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getProposalsByCreator",
      args: creatorAddress ? [creatorAddress] : undefined,
      query: {
        enabled: !!creatorAddress,
      },
    });
  };

  // Get filtered proposals
  const useFilteredProposals = (
    onlyActive: boolean = true,
    onlyApproved: boolean = true
  ) => {
    return useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getFilteredProposals",
      args: [onlyActive, onlyApproved],
    });
  };

  // Get proposal status
  const useProposalStatus = (proposalId: bigint | undefined) => {
    const { data, isLoading, refetch } = useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getProposalStatus",
      args: proposalId ? [proposalId] : [0n],
    });

    const formattedData = data
      ? {
          isActive: (data as ProposalStatusResponse)[0],
          hasMetTarget: (data as ProposalStatusResponse)[1],
          timeRemaining: (data as ProposalStatusResponse)[2],
          percentageComplete: (data as ProposalStatusResponse)[3],
        }
      : null;

    return { data: formattedData, isLoading, refetch };
  };

  // Get proposal basic details
  const useProposalBasicDetails = (proposalId: bigint | undefined) => {
    const { data, isLoading, refetch } = useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getProposalBasicDetails",
      args: proposalId ? [proposalId] : [0n],
    });

    const formattedData = data
      ? {
          creator: (data as ProposalBasicResponse)[0],
          targetAmount: (data as ProposalBasicResponse)[1],
          currentAmount: (data as ProposalBasicResponse)[2],
          createdAt: (data as ProposalBasicResponse)[3],
          isApproved: (data as ProposalBasicResponse)[4],
          isClosed: (data as ProposalBasicResponse)[5],
          tokensDeployed: (data as ProposalBasicResponse)[6],
        }
      : null;

    return { data: formattedData, isLoading, refetch };
  };

  // Get proposal token details
  const useProposalTokenDetails = (proposalId: bigint | undefined) => {
    const { data, isLoading, refetch } = useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getProposalTokenDetails",
      args: proposalId ? [proposalId] : [0n],
    });

    const formattedData = data
      ? {
          tokenName: (data as ProposalTokenResponse)[0],
          tokenSymbol: (data as ProposalTokenResponse)[1],
          tokenSupply: (data as ProposalTokenResponse)[2],
          tokenPrice: (data as ProposalTokenResponse)[3],
          tokenAddress: (data as ProposalTokenResponse)[4],
          ammAddress: (data as ProposalTokenResponse)[5],
          creatorXAccountId: (data as ProposalTokenResponse)[6],
          contributionPrice: (data as any)[3] || 0n,
          allocationSupply: (data as any)[2] || 0n,
        }
      : null;

    return { data: formattedData, isLoading, refetch };
  };

  return {
    useTotalProposals,
    useProposalsPaginated,
    useProposalsByCreator,
    useFilteredProposals,
    useProposalStatus,
    useProposalBasicDetails,
    useProposalTokenDetails,
  };
}

// Custom hook for contributor queries
export function useContributorQueries() {
  // Get contributor counts
  const useContributorsCounts = (proposalId: bigint | undefined) => {
    const { data, isLoading, refetch } = useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getContributorsCounts",
      args: proposalId ? [proposalId] : [0n],
    });

    const formattedData = data
      ? {
          requestingCount: (data as ContributorCountsResponse)[0],
          approvedCount: (data as ContributorCountsResponse)[1],
        }
      : null;

    return { data: formattedData, isLoading, refetch };
  };

  // Get requesting contributors paginated
  const useRequestingContributorsPaginated = (
    proposalId: bigint | undefined,
    offset: bigint = 0n,
    limit: bigint = 10n
  ) => {
    return useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getRequestingContributorsPaginated",
      args: proposalId ? [proposalId, offset, limit] : [0n, offset, limit],
    });
  };

  // Get approved contributors paginated
  const useApprovedContributorsPaginated = (
    proposalId: bigint | undefined,
    offset: bigint = 0n,
    limit: bigint = 10n
  ) => {
    const { data, isLoading, refetch } = useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getApprovedContributorsPaginated",
      args: proposalId ? [proposalId, offset, limit] : [0n, offset, limit],
    });

    // Return data as-is, but with proper type assertion
    return {
      data: data as [ContributorInfo[], bigint] | null,
      isLoading,
      refetch,
    };
  };

  return {
    useContributorsCounts,
    useRequestingContributorsPaginated,
    useApprovedContributorsPaginated,
  };
}

// Custom hook for token balances
export function useTokenBalances() {
  const { address } = useAccount();

  // Get token balance
  const useTokenBalance = (proposalId: bigint | undefined) => {
    return useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getTokenBalance",
      args: proposalId !== undefined ? [proposalId] : undefined,
      query: {
        enabled: proposalId !== undefined,
      },
      account: address as Address
    });
  };

  // Get address token balance
  const useAddressTokenBalance = (
    proposalId: bigint | undefined,
    account?: Address
  ) => {
    const targetAddress = account || address;
    return useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getAddressTokenBalance",
      args:
        proposalId && targetAddress ? [proposalId, targetAddress] : undefined,
      query: {
        enabled: !!proposalId && !!targetAddress,
      },
    });
  };

  // Get current token price
  const useCurrentTokenPrice = (proposalId: bigint | undefined) => {
    return useReadContract({
      address: DAO_VIEW_CONTRACT_ADDRESS,
      abi: DAOViewABI,
      functionName: "getCurrentTokenPrice",
      args: proposalId ? [proposalId] : [0n],
    });
  };

  return {
    useTokenBalance,
    useAddressTokenBalance,
    useCurrentTokenPrice,
  };
}

export type ContributorInfo = {
  contributorAddress: Address;
  currentContribution: bigint;
  contributionLimit: bigint;
};

// General hook for direct contract interaction
export function useFundingContract() {
  const { writeContract, data, error, isPending } = useWriteContract();

  return {
    writeContract,
    data,
    error,
    isPending,
  };
}
