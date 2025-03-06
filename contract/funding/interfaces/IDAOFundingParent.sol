// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IDAOFundingParent
 * @dev Interface for accessing main DAOFunding contract methods from manager contracts
 */
interface IDAOFundingParent {
    /**
     * @dev Returns the address of the Uniswap integration contract
     */
    function uniswapIntegration() external view returns (address);
}