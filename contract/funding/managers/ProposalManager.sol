// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDAOStorage.sol";
import "../libraries/DAOLib.sol";
import "../tokens/DAOToken.sol";
import "../tokens/SimpleAMM.sol";

contract ProposalManager {
    using DAOLib for IDAOStorage.Proposal;

    IDAOStorage public immutable daoStorage;
    address public immutable daoFunding;
    address public immutable contributionManager;
    uint256 public immutable lpPercentage;
    uint8 public constant TOKEN_DECIMALS = 18;
    uint256 public constant ALLOCATION_PERCENTAGE = 80;
    uint256 public constant PERCENTAGE_BASE = 100;
    uint256 public constant PRICE_PRECISION = 1e18;

    event CreatorProposalCreated(address indexed creator, uint256 indexed proposalId, string xAccountId);
    event TokenDeployed(uint256 indexed proposalId, address token, address amm, uint256 timestamp);
    event ProposalApproved(uint256 indexed proposalId);

    error NotAuthorized();
    error InvalidParameters();
    error NotApproved();
    error TokensAlreadyDeployed();
    error TransferFailed();

    modifier onlyDAOFunding() {
        if (msg.sender != daoFunding) revert NotAuthorized();
        _;
    }

    constructor(
        address _daoStorage,
        address _daoFunding,
        address _contributionManager,
        uint256 _lpPercentage
    ) {
        daoStorage = IDAOStorage(_daoStorage);
        daoFunding = _daoFunding;
        contributionManager = _contributionManager;
        lpPercentage = _lpPercentage;
    }

    function createProposal(
        address creator,
        uint256 targetAmount,
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 tokenSupply,
        uint256 initialMarketCap,
        bool useUniswap
    ) external onlyDAOFunding returns (uint256) {
        if (!DAOLib.validateProposalParameters(targetAmount, tokenSupply, lpPercentage))
            revert InvalidParameters();

        uint256 allocationSupply = (tokenSupply * ALLOCATION_PERCENTAGE) / PERCENTAGE_BASE;
        uint256 contributionPrice = (targetAmount * PRICE_PRECISION) / allocationSupply;
        uint256 tokenPrice = DAOLib.calculateInitialTokenPrice(
            targetAmount,
            tokenSupply - allocationSupply,
            lpPercentage
        );

        if (tokenPrice < contributionPrice) revert InvalidParameters();
        
        // Validate market cap if using Uniswap
        if (useUniswap && initialMarketCap == 0) {
            // Default to targetAmount * 2 as initial market cap if not specified
            initialMarketCap = targetAmount * 2;
        }

        uint256 proposalId = daoStorage.getCurrentProposalId();
        (string memory creatorXAccountId, , , ) = daoStorage.getUserData(creator);

        IDAOStorage.ProposalBasic memory basic = IDAOStorage.ProposalBasic({
            creator: creator,
            targetAmount: targetAmount,
            currentAmount: 0,
            createdAt: block.timestamp,
            isApproved: false,
            isClosed: false,
            tokensDeployed: false,
            requestingContributors: new address[](0),
            approvedContributors: new address[](0)
        });

        IDAOStorage.ProposalToken memory token = IDAOStorage.ProposalToken({
            tokenAddress: address(0),
            ammAddress: address(0),
            uniswapPairAddress: address(0),
            tokenName: tokenName,
            tokenSymbol: tokenSymbol,
            tokenSupply: tokenSupply,
            allocationSupply: allocationSupply,
            tokenPrice: tokenPrice,
            contributionPrice: contributionPrice,
            creatorXAccountId: creatorXAccountId,
            initialMarketCap: initialMarketCap,
            useUniswap: useUniswap
        });

        daoStorage.setProposalBasic(proposalId, basic);
        daoStorage.setProposalToken(proposalId, token);

        // Update creator's proposals list
        _updateCreatorProposals(creator, proposalId);

        daoStorage.incrementProposalId();

        emit CreatorProposalCreated(creator, proposalId, creatorXAccountId);
        return proposalId;
    }

    function approveProposal(
        uint256 proposalId
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);

        if (basic.isApproved) revert NotApproved();
        if (basic.tokensDeployed) revert TokensAlreadyDeployed();

        DAOToken daoToken = new DAOToken(
            token.tokenName,
            token.tokenSymbol,
            token.tokenSupply,
            contributionManager,
            address(this),
            TOKEN_DECIMALS
        );

        SimpleAMM amm = new SimpleAMM(address(daoToken), token.tokenPrice);
        daoToken.setAMMAddress(address(amm));

        token.tokenAddress = address(daoToken);
        token.ammAddress = address(amm);
        basic.tokensDeployed = true;
        basic.isApproved = true;

        daoStorage.setProposalToken(proposalId, token);
        daoStorage.setProposalBasic(proposalId, basic);

        emit TokenDeployed(proposalId, address(daoToken), address(amm), block.timestamp);
        emit ProposalApproved(proposalId);
    }

    function _updateCreatorProposals(address creator, uint256 proposalId) internal {
        (, , , uint256[] memory createdProposals) = daoStorage.getUserData(creator);
        uint256[] memory newCreatedProposals = new uint256[](createdProposals.length + 1);
        for (uint i = 0; i < createdProposals.length; i++) {
            newCreatedProposals[i] = createdProposals[i];
        }
        newCreatedProposals[createdProposals.length] = proposalId;

        (string memory xAccountId, , , ) = daoStorage.getUserData(creator);
        IDAOStorage.User memory updatedUser = IDAOStorage.User({
            xAccountId: xAccountId,
            isRegistered: true,
            isCreator: true,
            createdProposals: newCreatedProposals
        });
        daoStorage.setUserData(creator, updatedUser);
    }
}