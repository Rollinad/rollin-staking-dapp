// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { PrivyProvider } from '@privy-io/react-auth'
import { base, polygon, arbitrum, mainnet } from 'viem/chains'
import { SnackbarProvider } from './contexts/SnackbarContext'
import { App } from './App'
import { config } from './config/chain'
import theme from './theme'
import './styles/fonts.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId="cm7kn27vo00nkq7k6e4ub487t" // Replace with your actual Privy App ID
          config={{
            // Set your default chain (you can adjust based on your preference)
            defaultChain: base,
            // Support multiple chains
            supportedChains: [base, polygon, arbitrum, mainnet],
            // Appearance configuration to match your dark theme
            appearance: {
              theme: 'dark',
              accentColor: '#9c27b0', // Matching your current accentColor
            },
            // Configure wallet options
            embeddedWallets: {
              createOnLogin: 'users-without-wallets', // Auto-create embedded wallet when user logs in
            },
            // User-friendly login methods
            loginMethods: ['email', 'wallet', 'google', 'discord', 'twitter'],
          }}
        >
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <SnackbarProvider>
                <App />
              </SnackbarProvider>
            </ThemeProvider>
          </BrowserRouter>
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)