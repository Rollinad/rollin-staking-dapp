// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../core/DAOStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library DAOLib {
    uint256 private constant PRICE_PRECISION = 1e18;
    uint256 private constant PERCENTAGE_BASE = 100;

    // Original calculation functions
    function calculateTokenAllocation(
        uint256 contribution,
        uint256 targetAmount,
        uint256 allocationSupply
    ) internal pure returns (uint256) {
        return (contribution * allocationSupply) / targetAmount;
    }

    function calculateLPAmount(
        uint256 totalAmount,
        uint256 lpPercentage
    ) internal pure returns (uint256) {
        return (totalAmount * lpPercentage) / PERCENTAGE_BASE;
    }

    function calculateTokenPrice(
        uint256 ethAmount,
        uint256 tokenSupply
    ) internal pure returns (uint256) {
        return (ethAmount * PRICE_PRECISION) / tokenSupply;
    }

    function calculateInitialTokenPrice(
        uint256 targetAmount,
        uint256 tokenSupply,
        uint256 lpPercentage
    ) internal pure returns (uint256) {
        uint256 amountForAMM = calculateLPAmount(targetAmount, lpPercentage);
        return calculateTokenPrice(amountForAMM, tokenSupply);
    }

    // Validation functions
    function validateProposalParameters(
        uint256 targetAmount,
        uint256 tokenSupply,
        uint256 lpPercentage
    ) internal pure returns (bool) {
        return
            targetAmount > 0 &&
            tokenSupply > 0 &&
            lpPercentage > 0 &&
            lpPercentage <= PERCENTAGE_BASE;
    }

    function validateContribution(
        uint256 newTotal,
        uint256 limit
    ) internal pure returns (bool) {
        return newTotal <= limit;
    }

    function validateWithdrawal(
        uint256 timestamp,
        uint256 createdAt,
        uint256 fundingPeriod,
        uint256 currentAmount,
        uint256 targetAmount
    ) internal pure returns (bool) {
        return
            timestamp >= createdAt + fundingPeriod &&
            currentAmount < targetAmount;
    }

    // Complex operation functions
    function handleContribution(
        uint256 contribution,
        uint256 contributionLimit,
        address contributor,
        uint256 amount,
        IDAOStorage.ProposalBasic memory proposalBasic,
        IDAOStorage.ProposalToken memory proposalToken
    ) internal returns (uint256 tokenAmount) {
        uint256 newTotal = contribution + amount;
        require(
            validateContribution(
                newTotal,
                contributionLimit
            ),
            "Limit exceeded"
        );

        tokenAmount = calculateTokenAllocation(
            amount,
            proposalBasic.targetAmount,
            proposalToken.allocationSupply
        );

        require(
            IERC20(proposalToken.tokenAddress).transfer(contributor, tokenAmount),
            "Transfer failed"
        );
    }

    function handleWithdrawal(
        address contributor,
        uint256 ethAmount,
        IDAOStorage.ProposalToken memory proposalToken
    ) internal returns (uint256 tokenAmount) {
        tokenAmount = (ethAmount * proposalToken.tokenPrice) / PRICE_PRECISION;

        require(
            IERC20(proposalToken.tokenAddress).transferFrom(
                contributor,
                address(this),
                tokenAmount
            ),
            "Token transfer failed"
        );
    }
}
