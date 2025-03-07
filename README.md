# Rollin Staking DApp

A comprehensive DeFi platform for staking cryptocurrency tokens, swapping between tokens, and participating in DAO funding opportunities.

![Rollin DApp](/public/icon.png)

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

### Analytics
- Trade analytics for monitoring swap transactions
- Detailed tracking of contributions and proposal performance
- User-friendly dashboards for data visualization

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
- View transaction history and analytics

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
- Provide updates to contributors

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
              └────────┬───────┘     └──────────────────────┘
                       │
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
       └─────►│ User visits    │     │ Sets price and  │     │ Trade executed  │
              │ SimpleAMM      ├────►│ amount to trade ├────►│ on SimpleAMM    │
              │ interface      │     │                 │     │                 │
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

### Administrator Platform Management Flow
```
┌─────────────┐     ┌────────────────┐     ┌─────────────────┐
│ Admin logs  │     │ Reviews        │     │ Monitors key    │
│ into secure ├────►│ platform       ├────►│ metrics & user  │
│ dashboard   │     │ performance    │     │ activity        │
└─────────────┘     └────────────────┘     └────────┬────────┘
                                                    │
┌─────────────┐     ┌────────────────┐     ┌────────▼────────┐
│ Changes     │     │ Manages        │     │ Adjust platform │
│ deployed to │◄────┤ supported      │◄────┤ parameters      │
│ platform    │     │ token list     │     │ & fees          │
└─────────────┘     └────────────────┘     └─────────────────┘
       │
       │        Emergency Actions
       │    ┌────────────────┐      ┌─────────────────┐
       └───►│ Pause contracts│      │ Deploy contract │
            │ if needed      ├─────►│ upgrades        │
            └────────────────┘      └─────────────────┘
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Yarn or npm

### Installation
```bash
# Clone the repository
git clone <repository-url>

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
- Trade analytics tracking and processing

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

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and building
- Next.js for API routes
- Material UI for component library
- React Hook Form for form management
- React Router for navigation
- TanStack Query for data fetching

### Web3 Integration
- Wagmi for React hooks to interact with Ethereum
- Viem for type-safe Ethereum interactions
- Ethers.js for blockchain interactions
- RainbowKit for wallet connection UI
- Privy for social login and wallet management

### Backend / API
- Next.js API routes
- 0x Protocol integration for swaps
- Permissionless for account abstraction

### Testing & Development
- TypeScript for type safety
- ESLint for code quality
- Concurrently for running multiple development servers

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
│  Staking    │  │  Funding    │  │  0x Protocol API   │
│  Contracts  │  │  Contracts  │  │  (Swap Service)    │
└─────────────┘  └─────────────┘  └────────────────────┘
```

### Component Relationship Diagram
```
┌─────────────────────┐       ┌───────────────────┐
│  WalletSyncContext  │◄──────┤  Custom Connect   │
└────────┬────────────┘       │  Button           │
         │                    └───────────────────┘
         ▼
┌────────────────────┐        ┌───────────────────┐
│  Main Application  │─────►  │  Navigation       │
└────────┬───────────┘        └───────────────────┘
         │
         ├────────────┬────────────┬─────────────┐
         ▼            ▼            ▼             ▼
┌────────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│  Staking   │  │  Funding │  │  Swap   │  │ Analytics│
│  Module    │  │  Module  │  │  Module │  │ Module   │
└────────────┘  └──────────┘  └─────────┘  └──────────┘
```

### Data Flow Diagram
```
┌──────────────┐    ┌─────────────┐    ┌───────────────┐    ┌────────────┐
│  User        │    │  Frontend   │    │  API Layer    │    │ Blockchain │
│  Interface   │◄──►│  Components │◄──►│  (Next.js)    │◄──►│ (Contracts)│
└──────────────┘    └─────────────┘    └───────────────┘    └────────────┘
        │                                    ▲                   ▲
        │                                    │                   │
        │                                    │                   │
        │               ┌─────────────────────┐                  │
        └──────────────►│ 0x Protocol Service ├────────────────-─┘
                        └─────────────────────┘
```

## License
All other files are covered by the MIT license, see [`LICENSE`](./LICENSE).
