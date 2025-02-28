// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IDAOStorage.sol";

contract DAOStorage is IDAOStorage, Ownable {
    using Counters for Counters.Counter;

    mapping(address => bool) public authorizedContracts;
    
    // Storage variables
    mapping(address => User) private users;
    mapping(uint256 => Proposal) private proposals;
    Counters.Counter private proposalIds;

    error UnauthorizedAccess();

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        if (!authorizedContracts[msg.sender]) revert UnauthorizedAccess();
        _;
    }

    function setAuthorizedContract(address contractAddress, bool authorized) external override onlyOwner {
        authorizedContracts[contractAddress] = authorized;
    }

    function getUserData(address userAddress) external view override returns (
        string memory xAccountId,
        bool isRegistered,
        bool isCreator,
        uint256[] memory createdProposals
    ) {
        User storage user = users[userAddress];
        return (user.xAccountId, user.isRegistered, user.isCreator, user.createdProposals);
    }

    function getProposalBasic(uint256 proposalId) external view override returns (ProposalBasic memory) {
        return proposals[proposalId].basic;
    }

    function getProposalToken(uint256 proposalId) external view override returns (ProposalToken memory) {
        return proposals[proposalId].token;
    }

    function getContribution(uint256 proposalId, address contributor) external view override returns (uint256) {
        return proposals[proposalId].contributions[contributor];
    }

    function getTokenAllocation(uint256 proposalId, address contributor) external view override returns (uint256) {
        return proposals[proposalId].tokenAllocations[contributor];
    }

    function getContributorRequest(uint256 proposalId, address contributor) external view override returns (bool) {
        return proposals[proposalId].contributorRequests[contributor];
    }

    function getApprovedContributor(uint256 proposalId, address contributor) external view override returns (bool) {
        return proposals[proposalId].approvedContributors[contributor];
    }

    function getContributionLimit(uint256 proposalId, address contributor) external view override returns (uint256) {
        return proposals[proposalId].contributionLimits[contributor];
    }

    function getCurrentProposalId() external view override returns (uint256) {
        return proposalIds.current();
    }

    function incrementProposalId() external override onlyAuthorized {
        proposalIds.increment();
    }

    // Setter functions
    function setUserData(address userAddress, User calldata user) external override onlyAuthorized {
        users[userAddress].xAccountId = user.xAccountId;
        users[userAddress].isRegistered = user.isRegistered;
        users[userAddress].isCreator = user.isCreator;
        users[userAddress].createdProposals = user.createdProposals;
    }

    function setProposalBasic(uint256 proposalId, ProposalBasic calldata basic) external override onlyAuthorized {
        proposals[proposalId].basic = basic;
    }

    function setProposalToken(uint256 proposalId, ProposalToken calldata token) external override onlyAuthorized {
        proposals[proposalId].token = token;
    }

    function setContribution(uint256 proposalId, address contributor, uint256 amount) external override onlyAuthorized {
        proposals[proposalId].contributions[contributor] = amount;
    }

    function setTokenAllocation(uint256 proposalId, address contributor, uint256 amount) external override onlyAuthorized {
        proposals[proposalId].tokenAllocations[contributor] = amount;
    }

    function setContributorRequest(uint256 proposalId, address contributor, bool status) external override onlyAuthorized {
        proposals[proposalId].contributorRequests[contributor] = status;
    }

    function setApprovedContributor(uint256 proposalId, address contributor, bool status) external override onlyAuthorized {
        proposals[proposalId].approvedContributors[contributor] = status;
    }

    function setContributionLimit(uint256 proposalId, address contributor, uint256 limit) external override onlyAuthorized {
        proposals[proposalId].contributionLimits[contributor] = limit;
    }
}