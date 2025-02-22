// src/config/chains.ts
import { http } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

const monadTestnetPrivate = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  iconUrl: "https://img.notionusercontent.com/s3/prod-files-secure%2F8b536fe4-3bbf-45fc-b661-190b80c94bea%2Fc10731c3-532e-45cc-bc2c-2f9557a27366%2FMonad_Logo_-_Inverted_-_Logo_Mark.png/size/w=140?exp=1740330083&sig=KD0soUmFpSvFRyPjv0NQhhvL7ZBzVWnb574uhTzy_aI",
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