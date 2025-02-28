// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDAOStorage.sol";
import "./libraries/DAOViewLib.sol";
import "./libraries/DAOLib.sol";
import "./tokens/SimpleAMM.sol";
import "./core/DAOErrors.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DAOView is Ownable, DAOErrors {
    using DAOViewLib for IDAOStorage.ProposalBasic;
    using DAOLib for IDAOStorage.ProposalBasic;

    IDAOStorage private immutable daoStorage;
    address public daoFunding;
    uint256 public fundingPeriod;
    
    error NotDAO();

    constructor(address _daoStorage, address _daoFunding, uint256 _fundingPeriod) Ownable(msg.sender) {
        daoStorage = IDAOStorage(_daoStorage);
        daoFunding = _daoFunding;
        fundingPeriod = _fundingPeriod;
    }

    modifier onlyDAO() {
        if(msg.sender != daoFunding) revert NotDAO();
        _;
    }

    function setFundingPeriod(uint256 _fundingPeriod) external onlyOwner {
        if (_fundingPeriod == 0) revert InvalidParameters();
        fundingPeriod = _fundingPeriod;
    }

    function _getCurrentProposalId() internal view returns (uint256) {
        return daoStorage.getCurrentProposalId();
    }

    function getCreatorInfo(address creator) external view returns (
        string memory xAccountId,
        bool isRegistered,
        bool isCreator,
        uint256[] memory proposalIds
    ) {
        return daoStorage.getUserData(creator);
    }

    function getContributorsCounts(uint256 proposalId) external view returns (
        uint256 requestingCount,
        uint256 approvedCount
    ) {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        requestingCount = basic.requestingContributors.length;
        approvedCount = basic.approvedContributors.length;
    }

    function getTotalProposals() external view returns (uint256) {
        return _getCurrentProposalId();
    }

    function getRequestingContributorsPaginated(
        uint256 proposalId,
        uint256 offset,
        uint256 limit
    ) external view returns (IDAOStorage.ContributorInfo[] memory list, uint256 total) {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        return DAOViewLib.getPaginatedList(
            daoStorage,
            proposalId,
            basic.requestingContributors,
            offset,
            limit
        );
    }

    function getApprovedContributorsPaginated(
        uint256 proposalId,
        uint256 offset,
        uint256 limit
    ) external view returns (IDAOStorage.ContributorInfo[] memory list, uint256 total) {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        return DAOViewLib.getPaginatedList(
            daoStorage,
            proposalId,
            basic.approvedContributors,
            offset,
            limit
        );
    }

    function getProposalsPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (IDAOStorage.ProposalView[] memory list, uint256 total) {
        total = _getCurrentProposalId();

        if (offset >= total || limit == 0) {
            return (new IDAOStorage.ProposalView[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        uint256 length = end - offset;

        list = new IDAOStorage.ProposalView[](length);
        for (uint256 i = 0; i < length; i++) {
            list[i] = DAOViewLib.combineProposalView(daoStorage, offset + i);
        }

        return (list, total);
    }

    function getProposalsByCreator(address creator) external view returns (IDAOStorage.ProposalView[] memory) {
        (,,,uint256[] memory creatorProposals) = daoStorage.getUserData(creator);
        IDAOStorage.ProposalView[] memory list = new IDAOStorage.ProposalView[](creatorProposals.length);

        for (uint256 i = 0; i < creatorProposals.length; i++) {
            list[i] = DAOViewLib.combineProposalView(daoStorage, creatorProposals[i]);
        }

        return list;
    }

    function getFilteredProposals(
        bool onlyActive,
        bool onlyApproved
    ) external view returns (IDAOStorage.ProposalView[] memory) {
        uint256 total = _getCurrentProposalId();
        uint256[] memory validIndexes = new uint256[](total);
        uint256 count = 0;

        for (uint256 i = 0; i < total; i++) {
            IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(i);
            bool isValid = true;

            if (onlyActive && basic.isClosed) {
                isValid = false;
            }
            if (onlyApproved && !basic.isApproved) {
                isValid = false;
            }

            if (isValid) {
                validIndexes[count] = i;
                count++;
            }
        }

        IDAOStorage.ProposalView[] memory result = new IDAOStorage.ProposalView[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = DAOViewLib.combineProposalView(daoStorage, validIndexes[i]);
        }

        return result;
    }

    function getContributionInfo(
        uint256 proposalId,
        address contributor
    ) external view returns (
        uint256 limit,
        uint256 currentContribution,
        uint256 tokenAllocation,
        bool isApproved,
        bool hasRequested
    ) {
        limit = daoStorage.getContributionLimit(proposalId, contributor);
        currentContribution = daoStorage.getContribution(proposalId, contributor);
        tokenAllocation = daoStorage.getTokenAllocation(proposalId, contributor);
        isApproved = daoStorage.getApprovedContributor(proposalId, contributor);
        hasRequested = daoStorage.getContributorRequest(proposalId, contributor);
    }

    function getCurrentTokenPrice(uint256 proposalId) external view returns (uint256) {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        if(token.ammAddress == address(0)) revert();
        return ISimpleAMM(token.ammAddress).getCurrentPrice();
    }

    function getProposalBasicDetails(
        uint256 proposalId
    ) external view returns (
        address creator,
        uint256 targetAmount,
        uint256 currentAmount,
        uint256 createdAt,
        bool isApproved,
        bool isClosed,
        bool tokensDeployed
    ) {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        return (
            basic.creator,
            basic.targetAmount,
            basic.currentAmount,
            basic.createdAt,
            basic.isApproved,
            basic.isClosed,
            basic.tokensDeployed
        );
    }

    function getProposalTokenDetails(
        uint256 proposalId
    ) external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint256 tokenSupply,
        uint256 tokenPrice,
        address tokenAddress,
        address ammAddress,
        string memory creatorXAccountId
    ) {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        return (
            token.tokenName,
            token.tokenSymbol,
            token.tokenSupply,
            token.tokenPrice,
            token.tokenAddress,
            token.ammAddress,
            token.creatorXAccountId
        );
    }

    function getTokenBalance(uint256 proposalId) external view returns (uint256) {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        if(token.tokenAddress == address(0)) revert();
        return IERC20(token.tokenAddress).balanceOf(msg.sender);
    }

    function getAddressTokenBalance(
        uint256 proposalId,
        address account
    ) external view returns (uint256) {
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        if(token.tokenAddress == address(0)) revert();
        return IERC20(token.tokenAddress).balanceOf(account);
    }

    function getProposalStatus(
        uint256 proposalId
    )
        external
        view
        returns (
            bool isActive,
            bool hasMetTarget,
            uint256 timeRemaining,
            uint256 percentageComplete
        )
    {
        IDAOStorage.ProposalBasic memory proposalBasic = daoStorage.getProposalBasic(proposalId);
        return DAOViewLib.getProposalStatus(proposalBasic, fundingPeriod);
    }
}