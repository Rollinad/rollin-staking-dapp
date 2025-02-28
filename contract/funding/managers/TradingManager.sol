// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDAOStorage.sol";
import "../interfaces/ISimpleAMM.sol";
import "../interfaces/IDAOToken.sol";

contract TradingManager {
    IDAOStorage public immutable daoStorage;
    address public immutable daoFunding;

    error NotAuthorized();
    error NotApproved();
    error TransferFailed();
    error ProposalNotFound();

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

        ISimpleAMM(token.ammAddress).swapETHForTokens{value: msg.value}(recipient);
    }

    function swapTokensForETH(
        uint256 proposalId,
        uint256 tokenAmount,
        address recipient
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);

        if (!basic.isClosed) revert NotApproved();

        ISimpleAMM(token.ammAddress).swapTokensForETH(tokenAmount, recipient);
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

    receive() external payable {}
}