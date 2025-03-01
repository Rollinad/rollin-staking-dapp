// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISimpleAMM {
    event LiquidityAdded(uint256 ethAmount, uint256 tokenAmount);
    event Swap(bool isEthToToken, uint256 inputAmount, uint256 outputAmount);

    error InsufficientLiquidity();
    error InsufficientReserves();
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferFailed();

    function addLiquidity() external payable;
    function swapETHForTokens(address sender) external payable;
    function swapTokensForETH(uint256 tokenIn, address sender) external;
    function getCurrentPrice() external view returns (uint256);
    function getTokenAmount(uint256 ethIn) external view returns (uint256);
    function getEthAmount(uint256 tokenIn) external view returns (uint256);
}