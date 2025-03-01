// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDAOStorage.sol";

library DAOViewLib {
    uint256 private constant PRICE_PRECISION = 1e18;
    uint256 private constant PERCENTAGE_BASE = 100;

    function getPaginatedList(
        IDAOStorage daoStorage,
        uint256 proposalId,
        address[] memory addressList,
        uint256 offset,
        uint256 limit
    ) internal view returns (IDAOStorage.ContributorInfo[] memory list, uint256 total) {
        total = addressList.length;

        if (offset >= total || limit == 0) {
            return (new IDAOStorage.ContributorInfo[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        uint256 length = end - offset;

        list = new IDAOStorage.ContributorInfo[](length);
        for (uint256 i = 0; i < length; i++) {
            address contributor = addressList[offset + i];
            list[i] = IDAOStorage.ContributorInfo({
                contributorAddress: contributor,
                hasRequested: daoStorage.getContributorRequest(proposalId, contributor),
                isApproved: daoStorage.getApprovedContributor(proposalId, contributor),
                contributionLimit: daoStorage.getContributionLimit(proposalId, contributor),
                currentContribution: daoStorage.getContribution(proposalId, contributor)
            });
        }

        return (list, total);
    }

    function createProposalView(
        IDAOStorage.ProposalBasic memory basic,
        IDAOStorage.ProposalToken memory token
    ) internal pure returns (IDAOStorage.ProposalView memory) {
        return IDAOStorage.ProposalView({
            creator: basic.creator,
            targetAmount: basic.targetAmount,
            currentAmount: basic.currentAmount,
            createdAt: basic.createdAt,
            isApproved: basic.isApproved,
            isClosed: basic.isClosed,
            tokensDeployed: basic.tokensDeployed,
            tokenName: token.tokenName,
            tokenSymbol: token.tokenSymbol,
            tokenSupply: token.tokenSupply,
            allocationSupply: token.allocationSupply,
            tokenPrice: token.tokenPrice,
            contributionPrice: token.contributionPrice,
            creatorXAccountId: token.creatorXAccountId,
            tokenAddress: token.tokenAddress,
            ammAddress: token.ammAddress
        });
    }

    function combineProposalView(
        IDAOStorage daoStorage,
        uint256 proposalId
    ) internal view returns (IDAOStorage.ProposalView memory) {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        return createProposalView(basic, token);
    }

    // Status and calculation functions
    function calculateProposalPercentage(
        uint256 currentAmount,
        uint256 targetAmount,
        uint256 percentageBase
    ) internal pure returns (uint256) {
        return
            targetAmount > 0
                ? (currentAmount * percentageBase) / targetAmount
                : 0;
    }

    function getProposalStatus(
        IDAOStorage.ProposalBasic memory proposalBasic,
        uint256 fundingPeriod
    )
        internal
        view
        returns (
            bool isActive,
            bool hasMetTarget,
            uint256 timeRemaining,
            uint256 percentageComplete
        )
    {
        isActive =
            proposalBasic.isApproved &&
            !proposalBasic.isClosed &&
            block.timestamp < proposalBasic.createdAt + fundingPeriod;

        hasMetTarget =
            proposalBasic.currentAmount >= proposalBasic.targetAmount;

        timeRemaining = block.timestamp <
            proposalBasic.createdAt + fundingPeriod
            ? proposalBasic.createdAt + fundingPeriod - block.timestamp
            : 0;

        percentageComplete = calculateProposalPercentage(
            proposalBasic.currentAmount,
            proposalBasic.targetAmount,
            PERCENTAGE_BASE
        );
    }
}