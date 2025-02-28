import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { monadTestnet } from "./config/chain";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import { App } from "./App";
import { config } from "./config/chain";
import theme from "./theme";
import "./styles/fonts.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={import.meta.env.VITE_PRIVI_APP_ID!}
          config={{
            defaultChain: monadTestnet,
            supportedChains: [monadTestnet],
            appearance: {
              theme: "dark",
              accentColor: "#9c27b0",
            },
            // Configure wallet options
            embeddedWallets: {
              createOnLogin: "users-without-wallets",
            },
            loginMethods: ["wallet", "twitter"],
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
);
