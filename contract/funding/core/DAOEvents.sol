// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DAOEvents {
    event UserRegistered(address indexed userAddress, string xAccountId);
    event CreatorUpdated(address indexed creator, string xAccountId);
    event ProposalCreated(uint256 indexed proposalId, address creator, uint256 targetAmount);
    event CreatorProposalCreated(address indexed creator, uint256 indexed proposalId, string xAccountId);
    event ProposalApproved(uint256 indexed proposalId);
    event ContributionRequested(uint256 indexed proposalId, address contributor);
    event ContributorApproved(uint256 indexed proposalId, address contributor, uint256 contributionLimit);
    event ContributorLimitAdjusted(uint256 indexed proposalId, address contributor, uint256 newLimit);
    event FundingContributed(uint256 indexed proposalId, address contributor, uint256 amount);
    event TokenDeployed(uint256 indexed proposalId, address tokenAddress, address ammAddress, uint256 lpAmount);
    event LiquidityCommitted(uint256 indexed proposalId, uint256 amount);
    event FundsReleased(uint256 indexed proposalId, address creator, uint256 amount);
    event FundsRefunded(uint256 indexed proposalId, address contributor, uint256 amount);
}