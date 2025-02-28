import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { monadTestnet } from "./config/chain";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import { App } from "./App";
import { config } from "./config/chain";
import theme from "./theme";
import "@rainbow-me/rainbowkit/styles.css";
import "./styles/fonts.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#9c27b0',
          borderRadius: 'medium',
        })}>
          <PrivyProvider
            appId={import.meta.env.VITE_PRIVI_APP_ID!}
            config={{
              defaultChain: monadTestnet,
              supportedChains: [monadTestnet],
              appearance: {
                theme: "dark",
                accentColor: "#9c27b0",
              },
              embeddedWallets: {
                createOnLogin: "off",
              },
              loginMethods: ["twitter"],
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
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
