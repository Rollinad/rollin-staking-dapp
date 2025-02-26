// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDAOStorage.sol";
import "../core/DAOBase.sol";

contract UserManager {
    IDAOStorage public immutable daoStorage;
    address public immutable daoFunding;

    event UserRegistered(address indexed user, string xAccountId);
    event CreatorUpdated(address indexed user, string xAccountId);

    error UserAlreadyRegistered();
    error NotAuthorized();

    modifier onlyDAOFunding() {
        if (msg.sender != daoFunding) revert NotAuthorized();
        _;
    }

    constructor(address _daoStorage, address _daoFunding) {
        daoStorage = IDAOStorage(_daoStorage);
        daoFunding = _daoFunding;
    }

    function registerUser(
        address user,
        string calldata xAccountId
    ) external onlyDAOFunding {
        (, bool isRegistered, , ) = daoStorage.getUserData(user);
        if (isRegistered) revert UserAlreadyRegistered();

        IDAOStorage.User memory newUser = IDAOStorage.User({
            xAccountId: xAccountId,
            isRegistered: true,
            isCreator: false,
            createdProposals: new uint256[](0)
        });

        daoStorage.setUserData(user, newUser);
        emit UserRegistered(user, xAccountId);
    }

    function updateToCreator(
        address user,
        string calldata xAccountId
    ) external onlyDAOFunding {
        (
            ,
            bool isRegistered,
            bool isCreator,
            uint256[] memory createdProposals
        ) = daoStorage.getUserData(user);
        if (isCreator) revert UserAlreadyRegistered();

        IDAOStorage.User memory updatedUser = IDAOStorage.User({
            xAccountId: xAccountId,
            isRegistered: true,
            isCreator: true,
            createdProposals: isRegistered ? createdProposals : new uint256[](0)
        });

        daoStorage.setUserData(user, updatedUser);
        emit CreatorUpdated(user, xAccountId);
    }
}