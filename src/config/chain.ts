// src/config/chains.ts
import { http } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

const monadTestnetPrivate = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6'] },
    default: { http: ['https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
} as const

export const config = getDefaultConfig({
  appName: 'Rollin Staking',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [
    monadTestnetPrivate,
    mainnet,
    sepolia,
  ],
  transports: {
    [monadTestnetPrivate.id]: http(monadTestnetPrivate.rpcUrls.public.http[0]),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})