// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./core/DAOBase.sol";
import "./integrations/UniswapV3Integration.sol";
import "./managers/ContributionManager.sol";
import "./managers/ProposalManager.sol";
import "./managers/TradingManager.sol";
import "./managers/UserManager.sol";
import "./interfaces/IDAOFundingParent.sol";

interface IUniswapIntegration {
    function swapETHForTokens(address token, uint256 amountOutMin, address to) external payable returns (uint256[] memory amounts);
    function swapTokensForETH(address token, uint256 amountIn, uint256 amountOutMin, address to) external returns (uint256[] memory amounts);
}

contract DAOFunding is DAOBase, IDAOFundingParent {
    UserManager public immutable userManager;
    ProposalManager public immutable proposalManager;
    ContributionManager public immutable contributionManager;
    TradingManager public immutable tradingManager;
    /**
     * @dev UniswapIntegration contract for handling Uniswap operations.
     */
    address public immutable uniswapIntegration;
    
    address public uniswapRouter;

    event UniswapRouterUpdated(address indexed newRouter);

    constructor(
        address _daoStorage,
        uint256 _fundingPeriod,
        uint256 _lpPercentage,
        address _uniswapRouter,
        address _positionManager
    ) DAOBase(_daoStorage, _fundingPeriod, _lpPercentage, msg.sender) {
        daoStorage = IDAOStorage(_daoStorage);
        uniswapRouter = _uniswapRouter;
        
        userManager = new UserManager(_daoStorage, address(this));
        contributionManager = new ContributionManager(
            _daoStorage,
            address(this),
            _lpPercentage,
            _fundingPeriod
        );
        proposalManager = new ProposalManager(
            _daoStorage, 
            address(this), 
            address(contributionManager), 
            _lpPercentage
        );
        tradingManager = new TradingManager(_daoStorage, address(this));
        // Create and store the address of the UniswapV3Integration contract
        uniswapIntegration = address(new UniswapV3Integration(_uniswapRouter, _positionManager));
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
        uint256 tokenSupply,
        uint256 initialMarketCap,
        bool useUniswap
    ) external onlyCreator whenNotPaused {
        proposalManager.createProposal(
            msg.sender,
            targetAmount,
            tokenName,
            tokenSymbol,
            tokenSupply,
            initialMarketCap,
            useUniswap
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
    
    function swapETHForTokensViaUniswap(
        uint256 proposalId,
        uint256 amountOutMin
    ) external payable whenNotPaused proposalExists(proposalId) {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        
        if (!token.useUniswap || token.uniswapPairAddress == address(0)) {
            revert NotValidForUniswap();
        }
        
        UniswapV3Integration(payable(uniswapIntegration)).swapETHForTokens{value: msg.value}(
            token.tokenAddress,
            amountOutMin,
            msg.sender
        );
    }
    
    function swapTokensForETHViaUniswap(
        uint256 proposalId,
        uint256 tokenAmount,
        uint256 amountOutMin
    ) external whenNotPaused proposalExists(proposalId) {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        
        if (!token.useUniswap || token.uniswapPairAddress == address(0)) {
            revert NotValidForUniswap();
        }
        
        UniswapV3Integration(payable(uniswapIntegration)).swapTokensForETH(
            token.tokenAddress,
            tokenAmount,
            amountOutMin,
            msg.sender
        );
    }

    function setApprovalForTokenRefund(uint256 proposalId) external {
        tradingManager.setApprovalForTokenRefund(proposalId, msg.sender);
    }
    
    function collectUniswapFees(uint256 proposalId) external whenNotPaused proposalExists(proposalId) {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        
        if (!token.useUniswap || token.uniswapPairAddress == address(0) || token.uniswapPositionId == 0) {
            revert NotValidForUniswap();
        }
        
        // Only the proposal creator can collect fees
        if (msg.sender != daoStorage.getProposalBasic(proposalId).creator) {
            revert NotAuthorized();
        }
        
        // Collect trading fees to the caller (creator)
        UniswapV3Integration(payable(uniswapIntegration)).collectFees(
            token.tokenAddress,
            msg.sender
        );
    }
    
    function setUniswapRouter(address _uniswapRouter) external onlyOwner {
        uniswapRouter = _uniswapRouter;
        emit UniswapRouterUpdated(_uniswapRouter);
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