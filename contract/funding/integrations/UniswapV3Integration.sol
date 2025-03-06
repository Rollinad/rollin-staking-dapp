// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../interfaces/IUniswapV3Factory.sol";
import "../interfaces/IUniswapV3Pool.sol";
import "../interfaces/ISwapRouter.sol";
import "../interfaces/INonfungiblePositionManager.sol";
import "../interfaces/IDAOToken.sol";
import "../interfaces/IDAOFundingParent.sol";

/// @title UniswapV3Integration
/// @notice Contract that integrates with Uniswap V3 for creating pools, providing liquidity, and swapping tokens
contract UniswapV3Integration is ReentrancyGuard, IERC721Receiver {
    address public immutable swapRouter;
    address public immutable positionManager;
    address public immutable factory;
    address public immutable weth;
    
    // Default fee tier (0.3%)
    uint24 public constant DEFAULT_FEE_TIER = 3000;
    
    // Alternate fee tiers
    uint24 public constant LOW_FEE_TIER = 500;     // 0.05%
    uint24 public constant HIGH_FEE_TIER = 10000;  // 1%
    
    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant DEADLINE_EXTENSION = 20 minutes;
    
    // Track position NFTs owned by this contract
    mapping(uint256 => bool) public positionNFTs;
    
    // Map token address to its position ID
    mapping(address => uint256) public tokenPositions;
    
    event PoolCreated(address indexed token, address indexed pool, uint24 fee);
    event LiquidityAdded(
        address indexed token, 
        uint256 ethAmount, 
        uint256 tokenAmount, 
        uint256 positionId,
        int24 tickLower,
        int24 tickUpper
    );
    event FeesCollected(address indexed token, uint256 ethAmount, uint256 tokenAmount);
    
    error TransferFailed();
    error PoolCreationFailed();
    error InsufficientLiquidity();
    error InsufficientTokenBalance();
    error InsufficientAllowance();
    error RouterCallFailed();
    error InvalidPoolAddress();
    error PositionNotFound();

    constructor(address _swapRouter, address _positionManager, address _factory, address _weth) {
        swapRouter = _swapRouter;
        factory = _factory;
        weth = _weth;
        positionManager = _positionManager;
    }
    
    /// @notice Implementation of IERC721Receiver for receiving position NFTs
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        // Only accept NFTs from the position manager
        if (msg.sender != positionManager) revert TransferFailed();
        
        // Mark this position as owned by this contract
        positionNFTs[tokenId] = true;
        
        // Return the selector to indicate success
        return IERC721Receiver.onERC721Received.selector;
    }
    
    /// @notice Creates a Uniswap V3 pool for a token with ETH/WETH
    /// @param token Address of the token
    /// @param feeTier Optional fee tier to use (default is 0.3%)
    /// @return pool Address of the created pool
    function createPool(
        address token, 
        uint24 feeTier
    ) external returns (address pool) {
        // If no fee tier provided, use the default 0.3%
        if (feeTier == 0) {
            feeTier = DEFAULT_FEE_TIER;
        }
        
        // Try to get the existing pool
        pool = IUniswapV3Factory(factory).getPool(token, weth, feeTier);
        
        // If pool doesn't exist, create it
        if (pool == address(0)) {
            // Create the pool using the position manager
            uint160 sqrtPriceX96 = 79228162514264337593543950336; // 1:1 price
            
            try INonfungiblePositionManager(positionManager).createAndInitializePoolIfNecessary(
                token,
                weth,
                feeTier,
                sqrtPriceX96
            ) returns (address newPool) {
                pool = newPool;
                if (pool == address(0)) revert PoolCreationFailed();
                emit PoolCreated(token, pool, feeTier);
            } catch {
                revert PoolCreationFailed();
            }
        }
        
        return pool;
    }
    
    /// @notice Adds liquidity to Uniswap V3 for a token/ETH pair
    /// @param token Address of the token
    /// @param tokenAmount Amount of tokens to add as liquidity
    /// @param amountETHMin Minimum amount of ETH to add (slippage protection)
    /// @param recipient Address to send the position NFT to (typically the creator)
    /// @return positionId ID of the created position NFT
    function addLiquidity(
        address token,
        uint256 tokenAmount,
        uint256 amountETHMin,
        address recipient
    ) external payable nonReentrant returns (uint256 positionId) {
        if (msg.value == 0) revert InsufficientLiquidity();
        
        // Check token balance and allowance
        if (IDAOToken(token).balanceOf(msg.sender) < tokenAmount) revert InsufficientTokenBalance();
        if (IDAOToken(token).allowance(msg.sender, address(this)) < tokenAmount) revert InsufficientAllowance();
        
        // Transfer tokens to this contract first
        bool success = IDAOToken(token).transferFrom(msg.sender, address(this), tokenAmount);
        if (!success) revert TransferFailed();
        
        // Approve position manager to spend tokens
        success = IDAOToken(token).approve(positionManager, tokenAmount);
        if (!success) revert TransferFailed();
        
        // Create pool if it doesn't exist
        address pool = this.createPool(token, DEFAULT_FEE_TIER);
        if (pool == address(0)) revert InvalidPoolAddress();
        
        // Get the current price to center our position around it
        IUniswapV3Pool uniPool = IUniswapV3Pool(pool);
        (uint160 sqrtPriceX96, int24 currentTick,,,,, ) = uniPool.slot0();
        
        // Calculate ticks for position
        // For initial liquidity, create a position with a wide range (50% below and 100% above current price)
        int24 tickSpacing = uniPool.tickSpacing();
        int24 tickLower = (currentTick - (60 * tickSpacing)) / tickSpacing * tickSpacing;
        int24 tickUpper = (currentTick + (120 * tickSpacing)) / tickSpacing * tickSpacing;
        
        try INonfungiblePositionManager(positionManager).mint(
            INonfungiblePositionManager.MintParams({
                token0: token < weth ? token : weth,
                token1: token < weth ? weth : token,
                fee: DEFAULT_FEE_TIER,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: token < weth ? tokenAmount : msg.value,
                amount1Desired: token < weth ? msg.value : tokenAmount,
                amount0Min: token < weth ? tokenAmount * 95 / 100 : amountETHMin,
                amount1Min: token < weth ? amountETHMin : tokenAmount * 95 / 100,
                recipient: address(this), // Position NFT initially goes to this contract
                deadline: block.timestamp + DEADLINE_EXTENSION
            })
        ) returns (
            uint256 newPositionId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        ) {
            // Store the position ID
            positionId = newPositionId;
            positionNFTs[positionId] = true;
            tokenPositions[token] = positionId;
            
            // Track the amounts actually used
            uint256 ethUsed = token < weth ? amount1 : amount0;
            uint256 tokensUsed = token < weth ? amount0 : amount1;
            
            // Refund any unused ETH
            if (ethUsed < msg.value) {
                (bool sent, ) = payable(msg.sender).call{value: msg.value - ethUsed}("");
                if (!sent) revert TransferFailed();
            }
            
            emit LiquidityAdded(token, ethUsed, tokensUsed, positionId, tickLower, tickUpper);
            
            // Transfer the position NFT to the recipient if different from this contract
            if (recipient != address(this)) {
                INonfungiblePositionManager(positionManager).safeTransferFrom(
                    address(this),
                    recipient,
                    positionId
                );
                // Update tracking
                positionNFTs[positionId] = false;
            }
            
            return positionId;
        } catch {
            revert RouterCallFailed();
        }
    }
    
    /// @notice Collects accumulated fees from a position
    /// @param token Address of the token to identify the position
    /// @param recipient Address to receive the fees
    /// @return amount0 Amount of token0 fees collected
    /// @return amount1 Amount of token1 fees collected
    function collectFees(
        address token,
        address recipient
    ) external returns (uint256 amount0, uint256 amount1) {
        uint256 positionId = tokenPositions[token];
        if (positionId == 0 || !positionNFTs[positionId]) revert PositionNotFound();
        
        try INonfungiblePositionManager(positionManager).collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: positionId,
                recipient: recipient,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        ) returns (uint256 collected0, uint256 collected1) {
            emit FeesCollected(token, token < weth ? collected1 : collected0, token < weth ? collected0 : collected1);
            return (collected0, collected1);
        } catch {
            revert RouterCallFailed();
        }
    }
    
    /// @notice Calculates initial liquidity amounts based on desired market cap
    /// @param targetAmount Total funding amount raised
    /// @param initialMarketCap Desired initial market cap
    /// @param tokenSupply Total token supply
    /// @return ethAmount Amount of ETH to add as liquidity
    /// @return tokenAmount Amount of tokens to add as liquidity
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
    
    /// @notice Swaps ETH for tokens through Uniswap V3
    /// @param token Address of the token to receive
    /// @param amountOutMin Minimum amount of tokens to receive
    /// @param recipient Address to receive the tokens
    /// @return amountOut Amount of tokens received
    function swapETHForTokens(
        address token,
        uint256 amountOutMin,
        address recipient
    ) external payable returns (uint256 amountOut) {
        if (msg.value == 0) revert InsufficientLiquidity();
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: weth,
            tokenOut: token,
            fee: DEFAULT_FEE_TIER,
            recipient: recipient,
            deadline: block.timestamp + DEADLINE_EXTENSION,
            amountIn: msg.value,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });
        
        try ISwapRouter(swapRouter).exactInputSingle{value: msg.value}(params) returns (uint256 amount) {
            return amount;
        } catch {
            revert RouterCallFailed();
        }
    }
    
    /// @notice Swaps tokens for ETH through Uniswap V3
    /// @param token Address of the token to swap
    /// @param amountIn Amount of tokens to swap
    /// @param amountOutMin Minimum amount of ETH to receive
    /// @param recipient Address to receive the ETH
    /// @return amountOut Amount of ETH received
    function swapTokensForETH(
        address token,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient
    ) external returns (uint256 amountOut) {
        // Check token balance and allowance
        if (IDAOToken(token).balanceOf(msg.sender) < amountIn) revert InsufficientTokenBalance();
        if (IDAOToken(token).allowance(msg.sender, address(this)) < amountIn) revert InsufficientAllowance();
        
        // Transfer tokens to this contract first
        bool success = IDAOToken(token).transferFrom(msg.sender, address(this), amountIn);
        if (!success) revert TransferFailed();
        
        // Approve router to spend tokens
        success = IDAOToken(token).approve(swapRouter, amountIn);
        if (!success) revert TransferFailed();
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: token,
            tokenOut: weth,
            fee: DEFAULT_FEE_TIER,
            recipient: recipient,
            deadline: block.timestamp + DEADLINE_EXTENSION,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });
        
        try ISwapRouter(swapRouter).exactInputSingle(params) returns (uint256 amount) {
            return amount;
        } catch {
            revert RouterCallFailed();
        }
    }
    
    /// @notice Gets the current token price in ETH from Uniswap V3
    /// @param token Address of the token
    /// @return price Current token price in ETH
    function getCurrentPrice(address token) external view returns (uint256 price) {
        // Find the pool with the default fee tier first
        address pool = IUniswapV3Factory(factory).getPool(token, weth, DEFAULT_FEE_TIER);
        
        // If no pool with default fee, try other tiers
        if (pool == address(0)) {
            pool = IUniswapV3Factory(factory).getPool(token, weth, LOW_FEE_TIER);
            if (pool == address(0)) {
                pool = IUniswapV3Factory(factory).getPool(token, weth, HIGH_FEE_TIER);
                if (pool == address(0)) return 0; // No pool exists
            }
        }
        
        // Get the current price from the pool
        IUniswapV3Pool uniPool = IUniswapV3Pool(pool);
        (uint160 sqrtPriceX96,,,,,,) = uniPool.slot0();
        
        // Convert sqrtPriceX96 to regular price
        // For token0/token1 price: sqrtPriceX96^2 / 2^192
        uint256 priceX96Squared = uint256(sqrtPriceX96) * uint256(sqrtPriceX96);
        uint256 baseUnit = 1 << 192; // 2^192
        
        if (token < weth) {
            // Token is token0, so price = 1/priceX96Squared
            return (baseUnit * PRICE_PRECISION) / priceX96Squared;
        } else {
            // Token is token1, so price = priceX96Squared
            return (priceX96Squared * PRICE_PRECISION) / baseUnit;
        }
    }
    
    receive() external payable {}
}