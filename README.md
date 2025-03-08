# Rollinad DApp

A comprehensive DeFi platform for staking cryptocurrency tokens, swapping between tokens, and participating in DAO funding opportunities.

![Rollinad DApp](/public/icon.png)

## Integrated Partners

<div style="display: flex; align-items: center; gap: 30px; margin-bottom: 20px;">
  <a href="https://privy.io/" target="_blank">
    <img src="https://assets-global.website-files.com/6364e65656ab107e465325d2/64797a9c1ce3d0fa07a0e819_blue-logo.svg" alt="Privy" height="50" />
  </a>
  <a href="https://0x.org/" target="_blank">
    <img src="https://0x.org/images/0x_logo_dark.svg" alt="0x Protocol" height="50" />
  </a>
</div>

## Features

### Staking
- Create staking pools for ERC20 tokens
- Define staking options with customizable durations and APY rates
- Stake tokens to earn rewards
- Early unstaking with configurable freeze periods and fees
- Pool management tools for staking creators

### Token Swapping
- Swap between different tokens using 0x Protocol integration
- Support for native token and ERC20 token swaps
- Both standard and gasless swapping options
- Real-time price quotes and efficient trade execution

### DAO Funding
- Create funding proposals for blockchain projects
- Contribute to existing proposals with cryptocurrency
- User registration system with creator privileges
- Automatic token creation for funded projects
- Trading platform for proposal tokens via SimpleAMM
- Comprehensive proposal management with lifecycle states
- **New: Bonding curve integration with Uniswap** after proposals reach funding target 

## Features by Actor

### Regular Users
- Connect wallet via multiple options (Privy, RainbowKit)
- Swap tokens with real-time quotes and fee estimates
- View existing staking pools with APY and duration details
- Stake tokens in available pools
- Unstake tokens (with potential penalties for early withdrawal)
- Browse funding proposals with detailed project information
- Contribute to funding proposals with cryptocurrency
- Trade proposal tokens on integrated AMM
- Access Uniswap liquidity pools for funded projects

### Pool Creators
- Create new staking pools for specific ERC20 tokens
- Configure staking options with:
  - Custom durations
  - APY rates
  - Early withdrawal penalties
  - Freeze periods
- Monitor pool performance and analytics
- Adjust pool parameters (within limits)
- Withdraw collected fees (if applicable)

### Project Creators
- Register as a creator in the DAO funding system
- Create detailed project proposals with:
  - Funding goals and timelines
  - Project descriptions and media
  - Team information
  - Roadmap and milestones
- Manage proposal lifecycle
- Receive contributions directly to designated wallet
- Monitor funding progress and analytics
- Deploy project tokens automatically upon successful funding
- Leverage Uniswap integration for token liquidity after funding completion

### Platform Administrators
- Monitor overall platform metrics
- Manage platform parameters and fees
- Pause contracts in emergencies
- Upgrade contracts when needed
- Adjust supported token lists

## Business Flow Activity Diagrams

### User Onboarding Flow
```
┌─────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│  Visit Platform │     │  Connect Wallet    │     │  Accept Terms of   │
│  Homepage       ├────►│  via Privy/Rainbow ├────►│  Service (if new)  │
└─────────────────┘     └────────────────────┘     └─────────┬──────────┘
                                                             │
┌─────────────────┐     ┌────────────────────┐     ┌─────────▼──────────┐
│  Access All     │     │  View Dashboard    │     │  Profile Creation  │
│  DApp Features  │◄────┤  Overview          │◄────┤  (Optional)        │
└─────────────────┘     └────────────────────┘     └────────────────────┘
```

### Token Swapping Business Flow
```
┌─────────────┐     ┌────────────────┐     ┌─────────────────┐
│ User        │     │ Select tokens  │     │ System fetches  │
│ visits swap ├────►│ & enter amount ├────►│ real-time quote │
│ interface   │     └────────────────┘     └────────┬────────┘
└─────────────┘                                     │
                                                    │
                    ┌────────────────┐     ┌────────▼────────┐
                    │ Execute        │     │ User reviews    │
                    │ transaction    │◄────┤ quote & fees    │
                    └────────────────┘     └─────────────────┘
```

### Complete Staking Business Flow
```
┌─────────────┐     ┌────────────────┐     ┌─────────────────┐
│ User views  │     │ User selects   │     │ User chooses    │
│ available   ├────►│ specific pool  ├────►│ staking option  │
│ pools       │     │                │     │ (duration/APY)  │
└─────────────┘     └────────────────┘     └────────┬────────┘
                                                    │
┌─────────────┐     ┌────────────────┐     ┌────────▼────────┐
│ User claims │     │ System         │     │ User approves   │
│ rewards or  │◄────┤ locks tokens   │◄────┤ & deposits      │
│ unstakes    │     │ for duration   │     │ tokens          │
└──────┬──────┘     └────────────────┘     └─────────────────┘
       │
       │           Early Unstaking Path
       │      ┌────────────────┐     ┌─────────────────┐
       └─────►│ User pays early│     │ System applies  │
              │ withdrawal fee ├────►│ freeze period   │
              └────────────────┘     └─────────────────┘
```

