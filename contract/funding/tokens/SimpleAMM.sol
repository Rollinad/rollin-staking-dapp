// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/ISimpleAMM.sol";
import "../interfaces/IDAOToken.sol";

contract SimpleAMM is ReentrancyGuard, ISimpleAMM {
    address public immutable token;
    uint256 public tokenReserve;
    uint256 public ethReserve;
    uint256 public immutable initialTokenPrice;
    uint256 private constant PRICE_PRECISION = 1e18;

    constructor(address _token, uint256 _initialTokenPrice) {
        token = _token;
        initialTokenPrice = _initialTokenPrice;
    }

    function addLiquidity() external payable override nonReentrant {
        if (msg.value == 0) revert InsufficientLiquidity();

        uint256 requiredTokens = (msg.value * PRICE_PRECISION) / initialTokenPrice;

        if (tokenReserve == 0 && ethReserve == 0) {
            _handleInitialLiquidity(requiredTokens);
        } else {
            _handleAdditionalLiquidity(msg.value);
        }

        emit LiquidityAdded(msg.value, requiredTokens);
    }

    function swapETHForTokens(address sender) external payable override nonReentrant {
        if (msg.value == 0) revert InsufficientLiquidity();
        if (tokenReserve == 0 || ethReserve == 0) revert InsufficientReserves();

        uint256 tokenOut = getTokenAmount(msg.value);
        if (tokenOut > tokenReserve) revert InsufficientReserves();

        tokenReserve -= tokenOut;
        ethReserve += msg.value;

        bool success = IDAOToken(token).transfer(sender, tokenOut);
        if (!success) revert TransferFailed();

        emit Swap(true, msg.value, tokenOut);
    }

    function swapTokensForETH(
        uint256 tokenIn,
        address sender
    ) external override nonReentrant {
        if (tokenIn == 0) revert InsufficientLiquidity();
        if (tokenReserve == 0 || ethReserve == 0) revert InsufficientReserves();

        if (IDAOToken(token).balanceOf(sender) < tokenIn)
            revert InsufficientBalance();
        if (IDAOToken(token).allowance(sender, address(this)) < tokenIn)
            revert InsufficientAllowance();

        uint256 ethOut = getEthAmount(tokenIn);
        if (ethOut > ethReserve) revert InsufficientReserves();

        tokenReserve += tokenIn;
        ethReserve -= ethOut;

        bool success = IDAOToken(token).transferFrom(sender, address(this), tokenIn);
        if (!success) revert TransferFailed();

        (bool sent, ) = payable(sender).call{value: ethOut}("");
        if (!sent) revert TransferFailed();

        emit Swap(false, tokenIn, ethOut);
    }

    function getTokenAmount(uint256 ethIn) public view override returns (uint256) {
        if (ethIn == 0) revert InsufficientLiquidity();
        if (tokenReserve == 0 || ethReserve == 0) {
            return (ethIn * PRICE_PRECISION) / initialTokenPrice;
        }

        uint256 k = tokenReserve * ethReserve;
        uint256 newEthReserve = ethReserve + ethIn;
        uint256 newTokenReserve = k / newEthReserve;
        uint256 tokenOut = tokenReserve - newTokenReserve;

        uint256 maxTokens = (ethIn * PRICE_PRECISION) / initialTokenPrice;
        return tokenOut > maxTokens ? maxTokens : tokenOut;
    }

    function getEthAmount(uint256 tokenIn) public view override returns (uint256) {
        if (tokenIn == 0) revert InsufficientLiquidity();
        if (tokenReserve == 0 || ethReserve == 0) revert InsufficientReserves();

        uint256 k = tokenReserve * ethReserve;
        uint256 newTokenReserve = tokenReserve + tokenIn;
        uint256 newEthReserve = k / newTokenReserve;
        uint256 ethOut = ethReserve - newEthReserve;

        uint256 minEthOut = (tokenIn * initialTokenPrice) / PRICE_PRECISION;
        return ethOut < minEthOut ? ethOut : minEthOut;
    }

    function getCurrentPrice() external view override returns (uint256) {
        if (tokenReserve == 0 || ethReserve == 0) return initialTokenPrice;
        return (ethReserve * PRICE_PRECISION) / tokenReserve;
    }

    function _handleInitialLiquidity(uint256 requiredTokens) private {
        address sender = msg.sender;
        
        // Get token balance and allowance
        uint256 senderBalance = IDAOToken(token).balanceOf(sender);
        uint256 senderAllowance = IDAOToken(token).allowance(sender, address(this));
        
        if (senderBalance < requiredTokens)
            revert InsufficientBalance();
        if (senderAllowance < requiredTokens)
            revert InsufficientAllowance();

        bool success = IDAOToken(token).transferFrom(
            sender,
            address(this),
            requiredTokens
        );
        if (!success) revert TransferFailed();

        tokenReserve = requiredTokens;
        ethReserve = msg.value;
    }

    function _handleAdditionalLiquidity(uint256 ethIn) private {
        uint256 tokenAmount = (ethIn * tokenReserve) / ethReserve;

        if (IDAOToken(token).balanceOf(msg.sender) < tokenAmount)
            revert InsufficientBalance();
        if (IDAOToken(token).allowance(msg.sender, address(this)) < tokenAmount)
            revert InsufficientAllowance();

        bool success = IDAOToken(token).transferFrom(
            msg.sender,
            address(this),
            tokenAmount
        );
        if (!success) revert TransferFailed();

        tokenReserve += tokenAmount;
        ethReserve += ethIn;
    }

    receive() external payable {
        // Accept ETH transfers
    }
}