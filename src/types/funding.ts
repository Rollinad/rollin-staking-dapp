export interface ProposalBasic {
  creator: string;
  targetAmount: bigint;
  currentAmount: bigint;
  createdAt: bigint;
  isApproved: boolean;
  isClosed: boolean;
  tokensDeployed: boolean;
}

export interface ProposalToken {
  tokenAddress: string;
  ammAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenSupply: bigint;
  allocationSupply: bigint;
  tokenPrice: bigint;
  contributionPrice: bigint;
  creatorXAccountId: string;
}

export interface ProposalView
  extends ProposalBasic,
    Omit<ProposalToken, "allocationSupply"> {
  allocationSupply: bigint;
}

export interface ProposalStatus {
  isActive: boolean;
  hasMetTarget: boolean;
  timeRemaining: bigint;
  percentageComplete: bigint;
}

export interface ContributionInfo {
  limit: bigint;
  currentContribution: bigint;
  tokenAllocation: bigint;
  isApproved: boolean;
  hasRequested: boolean;
}

export interface ContributorInfo {
  contributorAddress: string;
  hasRequested: boolean;
  isApproved: boolean;
  contributionLimit: bigint;
  currentContribution: bigint;
}

export interface UserData {
  xAccountId: string;
  isRegistered: boolean;
  isCreator: boolean;
  proposalIds: bigint[];
}

export interface ContributorCounts {
  requestingCount: bigint;
  approvedCount: bigint;
}

export interface UserData {
  xAccountId: string;
  isRegistered: boolean;
  isCreator: boolean;
  proposalIds: bigint[];
}
