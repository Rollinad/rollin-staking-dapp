// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DAOErrors {
    error UserAlreadyRegistered();
    error UserNotRegistered();
    error NotCreator();
    error ProposalNotFound();
    error InvalidAmount();
    error TokensAlreadyDeployed();
    error FundingPeriodEnded();
    error ContributionLimitExceeded();
    error TransferFailed();
    error InvalidParameters();
    error NotApproved();
    error AlreadyClosed();
    error NotContributor();
    error InsufficientAllowance();
    error InsufficientBalance();
    error AMMNotDeployed();
    error TokenNotDeployed();
    error TokenApprovalFailed();
    error TargetAmountNotReached();
}