import { http } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  iconUrl: "https://imagedelivery.net/cBNDGgkrsEA-b_ixIp9SkQ/MON.png/public",
  iconBackground: "#673AB7",
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    public: { http: ['https://testnet-rpc.monad.xyz'] },
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
} as const

// Define all supported chains for the app
export const supportedChains = [
  monadTestnet,
  {
    ...mainnet,
    iconUrl: "https://www.svgrepo.com/show/349356/ethereum.svg",
    iconBackground: "#627EEA",
  },
  {
    ...sepolia,
    iconUrl: "https://www.svgrepo.com/show/349356/ethereum.svg",
    iconBackground: "#627EEA",
  }
]

export const config = getDefaultConfig({
  appName: 'Rollinad',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [
    monadTestnet,
    mainnet,
    sepolia,
  ],
  transports: {
    [monadTestnet.id]: http(monadTestnet.rpcUrls.public.http[0]),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})