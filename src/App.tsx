import { Box, Container, Typography } from "@mui/material";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Routes, Route, Navigate } from "react-router-dom";
import { PoolsList } from "./components/PoolsList";
import { CreatePool } from "./components/CreatePool";
import { CreateStakingOption } from "./components/CreateStakingOption";
import { Navigation } from "./components/Navigation";
import rollinStakingIcon from "./assets/icon.png";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

// Define the animation
const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Create styled component for the animated background
const AnimatedBackground = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(-45deg, #9c27b0, #673ab7, #7b1fa2, #4a148c);
  background-size: 400% 400%;
  animation: ${gradientAnimation} 15s ease infinite;
`;

export const App = () => {
  const { isConnected } = useAccount();

  return (
    <AnimatedBackground>
      <Container
        maxWidth='lg'
        sx={{
          py: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <img
              src={rollinStakingIcon}
              alt='Rollin Logo'
              style={{
                height: "40px",
                width: "auto",
              }}
            />
            <Typography
              variant='h4'
              sx={{
                color: "#ffffff",
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)", // Adding subtle text shadow for better depth
              }}
            >
              Rollin Staking
            </Typography>
          </Box>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              return (
                <div
                  {...(!mounted && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!mounted || !account || !chain) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type='button'
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(5px)",
                            color: "#ffffff",
                            padding: "12px 20px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.2)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.1)";
                          }}
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    return (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button
                          onClick={openChainModal}
                          type='button'
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(5px)",
                            color: "#ffffff",
                            padding: "12px 20px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.2s ease",
                            minWidth: "fit-content",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.2)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.1)";
                          }}
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                flexShrink: 0,
                              }}
                            >
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? "Chain icon"}
                                  src={chain.iconUrl}
                                  style={{ width: "100%", height: "100%" }}
                                />
                              )}
                            </div>
                          )}
                          {chain.name}
                        </button>

                        <button
                          onClick={openAccountModal}
                          type='button'
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(5px)",
                            color: "#ffffff",
                            padding: "12px 20px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            minWidth: "fit-content",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.2)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(255, 255, 255, 0.1)";
                          }}
                        >
                          <span style={{ whiteSpace: "nowrap" }}>
                            {account.displayBalance}
                          </span>
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "140px",
                            }}
                          >
                            {account.displayName}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </Box>
        {isConnected ? (
          <>
            <Navigation />
            <Box sx={{ mt: 3 }}>
              <Routes>
                <Route path='/' element={<PoolsList />} />
                <Route path='/create-pool' element={<CreatePool />} />
                <Route
                  path='/create-option'
                  element={<CreateStakingOption />}
                />
                <Route path='*' element={<Navigate to='/' replace />} />
              </Routes>
            </Box>
          </>
        ) : (
          <Typography variant='h6' textAlign='center' sx={{ color: "#ffffff" }}>
            Please connect your wallet to continue
          </Typography>
        )}
      </Container>
    </AnimatedBackground>
  );
};

export default App;
