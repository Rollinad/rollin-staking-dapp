// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDAOStorage {
    // Structs
    struct User {
        string xAccountId;
        bool isRegistered;
        bool isCreator;
        uint256[] createdProposals;
    }

    struct Proposal {
        ProposalBasic basic;
        ProposalToken token;
        mapping(address => uint256) contributions;
        mapping(address => uint256) tokenAllocations;
        mapping(address => bool) contributorRequests;
        mapping(address => bool) approvedContributors;
        mapping(address => uint256) contributionLimits;
    }

    struct ProposalBasic {
        address creator;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 createdAt;
        bool isApproved;
        bool isClosed;
        bool tokensDeployed;
        address[] requestingContributors;
        address[] approvedContributors;
    }

    struct ProposalToken {
        address tokenAddress;
        address ammAddress;         // SimpleAMM address
        address uniswapPairAddress; // Uniswap pair address
        string tokenName;
        string tokenSymbol;
        uint256 tokenSupply;
        uint256 allocationSupply;
        uint256 tokenPrice;
        uint256 contributionPrice;
        string creatorXAccountId;
        uint256 initialMarketCap;   // Initial market cap for Uniswap bonding curve
        bool useUniswap;            // Whether to deploy to Uniswap when funding target is reached
    }

    struct ContributorInfo {
        address contributorAddress;
        bool hasRequested;
        bool isApproved;
        uint256 contributionLimit;
        uint256 currentContribution;
    }

    struct ProposalView {
        address creator;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 createdAt;
        bool isApproved;
        bool isClosed;
        bool tokensDeployed;
        string tokenName;
        string tokenSymbol;
        uint256 tokenSupply;
        uint256 allocationSupply;
        uint256 tokenPrice;
        uint256 contributionPrice;
        string creatorXAccountId;
        address tokenAddress;
        address ammAddress;
    }

    // Function declarations
    function getUserData(
        address userAddress
    )
        external
        view
        returns (
            string memory xAccountId,
            bool isRegistered,
            bool isCreator,
            uint256[] memory createdProposals
        );

    function getProposalBasic(
        uint256 proposalId
    ) external view returns (ProposalBasic memory);
    function getProposalToken(
        uint256 proposalId
    ) external view returns (ProposalToken memory);
    function getContribution(
        uint256 proposalId,
        address contributor
    ) external view returns (uint256);
    function getTokenAllocation(
        uint256 proposalId,
        address contributor
    ) external view returns (uint256);
    function getContributorRequest(
        uint256 proposalId,
        address contributor
    ) external view returns (bool);
    function getApprovedContributor(
        uint256 proposalId,
        address contributor
    ) external view returns (bool);
    function getContributionLimit(
        uint256 proposalId,
        address contributor
    ) external view returns (uint256);
    function getCurrentProposalId() external view returns (uint256);
    function incrementProposalId() external;

    // Storage modification functions
    function setAuthorizedContract(address contractAddress, bool authorized) external;
    function setUserData(address userAddress, User calldata user) external;
    function setProposalBasic(
        uint256 proposalId,
        ProposalBasic calldata basic
    ) external;
    function setProposalToken(
        uint256 proposalId,
        ProposalToken calldata token
    ) external;
    function setContribution(
        uint256 proposalId,
        address contributor,
        uint256 amount
    ) external;
    function setTokenAllocation(
        uint256 proposalId,
        address contributor,
        uint256 amount
    ) external;
    function setContributorRequest(
        uint256 proposalId,
        address contributor,
        bool status
    ) external;
    function setApprovedContributor(
        uint256 proposalId,
        address contributor,
        bool status
    ) external;
    function setContributionLimit(
        uint256 proposalId,
        address contributor,
        uint256 limit
    ) external;
}
