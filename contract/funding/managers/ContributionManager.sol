// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDAOStorage.sol";
import "../libraries/DAOLib.sol";
import "../tokens/DAOToken.sol";
import "../tokens/SimpleAMM.sol";
import "../core/DAOErrors.sol";

contract ContributionManager is DAOErrors {
    using DAOLib for IDAOStorage.Proposal;

    IDAOStorage public immutable daoStorage;
    address public immutable daoFunding;
    uint256 public immutable lpPercentage;
    uint256 public immutable fundingPeriod;
    uint256 public constant PRICE_PRECISION = 1e18;

    event ContributionRequested(uint256 indexed proposalId, address indexed contributor);
    event ContributorApproved(uint256 indexed proposalId, address indexed contributor, uint256 limit);
    event FundingContributed(uint256 indexed proposalId, address indexed contributor, uint256 amount);
    event LiquidityCommitted(uint256 indexed proposalId, uint256 amount);
    event FundsReleased(uint256 indexed proposalId, address indexed creator, uint256 amount);
    event FundsRefunded(uint256 indexed proposalId, address indexed contributor, uint256 amount);
    event ContributorLimitAdjusted(uint256 indexed proposalId, address indexed contributor, uint256 newLimit);

    error NotAuthorized();

    modifier onlyDAOFunding() {
        if (msg.sender != daoFunding) revert NotAuthorized();
        _;
    }

    constructor(
        address _daoStorage,
        address _daoFunding,
        uint256 _lpPercentage,
        uint256 _fundingPeriod
    ) {
        daoStorage = IDAOStorage(_daoStorage);
        daoFunding = _daoFunding;
        lpPercentage = _lpPercentage;
        fundingPeriod = _fundingPeriod;
    }

    function requestToContribute(
        uint256 proposalId,
        address contributor
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        bool hasRequested = daoStorage.getContributorRequest(proposalId, contributor);

        if (!basic.isApproved) revert NotApproved();
        if (basic.isClosed) revert AlreadyClosed();
        if (hasRequested) revert UserAlreadyRegistered();

        daoStorage.setContributorRequest(proposalId, contributor, true);
        _updateRequestingContributors(proposalId, contributor);

        emit ContributionRequested(proposalId, contributor);
    }

    function approveContributor(
        uint256 proposalId,
        address contributor,
        uint256 contributionLimit
    ) external onlyDAOFunding {
        if (contributionLimit == 0) revert InvalidAmount();

        bool hasRequested = daoStorage.getContributorRequest(proposalId, contributor);
        bool isApproved = daoStorage.getApprovedContributor(proposalId, contributor);

        if (!hasRequested) revert NotContributor();
        if (isApproved) revert UserAlreadyRegistered();

        daoStorage.setApprovedContributor(proposalId, contributor, true);
        daoStorage.setContributionLimit(proposalId, contributor, contributionLimit);
        _updateApprovedContributors(proposalId, contributor);

        emit ContributorApproved(proposalId, contributor, contributionLimit);
    }

    function contribute(
        uint256 proposalId,
        address contributor,
        uint256 amount
    ) external payable onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        
        uint256 contribution = daoStorage.getContribution(proposalId, contributor);
        uint256 contributionLimit = daoStorage.getContributionLimit(proposalId, contributor);

        if (!basic.isApproved) revert NotApproved();
        if (basic.isClosed) revert AlreadyClosed();
        if (block.timestamp >= basic.createdAt + fundingPeriod) revert FundingPeriodEnded();

        DAOLib.handleContribution(contribution, contributionLimit, contributor, amount, basic, token);

        uint256 currentContribution = daoStorage.getContribution(proposalId, contributor);
        uint256 newContribution = currentContribution + amount;
        uint256 tokenAllocation = (amount * token.contributionPrice) / PRICE_PRECISION;

        daoStorage.setContribution(proposalId, contributor, newContribution);
        daoStorage.setTokenAllocation(proposalId, contributor, tokenAllocation);

        basic.currentAmount += amount;
        daoStorage.setProposalBasic(proposalId, basic);

        emit FundingContributed(proposalId, contributor, amount);
    }

    function releaseFunds(
        uint256 proposalId
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);

        if (!basic.isApproved) revert NotApproved();
        if (basic.isClosed) revert AlreadyClosed();
        if (basic.currentAmount < basic.targetAmount) revert TargetAmountNotReached();
        if (token.tokenAddress == address(0)) revert TokenNotDeployed();
        if (token.ammAddress == address(0)) revert AMMNotDeployed();

        basic.isClosed = true;
        daoStorage.setProposalBasic(proposalId, basic);

        uint256 lpAmount = DAOLib.calculateLPAmount(basic.currentAmount, lpPercentage);
        uint256 creatorAmount = basic.currentAmount - lpAmount;

        uint256 remainingTokens = token.tokenSupply - token.allocationSupply;
        bool success = IDAOToken(token.tokenAddress).approve(token.ammAddress, remainingTokens);
        if (!success) revert TokenApprovalFailed();

        try ISimpleAMM(token.ammAddress).addLiquidity{value: lpAmount}() {
            emit LiquidityCommitted(proposalId, lpAmount);
            emit FundsReleased(proposalId, basic.creator, creatorAmount);
        } catch Error(string memory reason) {
            revert AddLiquidityFailed(reason);
        }

        (bool sent, ) = payable(basic.creator).call{value: creatorAmount}("");
        if (!sent) revert TransferFailed();
    }

    function withdrawContribution(
        uint256 proposalId,
        address contributor
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);

        if (!DAOLib.validateWithdrawal(
            block.timestamp,
            basic.createdAt,
            fundingPeriod,
            basic.currentAmount,
            basic.targetAmount
        )) revert InvalidParameters();

        uint256 ethAmount = daoStorage.getContribution(proposalId, contributor);
        if (ethAmount == 0) revert InvalidAmount();

        DAOLib.handleWithdrawal(contributor, ethAmount, token);

        daoStorage.setContribution(proposalId, contributor, 0);
        daoStorage.setTokenAllocation(proposalId, contributor, 0);

        basic.currentAmount -= ethAmount;
        daoStorage.setProposalBasic(proposalId, basic);

        (bool sent, ) = payable(contributor).call{value: ethAmount}("");
        if (!sent) revert TransferFailed();

        emit FundsRefunded(proposalId, contributor, ethAmount);
    }

    function adjustContributionLimit(
        uint256 proposalId,
        address contributor,
        uint256 newLimit
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        bool isApproved = daoStorage.getApprovedContributor(proposalId, contributor);
        uint256 currentContribution = daoStorage.getContribution(proposalId, contributor);

        if (!basic.isApproved) revert NotApproved();
        if (basic.isClosed) revert AlreadyClosed();
        if (!isApproved) revert NotContributor();
        if (newLimit == 0) revert InvalidAmount();
        if (newLimit < currentContribution) revert InvalidAmount();

        daoStorage.setContributionLimit(proposalId, contributor, newLimit);
        emit ContributorLimitAdjusted(proposalId, contributor, newLimit);
    }

    function _updateRequestingContributors(uint256 proposalId, address contributor) internal {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        address[] memory newRequestingContributors = new address[](basic.requestingContributors.length + 1);
        for (uint i = 0; i < basic.requestingContributors.length; i++) {
            newRequestingContributors[i] = basic.requestingContributors[i];
        }
        newRequestingContributors[basic.requestingContributors.length] = contributor;
        basic.requestingContributors = newRequestingContributors;
        daoStorage.setProposalBasic(proposalId, basic);
    }

    function _updateApprovedContributors(uint256 proposalId, address contributor) internal {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        address[] memory newApprovedContributors = new address[](basic.approvedContributors.length + 1);
        for (uint i = 0; i < basic.approvedContributors.length; i++) {
            newApprovedContributors[i] = basic.approvedContributors[i];
        }
        newApprovedContributors[basic.approvedContributors.length] = contributor;
        basic.approvedContributors = newApprovedContributors;
        daoStorage.setProposalBasic(proposalId, basic);
    }

    receive() external payable {}
}