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
