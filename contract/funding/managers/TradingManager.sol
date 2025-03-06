// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDAOStorage.sol";
import "../interfaces/ISimpleAMM.sol";
import "../interfaces/IDAOToken.sol";
import "../integrations/UniswapV3Integration.sol";
import "../interfaces/IDAOFundingParent.sol";

contract TradingManager {
    IDAOStorage public immutable daoStorage;
    address public immutable daoFunding;

    error NotAuthorized();
    error NotApproved();
    error TransferFailed();
    error ProposalNotFound();
    error NotValidForUniswap();

    modifier onlyDAOFunding() {
        if (msg.sender != daoFunding) revert NotAuthorized();
        _;
    }

    constructor(address _daoStorage, address _daoFunding) {
        daoStorage = IDAOStorage(_daoStorage);
        daoFunding = _daoFunding;
    }

    function swapETHForTokens(
        uint256 proposalId,
        address recipient
    ) external payable onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);

        if (!basic.isClosed) revert NotApproved();
        
        // Use appropriate swap mechanism based on whether Uniswap is enabled
        if (token.useUniswap && token.uniswapPairAddress != address(0)) {
            // Use Uniswap integration to swap
            address uniswapAddr = IDAOFundingParent(daoFunding).uniswapIntegration();
            
            // Calculate minimum output with 2% slippage
            uint256 amountOutMin = 0; // Simple version - in production, calculate this properly
            
            UniswapV3Integration(payable(uniswapAddr)).swapETHForTokens{value: msg.value}(
                token.tokenAddress,
                amountOutMin,
                recipient
            );
        } else {
            // Use SimpleAMM as before
            ISimpleAMM(token.ammAddress).swapETHForTokens{value: msg.value}(recipient);
        }
    }

    function swapTokensForETH(
        uint256 proposalId,
        uint256 tokenAmount,
        address recipient
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);

        if (!basic.isClosed) revert NotApproved();
        
        // Use appropriate swap mechanism based on whether Uniswap is enabled
        if (token.useUniswap && token.uniswapPairAddress != address(0)) {
            // Use Uniswap integration to swap
            address uniswapAddr = IDAOFundingParent(daoFunding).uniswapIntegration();
            
            // Calculate minimum output with 2% slippage
            uint256 amountOutMin = 0; // Simple version - in production, calculate this properly
            
            // Approve tokens to be spent by the integration contract
            bool success = IDAOToken(token.tokenAddress).approve(uniswapAddr, tokenAmount);
            if (!success) revert TransferFailed();
            
            UniswapV3Integration(payable(uniswapAddr)).swapTokensForETH(
                token.tokenAddress,
                tokenAmount,
                amountOutMin,
                recipient
            );
        } else {
            // Use SimpleAMM as before
            ISimpleAMM(token.ammAddress).swapTokensForETH(tokenAmount, recipient);
        }
    }

    function setApprovalForTokenRefund(
        uint256 proposalId,
        address user
    ) external onlyDAOFunding {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        uint256 contribution = daoStorage.getContribution(proposalId, user);

        if (token.tokenAddress == address(0)) revert ProposalNotFound();

        uint256 tokenAmount = (contribution * token.tokenPrice) / 1e18;
        bool success = IDAOToken(token.tokenAddress).approve(daoFunding, tokenAmount);
        if (!success) revert TransferFailed();
    }
    
    function getCurrentTokenPrice(uint256 proposalId) external view returns (uint256) {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        
        if (token.tokenAddress == address(0)) revert ProposalNotFound();
        
        if (token.useUniswap && token.uniswapPairAddress != address(0)) {
            // Get price from Uniswap
            address uniswapAddr = IDAOFundingParent(daoFunding).uniswapIntegration();
            return UniswapV3Integration(payable(uniswapAddr)).getCurrentPrice(token.tokenAddress);
        } else if (token.ammAddress != address(0)) {
            // Get price from SimpleAMM
            return ISimpleAMM(token.ammAddress).getCurrentPrice();
        } else {
            // Return initial token price if no liquidity yet
            return token.tokenPrice;
        }
    }

    receive() external payable {}
}