### Full Staking Pool Creation Business Flow
```
┌─────────────┐     ┌────────────────┐     ┌───────────────────┐
│ Creator     │     │ Selects token  │     │ Defines multiple  │
│ initiates   ├────►│ to be staked   ├────►│ staking options   │
│ pool setup  │     │                │     │ with APY/duration │
└─────────────┘     └────────────────┘     └────────┬──────────┘
                                                    │
┌─────────────┐     ┌────────────────┐     ┌────────▼──────────┐
│ Pool        │     │ Creator        │     │ Sets penalties    │
│ becomes     │◄────┤ deposits       │◄────┤ for early         │
│ active      │     │ initial tokens │     │ withdrawal        │
└──────┬──────┘     └────────────────┘     └──────────────────┘
       │
       │           Pool Management
       │      ┌────────────────┐     ┌─────────────────┐
       └─────►│ Monitor pool   │     │ Collect fees    │
              │ analytics      ├────►│ & adjust params │
              └────────────────┘     └─────────────────┘
```

### Complete DAO Funding & Proposal Lifecycle
```
┌─────────────┐     ┌────────────────┐     ┌─────────────────┐
│ User        │     │ Complete       │     │ Proposal drafted│
│ registers as├────►│ creator        ├────►│ with details    │
│ creator     │     │ verification   │     │ & milestones    │
└─────────────┘     └────────────────┘     └────────┬────────┘
                                                    │
┌─────────────┐     ┌────────────────┐     ┌────────▼────────┐
│ System      │     │ Proposal opens │     │ Proposal        │
│ validates   ├────►│ for funding    ├────►│ accumulates     │
│ proposal    │     │                │     │ contributions   │
└──────┬──────┘     └────────────────┘     └────────┬────────┘
       │                                            │
       │      If funding goal reached               │
       │      ┌────────────────┐     ┌──────────────▼───────┐
       └─────►│ Project tokens │     │ Trading begins on    │
              │ are created    ├────►│ SimpleAMM            │
              └────────┬───────┘     └──────────┬───────────┘
                       │                        │
                       │                        │
                       │                        ▼
                       │            ┌────────────────────────┐
                       │            │ Bonding curve          │
                       │            │ integration with       │
                       │            │ Uniswap established    │
                       │            └────────────┬───────────┘
                       │                         │
                       │           Project Execution
                       │      ┌───────────────────────────┐
                       └─────►│ Creator implements project│
                              │ & provides updates        │
                              └───────────────────────────┘
```

### Contribution & Token Trading Flow
```
┌─────────────┐     ┌────────────────┐     ┌─────────────────┐
│ User browses│     │ Reviews project│     │ Decides to      │
│ proposal    ├────►│ details and    ├────►│ contribute      │
│ marketplace │     │ team info      │     │ to proposal     │
└─────────────┘     └────────────────┘     └────────┬────────┘
                                                    │
┌─────────────┐     ┌────────────────┐     ┌────────▼────────┐
│ User        │     │ System issues  │     │ User approves   │
│ receives    │◄────┤ project tokens │◄────┤ & sends funds   │
│ tokens      │     │ to contributor │     │ to proposal     │
└──────┬──────┘     └────────────────┘     └─────────────────┘
       │
       │           Token Trading
       │      ┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
       ├─────►│ User visits    │     │ Sets price and  │     │ Trade executed  │
       │      │ SimpleAMM      ├────►│ amount to trade ├────►│ on SimpleAMM    │
       │      │ interface      │     │                 │     │                 │
       │      └────────────────┘     └─────────────────┘     └─────────────────┘
       │
       │           Uniswap Trading (After Funding)
       └─────►┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
              │ User accesses  │     │ Interacts with  │     │ Benefits from   │
              │ Uniswap        ├────►│ bonding curve   ├────►│ improved        │
              │ pools          │     │ liquidity       │     │ liquidity       │
              └────────────────┘     └─────────────────┘     └─────────────────┘
```

