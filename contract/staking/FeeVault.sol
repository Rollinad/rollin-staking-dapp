// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FeeVault {
    using SafeERC20 for IERC20;

    // Owner address
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Must be Contract Owner to execute this function."
        );
        _;
    }

    receive() external payable {}

    fallback() external payable {}

    function withdraw() external payable onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdraw(IERC20 tokenContract) external onlyOwner {
        tokenContract.safeTransfer(
            owner,
            tokenContract.balanceOf(address(this))
        );
    }
}
