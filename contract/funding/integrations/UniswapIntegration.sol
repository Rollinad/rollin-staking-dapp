// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "../interfaces/IUniswapV2Pair.sol";
import "../interfaces/IDAOToken.sol";

contract UniswapIntegration is ReentrancyGuard {
    address public immutable uniswapRouter;
    address public immutable uniswapFactory;
    address public immutable weth;
    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant DEADLINE_EXTENSION = 20 minutes;

    event PairCreated(address indexed token, address indexed pair);
    event LiquidityAdded(address indexed token, uint256 ethAmount, uint256 tokenAmount, uint256 liquidity);
    
    error TransferFailed();
    error PairCreationFailed();
    error InsufficientLiquidity();
    error InsufficientTokenBalance();
    error InsufficientAllowance();
    error RouterCallFailed();

    constructor(address _uniswapRouter) {
        uniswapRouter = _uniswapRouter;
        uniswapFactory = IUniswapV2Router02(_uniswapRouter).factory();
        weth = IUniswapV2Router02(_uniswapRouter).WETH();
    }
    
    /**
     * @dev Creates a new Uniswap pair for a token with ETH/WETH
     * @param token Address of the token
     * @return pair Address of the created pair
     */
    function createPair(address token) external returns (address pair) {
        pair = IUniswapV2Factory(uniswapFactory).getPair(token, weth);
        
        if (pair == address(0)) {
            pair = IUniswapV2Factory(uniswapFactory).createPair(token, weth);
            if (pair == address(0)) revert PairCreationFailed();
            emit PairCreated(token, pair);
        }
        
        return pair;
    }
    
    /**
     * @dev Adds liquidity to Uniswap for a token/ETH pair
     * @param token Address of the token
     * @param tokenAmount Amount of tokens to add as liquidity
     * @param amountETHMin Minimum amount of ETH to add (slippage protection)
     * @param to Address to send the LP tokens to
     * @return liquidity Amount of LP tokens received
     */
    function addLiquidity(
        address token,
        uint256 tokenAmount,
        uint256 amountETHMin,
        address to
    ) external payable nonReentrant returns (uint256 liquidity) {
        if (msg.value == 0) revert InsufficientLiquidity();
        
        // Check token balance and allowance
        if (IDAOToken(token).balanceOf(msg.sender) < tokenAmount) revert InsufficientTokenBalance();
        if (IDAOToken(token).allowance(msg.sender, address(this)) < tokenAmount) revert InsufficientAllowance();
        
        // Transfer tokens to this contract first
        bool success = IDAOToken(token).transferFrom(msg.sender, address(this), tokenAmount);
        if (!success) revert TransferFailed();
        
        // Approve router to spend tokens
        success = IDAOToken(token).approve(uniswapRouter, tokenAmount);
        if (!success) revert TransferFailed();
        
        // Add liquidity to Uniswap
        uint256 amountTokenMin = tokenAmount * 95 / 100; // 5% slippage tolerance
        
        try IUniswapV2Router02(uniswapRouter).addLiquidityETH{value: msg.value}(
            token,
            tokenAmount,
            amountTokenMin,
            amountETHMin,
            to,
            block.timestamp + DEADLINE_EXTENSION
        ) returns (uint256 amountToken, uint256 amountETH, uint256 liquidityOut) {
            emit LiquidityAdded(token, amountETH, amountToken, liquidityOut);
            return liquidityOut;
        } catch {
            revert RouterCallFailed();
        }
    }
    
    /**
     * @dev Calculates optimal liquidity amounts based on desired market cap
     * @param targetAmount Total funding amount raised
     * @param initialMarketCap Desired initial market cap
     * @param tokenSupply Total token supply
     * @return ethAmount Amount of ETH to add as liquidity
     * @return tokenAmount Amount of tokens to add as liquidity
     */
    function calculateInitialLiquidity(
        uint256 targetAmount,
        uint256 initialMarketCap,
        uint256 tokenSupply
    ) external pure returns (uint256 ethAmount, uint256 tokenAmount) {
        if (initialMarketCap == 0) {
            // Default to 50% of raised funds as ETH liquidity
            ethAmount = targetAmount / 2;
        } else {
            // Use specified market cap, but cap at 80% of raised funds
            ethAmount = initialMarketCap < targetAmount * 8 / 10 
                      ? initialMarketCap / 2 
                      : targetAmount * 4 / 10;
        }
        
        // Calculate token price from desired market cap
        uint256 tokenPrice = (initialMarketCap * PRICE_PRECISION) / tokenSupply;
        
        // Calculate tokens needed based on ETH amount and token price
        tokenAmount = (ethAmount * PRICE_PRECISION) / tokenPrice;
        
        return (ethAmount, tokenAmount);
    }
    
    /**
     * @dev Swaps ETH for tokens
     * @param token Address of the token to receive
     * @param amountOutMin Minimum amount of tokens to receive
     * @param to Address to receive the tokens
     * @return amounts Amount of ETH sent and tokens received
     */
    function swapETHForTokens(
        address token,
        uint256 amountOutMin,
        address to
    ) external payable returns (uint256[] memory amounts) {
        address[] memory path = new address[](2);
        path[0] = weth;
        path[1] = token;
        
        return IUniswapV2Router02(uniswapRouter).swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            to,
            block.timestamp + DEADLINE_EXTENSION
        );
    }
    
    /**
     * @dev Swaps tokens for ETH
     * @param token Address of the token to swap
     * @param amountIn Amount of tokens to swap
     * @param amountOutMin Minimum amount of ETH to receive
     * @param to Address to receive the ETH
     * @return amounts Amount of tokens sent and ETH received
     */
    function swapTokensForETH(
        address token,
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint256[] memory amounts) {
        // Check token balance and allowance
        if (IDAOToken(token).balanceOf(msg.sender) < amountIn) revert InsufficientTokenBalance();
        if (IDAOToken(token).allowance(msg.sender, address(this)) < amountIn) revert InsufficientAllowance();
        
        // Transfer tokens to this contract first
        bool success = IDAOToken(token).transferFrom(msg.sender, address(this), amountIn);
        if (!success) revert TransferFailed();
        
        // Approve router to spend tokens
        success = IDAOToken(token).approve(uniswapRouter, amountIn);
        if (!success) revert TransferFailed();
        
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = weth;
        
        return IUniswapV2Router02(uniswapRouter).swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            to,
            block.timestamp + DEADLINE_EXTENSION
        );
    }
    
    /**
     * @dev Gets the current token price from Uniswap
     * @param token Address of the token
     * @return price Current token price in ETH
     */
    function getCurrentPrice(address token) external view returns (uint256 price) {
        address pair = IUniswapV2Factory(uniswapFactory).getPair(token, weth);
        if (pair == address(0)) return 0;
        
        (uint112 reserve0, uint112 reserve1, ) = IUniswapV2Pair(pair).getReserves();
        
        address token0 = IUniswapV2Pair(pair).token0();
        
        if (token0 == token) {
            return (uint256(reserve1) * PRICE_PRECISION) / uint256(reserve0);
        } else {
            return (uint256(reserve0) * PRICE_PRECISION) / uint256(reserve1);
        }
    }
    
    receive() external payable {}
}