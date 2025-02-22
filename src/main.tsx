// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { BrowserRouter } from 'react-router-dom'
import '@rainbow-me/rainbowkit/styles.css'
import { SnackbarProvider } from './contexts/SnackbarContext'
import { App } from './App'
import { config } from './config/chain'
import theme from './theme'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#9c27b0',
          borderRadius: 'medium',
        })}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <SnackbarProvider>
                <App />
              </SnackbarProvider>
            </ThemeProvider>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)