### Gasless Transaction Flow
```
┌─────────────┐     ┌────────────────┐     ┌─────────────────┐
│ User selects│     │ System prepares│     │ User signs      │
│ gasless     ├────►│ transaction    ├────►│ message (not    │
│ option      │     │ parameters     │     │ transaction)    │
└─────────────┘     └────────────────┘     └────────┬────────┘
                                                    │
┌─────────────┐     ┌────────────────┐     ┌────────▼────────┐
│ Transaction │     │ Relayer submits│     │ System verifies │
│ confirmed   │◄────┤ transaction    │◄────┤ signature       │
└─────────────┘     └────────────────┘     └─────────────────┘
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/rollinad-dapp.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production
```bash
npm run build
```

## Technical Architecture

### Frontend
- React application built with TypeScript
- Component-based structure organized by feature domains
- Material UI with custom theming for consistent UI components
- React Router for seamless navigation
- Context providers for efficient global state management:
  - SnackbarContext for notifications
  - WalletSyncProvider for wallet connection synchronization

### API Integration
- Dedicated API routes for interacting with 0x Protocol
- Gas-less transaction support with specialized endpoints
- Uniswap integration for bonding curve liquidity

### Blockchain Integration
- Wagmi library for React-Ethereum integration
- RainbowKit for intuitive wallet connection UI
- Privy integration for social login and wallet management
- Viem for type-safe Ethereum interactions
- Multi-chain support:
  - Monad Testnet (primary)

## Smart Contracts

### Staking Contracts
```
contract/staking/
├── RollinStaking.sol - Main staking contract with pool management
└── FeeVault.sol - Contract for collecting staking fees
```

### Funding Contracts
```
contract/funding/
├── DAOFunding.sol - Main contract for DAO funding platform
├── DAOView.sol - View functions for DAO data
├── core/ - Core contract functionality
├── interfaces/ - Contract interfaces
├── libraries/ - Utility libraries
├── managers/ - Specialized management modules
│   ├── UserManager.sol - User registration and permissions
│   ├── ProposalManager.sol - Proposal lifecycle management
│   ├── ContributionManager.sol - Handles contributions
│   └── TradingManager.sol - Token trading functionality
└── tokens/
    ├── DAOToken.sol - ERC20 tokens for funded projects
    └── SimpleAMM.sol - Automated Market Maker for trading
```

## Bonding Curve & Uniswap Integration

The platform now features a seamless integration with Uniswap after proposals reach their funding target:

1. **Automatic Liquidity Pool Creation**:
   - When a proposal reaches its funding target, in addition to enabling SimpleAMM trading, the system now establishes a Uniswap liquidity pool
   - This creates a bonding curve mechanism that provides deeper liquidity for project tokens

2. **Benefits for Token Holders**:
   - Improved token liquidity via Uniswap's larger ecosystem
   - Price discovery through market forces
   - Ability to trade tokens across multiple DEXes

3. **Technical Implementation**:
   - Programmatic creation of Uniswap V3 pools with appropriate fee tiers
   - Initial liquidity provisioning from project treasury
   - Smart contract hooks that trigger after successful funding completion

4. **Future Enhancements**:
   - Customizable bonding curve parameters for project creators
   - Liquidity mining incentives for early supporters
   - Cross-chain liquidity bridges

## Tech Stack

### Core Technologies
- **Languages**: TypeScript, Solidity, JavaScript
- **Build Tools**: Vite, Webpack
- **State Management**: React Context API, React Query
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Infrastructure**: Vercel

### Frontend
- **Framework**: React 18
- **Build System**: Vite
- **UI Library**: Material UI v5
- **Styling**: Emotion, styled-components
- **Form Management**: React Hook Form, Zod
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query)
- **Animation**: Framer Motion
- **Internationalization**: i18next
- **Date & Time**: date-fns
- **Icons**: Material Icons, custom SVGs

### Web3 Integration
- **Core Libraries**:
  - Wagmi for React hooks to interact with Ethereum
  - Viem for type-safe Ethereum interactions
  - Ethers.js for blockchain interactions
- **Wallet Connection**:
  - RainbowKit for intuitive wallet connection UI
  - Privy for social login and wallet management
  - WalletConnect v2 support
- **Protocol Integrations**:
  - 0x Protocol API for token swaps
  - Uniswap SDK for bonding curve implementation
  - Infura/Alchemy for RPC providers

### Smart Contracts
- **Language**: Solidity ^0.8.17
- **Development Framework**: Hardhat
- **Testing**: Chai, Mocha, Waffle
- **Deployment**: Hardhat deploy scripts
- **Standards**: ERC20, ERC721
- **Security**: OpenZeppelin contracts

### Backend / API
- **Framework**: Next.js API routes
- **Data Validation**: Zod, TypeScript
- **Authentication**: JWT, NextAuth.js
- **Integrations**:
  - 0x Protocol for swap quotes
  - Permissionless for account abstraction
  - RPC providers for blockchain data

### DevOps & Quality
- **Linting**: ESLint, Prettier
- **Type Checking**: TypeScript, tsc
- **Testing**: Jest, React Testing Library
- **Development Utilities**: 
  - Concurrently for running multiple servers
  - dotenv for environment variables
  - Husky for git hooks

## Architecture Diagrams

### System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                  │
├─────────────┬─────────────────────────┬───────────────-─┤
│  Staking    │      DAO Funding        │  Token Swap     │
│  Module     │      Module             │  Module         │
└──────┬──────┴──────────┬──────────────┴────────┬───────-┘
       │                 │                       │        
┌──────▼─────────────────▼──────────────────────▼───────┐
│               Web3 Integration Layer                  │
│    (Wagmi, Viem, RainbowKit, Privy, Ethers.js)        │
└──────┬─────────────────┬──────────────────────┬───────┘
       │                 │                      │        
┌──────▼──────┐  ┌───-───▼─────┐  ┌────────────-▼──────┐
│  Staking    │  │  Funding    │  │  0x/Uniswap APIs   │
│  Contracts  │  │  Contracts  │  │  (Liquidity)       │
└─────────────┘  └─────────────┘  └────────────────────┘
```

## License
All files are covered by the MIT license, see [`LICENSE`](./LICENSE).