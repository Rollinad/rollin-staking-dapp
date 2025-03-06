// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IDAOStorage.sol";
import "../libraries/DAOLib.sol";
import "../tokens/DAOToken.sol";
import "../tokens/SimpleAMM.sol";
import "../core/DAOErrors.sol";
import "../integrations/UniswapV3Integration.sol";
import "../interfaces/IDAOFundingParent.sol";

contract ContributionManager is DAOErrors {
    using DAOLib for IDAOStorage.Proposal;

    IDAOStorage public immutable daoStorage;
    address public immutable daoFunding;
    uint256 public immutable lpPercentage;
    uint256 public immutable fundingPeriod;
    uint256 public constant PRICE_PRECISION = 1e18;

    event ContributionRequested(uint256 indexed proposalId, address indexed contributor);
    event ContributorApproved(uint256 indexed proposalId, address indexed contributor, uint256 limit);
    event FundingContributed(uint256 indexed proposalId, address indexed contributor, uint256 amount);
    event LiquidityCommitted(uint256 indexed proposalId, uint256 amount);
    event FundsReleased(uint256 indexed proposalId, address indexed creator, uint256 amount);
    event FundsRefunded(uint256 indexed proposalId, address indexed contributor, uint256 amount);
    event ContributorLimitAdjusted(uint256 indexed proposalId, address indexed contributor, uint256 newLimit);

    modifier onlyDAOFunding() {
        if (msg.sender != daoFunding) revert NotAuthorized();
        _;
    }

    constructor(
        address _daoStorage,
        address _daoFunding,
        uint256 _lpPercentage,
        uint256 _fundingPeriod
    ) {
        daoStorage = IDAOStorage(_daoStorage);
        daoFunding = _daoFunding;
        lpPercentage = _lpPercentage;
        fundingPeriod = _fundingPeriod;
    }

    function requestToContribute(
        uint256 proposalId,
        address contributor
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        bool hasRequested = daoStorage.getContributorRequest(proposalId, contributor);

        if (!basic.isApproved) revert NotApproved();
        if (basic.isClosed) revert AlreadyClosed();
        if (hasRequested) revert UserAlreadyRegistered();

        daoStorage.setContributorRequest(proposalId, contributor, true);
        _updateRequestingContributors(proposalId, contributor);

        emit ContributionRequested(proposalId, contributor);
    }

    function approveContributor(
        uint256 proposalId,
        address contributor,
        uint256 contributionLimit
    ) external onlyDAOFunding {
        if (contributionLimit == 0) revert InvalidAmount();

        bool hasRequested = daoStorage.getContributorRequest(proposalId, contributor);
        bool isApproved = daoStorage.getApprovedContributor(proposalId, contributor);

        if (!hasRequested) revert NotContributor();
        if (isApproved) revert UserAlreadyRegistered();

        daoStorage.setApprovedContributor(proposalId, contributor, true);
        daoStorage.setContributionLimit(proposalId, contributor, contributionLimit);
        _updateApprovedContributors(proposalId, contributor);

        emit ContributorApproved(proposalId, contributor, contributionLimit);
    }

    function contribute(
        uint256 proposalId,
        address contributor,
        uint256 amount
    ) external payable onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);
        
        uint256 contribution = daoStorage.getContribution(proposalId, contributor);
        uint256 contributionLimit = daoStorage.getContributionLimit(proposalId, contributor);

        if (!basic.isApproved) revert NotApproved();
        if (basic.isClosed) revert AlreadyClosed();
        if (block.timestamp >= basic.createdAt + fundingPeriod) revert FundingPeriodEnded();

        DAOLib.handleContribution(contribution, contributionLimit, contributor, amount, basic, token);

        uint256 currentContribution = daoStorage.getContribution(proposalId, contributor);
        uint256 newContribution = currentContribution + amount;
        uint256 tokenAllocation = (amount * token.contributionPrice) / PRICE_PRECISION;

        daoStorage.setContribution(proposalId, contributor, newContribution);
        daoStorage.setTokenAllocation(proposalId, contributor, tokenAllocation);

        basic.currentAmount += amount;
        daoStorage.setProposalBasic(proposalId, basic);

        emit FundingContributed(proposalId, contributor, amount);
    }

    function releaseFunds(
        uint256 proposalId
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);

        if (!basic.isApproved) revert NotApproved();
        if (basic.isClosed) revert AlreadyClosed();
        if (block.timestamp >= basic.createdAt + fundingPeriod) revert FundingPeriodEnded();
        if (basic.currentAmount < basic.targetAmount) revert TargetAmountNotReached();
        if (token.tokenAddress == address(0)) revert TokenNotDeployed();
        
        // Handle SimpleAMM or Uniswap deployments differently
        if (token.useUniswap) {
            // Use Uniswap for liquidity
            _releaseWithUniswap(proposalId, basic, token);
        } else {
            // Use SimpleAMM (original flow)
            if (token.ammAddress == address(0)) revert AMMNotDeployed();
            _releaseWithSimpleAMM(proposalId, basic, token);
        }
    }
    
    function _releaseWithSimpleAMM(
        uint256 proposalId,
        IDAOStorage.ProposalBasic memory basic,
        IDAOStorage.ProposalToken memory token
    ) internal {
        // Close the proposal
        basic.isClosed = true;
        daoStorage.setProposalBasic(proposalId, basic);

        uint256 lpAmount = DAOLib.calculateLPAmount(basic.currentAmount, lpPercentage);
        uint256 creatorAmount = basic.currentAmount - lpAmount;

        // ContributionManager now holds all tokens (token contract allocated them at creation time)
        // Only need to approve tokens for the AMM
        uint256 tokensForLiquidity = (lpAmount * PRICE_PRECISION) / token.tokenPrice;
        bool success = IDAOToken(token.tokenAddress).approve(token.ammAddress, tokensForLiquidity);
        if (!success) revert TokenApprovalFailed();

        // Verify token balance 
        uint256 contractTokenBalance = IDAOToken(token.tokenAddress).balanceOf(address(this));
        if (contractTokenBalance < tokensForLiquidity) {
            // Emit informative events before failing
            emit LiquidityCommitted(proposalId, 0);
            emit FundsReleased(proposalId, basic.creator, 0);
            
            // Provide detailed error for debugging
            revert AddLiquidityFailed(
                string(abi.encodePacked(
                    "Insufficient token balance for liquidity. Expected: ", 
                    uint2str(tokensForLiquidity), 
                    ", Actual: ", 
                    uint2str(contractTokenBalance)
                ))
            );
        }

        try ISimpleAMM(token.ammAddress).addLiquidity{value: lpAmount}() {
            emit LiquidityCommitted(proposalId, lpAmount);
            emit FundsReleased(proposalId, basic.creator, creatorAmount);
        } catch Error(string memory reason) {
            revert AddLiquidityFailed(reason);
        }

        // Send remaining ETH to creator (they still get the ETH)
        (bool sent, ) = payable(basic.creator).call{value: creatorAmount}("");
        if (!sent) revert TransferFailed();
    }
    
    // Helper function to convert uint to string for error messages
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
    
    function _releaseWithUniswap(
        uint256 proposalId,
        IDAOStorage.ProposalBasic memory basic,
        IDAOStorage.ProposalToken memory token
    ) internal {
        // Check if the Uniswap pair has been created
        if (token.uniswapPairAddress == address(0)) {
            // Get Uniswap integration from DAOFunding
            address uniswapAddr = IDAOFundingParent(daoFunding).uniswapIntegration();
            
            // First try 0.05% fee tier which works better for more stable pairs
            uint24 feeTier = 500; // 0.05% fee tier
            try UniswapV3Integration(payable(uniswapAddr)).createPool(token.tokenAddress, feeTier) returns (address poolAddress) {
                token.uniswapPairAddress = poolAddress;
                daoStorage.setProposalToken(proposalId, token);
            } catch Error(string memory reason) {
                // Try with default 0.3% fee tier if 0.05% fails
                feeTier = 3000; // 0.3% fee tier
                try UniswapV3Integration(payable(uniswapAddr)).createPool(token.tokenAddress, feeTier) returns (address poolAddress) {
                    token.uniswapPairAddress = poolAddress;
                    daoStorage.setProposalToken(proposalId, token);
                } catch Error(string memory reason2) {
                    // Try with high 1% fee tier as last resort
                    feeTier = 10000; // 1% fee tier
                    try UniswapV3Integration(payable(uniswapAddr)).createPool(token.tokenAddress, feeTier) returns (address poolAddress) {
                        token.uniswapPairAddress = poolAddress;
                        daoStorage.setProposalToken(proposalId, token);
                    } catch {
                        revert UniswapPairNotCreated();
                    }
                } catch {
                    revert UniswapPairNotCreated();
                }
            } catch {
                revert UniswapPairNotCreated();
            }
        }
        
        // Close the proposal
        basic.isClosed = true;
        daoStorage.setProposalBasic(proposalId, basic);
        
        // Calculate token and ETH amounts based on desired market cap
        (uint256 ethForLiquidity, uint256 tokensForLiquidity) = _calculateUniswapLiquidity(token, basic.currentAmount);
        uint256 creatorAmount = basic.currentAmount - ethForLiquidity;
        
        // ContributionManager now holds all tokens (instead of sending to creator)
        // We don't need to transfer tokens from anywhere else since DAOToken is already
        // set to have ContributionManager as the owner of all tokens
        
        // Approve tokens for Uniswap integration
        address uniswapAddr = IDAOFundingParent(daoFunding).uniswapIntegration();
        bool success = IDAOToken(token.tokenAddress).approve(uniswapAddr, tokensForLiquidity);
        if (!success) revert TokenApprovalFailed();
        
        // Check the token balance of this contract
        uint256 contractTokenBalance = IDAOToken(token.tokenAddress).balanceOf(address(this));
        if (contractTokenBalance < tokensForLiquidity) {
            // Emit informative events before failing
            emit LiquidityCommitted(proposalId, 0);
            emit FundsReleased(proposalId, basic.creator, 0);
            
            // Provide detailed error for debugging
            revert UniswapDeploymentFailed(
                string(abi.encodePacked(
                    "Insufficient token balance for liquidity. Expected: ", 
                    uint2str(tokensForLiquidity), 
                    ", Actual: ", 
                    uint2str(contractTokenBalance)
                ))
            );
        }
        
        // Add liquidity to Uniswap V3
        try UniswapV3Integration(payable(uniswapAddr)).addLiquidity{value: ethForLiquidity}(
            token.tokenAddress,
            tokensForLiquidity,
            ethForLiquidity * 90 / 100, // 10% slippage tolerance for better success chance
            basic.creator // Position NFT still goes to creator
        ) returns (uint256 positionId) {
            // Store the position ID in the token data
            token.uniswapPositionId = positionId;
            daoStorage.setProposalToken(proposalId, token);
            emit LiquidityCommitted(proposalId, ethForLiquidity);
            emit FundsReleased(proposalId, basic.creator, creatorAmount);
        } catch Error(string memory reason) {
            revert UniswapDeploymentFailed(reason);
        } catch {
            revert UniswapDeploymentFailed("Unknown error with Uniswap liquidity addition");
        }
        
        // Transfer remaining ETH to creator (they still get the ETH)
        (bool sent, ) = payable(basic.creator).call{value: creatorAmount}("");
        if (!sent) revert TransferFailed();
    }
    
    function _calculateUniswapLiquidity(
        IDAOStorage.ProposalToken memory token,
        uint256 raisedAmount
    ) internal view returns (uint256 ethAmount, uint256 tokenAmount) {
        address uniswapAddr = IDAOFundingParent(daoFunding).uniswapIntegration();
        
        // Use the calculated values from UniswapIntegration
        return UniswapV3Integration(payable(uniswapAddr)).calculateInitialLiquidity(
            raisedAmount,
            token.initialMarketCap,
            token.tokenSupply
        );
    }

    function withdrawContribution(
        uint256 proposalId,
        address contributor
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        IDAOStorage.ProposalToken memory token = daoStorage.getProposalToken(proposalId);

        if (!DAOLib.validateWithdrawal(
            block.timestamp,
            basic.createdAt,
            fundingPeriod,
            basic.currentAmount,
            basic.targetAmount
        )) revert InvalidParameters();

        uint256 ethAmount = daoStorage.getContribution(proposalId, contributor);
        if (ethAmount == 0) revert InvalidAmount();

        DAOLib.handleWithdrawal(contributor, ethAmount, token);

        daoStorage.setContribution(proposalId, contributor, 0);
        daoStorage.setTokenAllocation(proposalId, contributor, 0);

        basic.currentAmount -= ethAmount;
        daoStorage.setProposalBasic(proposalId, basic);

        (bool sent, ) = payable(contributor).call{value: ethAmount}("");
        if (!sent) revert TransferFailed();

        emit FundsRefunded(proposalId, contributor, ethAmount);
    }

    function adjustContributionLimit(
        uint256 proposalId,
        address contributor,
        uint256 newLimit
    ) external onlyDAOFunding {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        bool isApproved = daoStorage.getApprovedContributor(proposalId, contributor);
        uint256 currentContribution = daoStorage.getContribution(proposalId, contributor);

        if (!basic.isApproved) revert NotApproved();
        if (basic.isClosed) revert AlreadyClosed();
        if (!isApproved) revert NotContributor();
        if (newLimit == 0) revert InvalidAmount();
        if (newLimit < currentContribution) revert InvalidAmount();

        daoStorage.setContributionLimit(proposalId, contributor, newLimit);
        emit ContributorLimitAdjusted(proposalId, contributor, newLimit);
    }

    function _updateRequestingContributors(uint256 proposalId, address contributor) internal {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        address[] memory newRequestingContributors = new address[](basic.requestingContributors.length + 1);
        for (uint i = 0; i < basic.requestingContributors.length; i++) {
            newRequestingContributors[i] = basic.requestingContributors[i];
        }
        newRequestingContributors[basic.requestingContributors.length] = contributor;
        basic.requestingContributors = newRequestingContributors;
        daoStorage.setProposalBasic(proposalId, basic);
    }

    function _updateApprovedContributors(uint256 proposalId, address contributor) internal {
        IDAOStorage.ProposalBasic memory basic = daoStorage.getProposalBasic(proposalId);
        address[] memory newApprovedContributors = new address[](basic.approvedContributors.length + 1);
        for (uint i = 0; i < basic.approvedContributors.length; i++) {
            newApprovedContributors[i] = basic.approvedContributors[i];
        }
        newApprovedContributors[basic.approvedContributors.length] = contributor;
        basic.approvedContributors = newApprovedContributors;
        daoStorage.setProposalBasic(proposalId, basic);
    }

    receive() external payable {}
}