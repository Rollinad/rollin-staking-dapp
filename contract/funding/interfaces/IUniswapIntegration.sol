// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IUniswapIntegration
 * @dev Interface for the UniswapIntegration contract
 */
interface IUniswapIntegration {
    function createPair(address token) external returns (address pair);
    
    function addLiquidity(
        address token,
        uint256 tokenAmount,
        uint256 amountETHMin,
        address to
    ) external payable returns (uint256 liquidity);
    
    function calculateInitialLiquidity(
        uint256 targetAmount,
        uint256 initialMarketCap,
        uint256 tokenSupply
    ) external pure returns (uint256 ethAmount, uint256 tokenAmount);
    
    function swapETHForTokens(
        address token,
        uint256 amountOutMin,
        address to
    ) external payable returns (uint256[] memory amounts);
    
    function swapTokensForETH(
        address token,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint256[] memory amounts);
    
    function getCurrentPrice(address token) external view returns (uint256 price);
}