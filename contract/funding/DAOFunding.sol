// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./core/DAOBase.sol";
import "./managers/ContributionManager.sol";
import "./managers/ProposalManager.sol";
import "./managers/TradingManager.sol";
import "./managers/UserManager.sol";

contract DAOFunding is DAOBase {
    UserManager public immutable userManager;
    ProposalManager public immutable proposalManager;
    ContributionManager public immutable contributionManager;
    TradingManager public immutable tradingManager;

    constructor(
        address _daoStorage,
        uint256 _fundingPeriod,
        uint256 _lpPercentage
    ) DAOBase(_daoStorage, _fundingPeriod, _lpPercentage, msg.sender) {
        daoStorage = IDAOStorage(_daoStorage);
        userManager = new UserManager(_daoStorage, address(this));
        contributionManager = new ContributionManager(
            _daoStorage,
            address(this),
            _lpPercentage,
            _fundingPeriod
        );
        proposalManager = new ProposalManager(_daoStorage, address(this), address(contributionManager), _lpPercentage);
        tradingManager = new TradingManager(_daoStorage, address(this));
    }

    function setAuthorizeContracts() external onlyOwner {
        daoStorage.setAuthorizedContract(address(userManager), true);
        daoStorage.setAuthorizedContract(address(contributionManager), true);
        daoStorage.setAuthorizedContract(address(proposalManager), true);
        daoStorage.setAuthorizedContract(address(tradingManager), true);
    }

    function registerUser(string calldata xAccountId) external whenNotPaused {
        userManager.registerUser(msg.sender, xAccountId);
    }

    function updateToCreator(string calldata xAccountId) external whenNotPaused {
        userManager.updateToCreator(msg.sender, xAccountId);
    }

    function createProposal(
        uint256 targetAmount,
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 tokenSupply
    ) external onlyCreator whenNotPaused {
        proposalManager.createProposal(
            msg.sender,
            targetAmount,
            tokenName,
            tokenSymbol,
            tokenSupply
        );
    }

    function approveProposal(
        uint256 proposalId
    ) external onlyOwner proposalExists(proposalId) whenNotPaused {
        proposalManager.approveProposal(proposalId);
    }

    function requestToContribute(
        uint256 proposalId
    ) external onlyRegistered proposalExists(proposalId) whenNotPaused {
        contributionManager.requestToContribute(proposalId, msg.sender);
    }

    function approveContributor(
        uint256 proposalId,
        address contributor,
        uint256 contributionLimit
    ) external onlyProposalCreator(proposalId) proposalExists(proposalId) whenNotPaused {
        contributionManager.approveContributor(proposalId, contributor, contributionLimit);
    }

    function contribute(
        uint256 proposalId
    ) external payable onlyRegistered proposalExists(proposalId) whenNotPaused {
        contributionManager.contribute{ value: msg.value }(proposalId, msg.sender, msg.value);
    }

    function releaseFunds(
        uint256 proposalId
    ) external onlyProposalCreator(proposalId) whenNotPaused {
        contributionManager.releaseFunds(proposalId);
    }

    function withdrawContribution(
        uint256 proposalId
    ) external nonReentrant whenNotPaused {
        contributionManager.withdrawContribution(proposalId, msg.sender);
    }

    function swapETHForTokens(
        uint256 proposalId
    ) external payable whenNotPaused proposalExists(proposalId) {
        tradingManager.swapETHForTokens{value: msg.value}(proposalId, msg.sender);
    }

    function swapTokensForETH(
        uint256 proposalId,
        uint256 tokenAmount
    ) external whenNotPaused proposalExists(proposalId) {
        tradingManager.swapTokensForETH(proposalId, tokenAmount, msg.sender);
    }

    function setApprovalForTokenRefund(uint256 proposalId) external {
        tradingManager.setApprovalForTokenRefund(proposalId, msg.sender);
    }

    function setFundingPeriod(uint256 _fundingPeriod) external onlyOwner {
        if (_fundingPeriod == 0) revert InvalidParameters();
        fundingPeriod = _fundingPeriod;
    }

    function setLPPercentage(uint256 _lpPercentage) external onlyOwner {
        if (!DAOLib.validateProposalParameters(1, 1, _lpPercentage))
            revert InvalidParameters();
        lpPercentage = _lpPercentage;
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    receive() external payable {}
}