// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IDAOToken.sol";

contract DAOToken is ERC20, Pausable, IDAOToken {
    address public immutable contributionManager;
    address public immutable proposalManager;
    uint8 private immutable _tokenDecimals;
    address private ammAddress;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _contributionManager,
        address _proposalManager,
        uint8 tokenDecimals
    ) ERC20(name, symbol) {
        contributionManager = _contributionManager;
        proposalManager = _proposalManager;
        _tokenDecimals = tokenDecimals;
        _mint(_contributionManager, initialSupply);
    }

    function setAMMAddress(address _ammAddress) external override {
        require(msg.sender == contributionManager || msg.sender == proposalManager, "Only DAO or Proposal Manager can set AMM");
        require(ammAddress == address(0), "AMM already set");
        ammAddress = _ammAddress;
    }

    function transfer(
        address to,
        uint256 amount
    ) public virtual override(ERC20, IDAOToken) returns (bool) {
        bool success = super.transfer(to, amount);
        if (success && ammAddress != address(0)) {
            if (to != ammAddress && to != contributionManager) {
                _approve(to, ammAddress, type(uint256).max);
                _approve(to, contributionManager, type(uint256).max);
            }
        }
        return success;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override(ERC20, IDAOToken) returns (bool) {
        _approve(from, contributionManager, amount);
        bool success = super.transferFrom(from, to, amount);
        if (success && ammAddress != address(0)) {
            if (to != ammAddress && to != contributionManager) {
                _approve(to, ammAddress, type(uint256).max);
                _approve(to, contributionManager, type(uint256).max);
            }
        }
        return success;
    }

    function approve(
        address spender,
        uint256 amount
    ) public virtual override(ERC20, IDAOToken) returns (bool) {
        return super.approve(spender, amount);
    }

    function balanceOf(
        address account
    ) public view virtual override(ERC20, IDAOToken) returns (uint256) {
        return super.balanceOf(account);
    }

    function allowance(
        address owner,
        address spender
    ) public view virtual override(ERC20, IDAOToken) returns (uint256) {
        return super.allowance(owner, spender);
    }

    function decimals() public view override returns (uint8) {
        return _tokenDecimals;
    }

    function pause() external {
        require(msg.sender == contributionManager, "Only DAO can pause");
        _pause();
    }

    function unpause() external {
        require(msg.sender == contributionManager, "Only DAO can unpause");
        _unpause();
    }
}