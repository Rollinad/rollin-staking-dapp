// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../libraries/DAOLib.sol";
import "../interfaces/IDAOStorage.sol";
import "./DAOEvents.sol";
import "./DAOErrors.sol";

abstract contract DAOBase is DAOEvents, DAOErrors, Ownable, ReentrancyGuard, Pausable {
    uint256 public fundingPeriod;
    uint256 public lpPercentage;
    uint8 public constant TOKEN_DECIMALS = 18;
    uint256 public constant ALLOCATION_PERCENTAGE = 80;
    uint256 public constant PERCENTAGE_BASE = 100;
    uint256 public constant PRICE_PRECISION = 1e18;
    
    IDAOStorage internal immutable daoStorage;

    constructor(
        address _daoStorage,
        uint256 _fundingPeriod,
        uint256 _lpPercentage,
        address initialOwner
    ) Ownable(initialOwner) {
        if (!DAOLib.validateProposalParameters(1, 1, _lpPercentage)) 
            revert InvalidParameters();
        if (_fundingPeriod == 0) 
            revert InvalidParameters();

        daoStorage = IDAOStorage(_daoStorage);
        fundingPeriod = _fundingPeriod;
        lpPercentage = _lpPercentage;
    }

    // Common modifiers
    modifier onlyRegistered() {
        (,bool isRegistered,,) = daoStorage.getUserData(msg.sender);
        if (!isRegistered) revert UserNotRegistered();
        _;
    }

    modifier onlyCreator() {
        (,, bool isCreator,) = daoStorage.getUserData(msg.sender);
        if (!isCreator) revert NotCreator();
        _;
    }

    modifier onlyProposalCreator(uint256 proposalId) {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        if (basic.creator != msg.sender) revert NotCreator();
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        uint256 currentId = daoStorage.getCurrentProposalId();
        if (proposalId >= currentId) revert ProposalNotFound();
        _;
    }

    // Abstract functions to be implemented by child contracts
    function pause() external virtual;
    function unpause() external virtual;
}