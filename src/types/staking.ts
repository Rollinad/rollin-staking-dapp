export interface StakingOption {
  stakingOptionId: string;
  duration: bigint;
  apy: bigint;
  isActive: boolean;
}

export interface Pool {
  address: string;
  tvl: bigint;
}

export interface StakeData {
  amount: bigint;
  startTime: bigint;
  stakingOptionId: string;
}

export interface ErrorMessage {
  message?: string;
  details?: string[];
}

export interface TokenData {
  balance?: bigint;
  symbol?: string;
  name?: string;
  decimals?: number;
}