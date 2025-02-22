import { Box, Container, Typography } from "@mui/material";
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { useAccount } from "wagmi";
import { Routes, Route, Navigate } from "react-router-dom";
import { PoolsList } from "./components/PoolsList";
import { CreatePool } from "./components/CreatePool";
import { CreateStakingOption } from "./components/CreateStakingOption";
import { Sidebar } from "./components/Sidebar";
import rollinStakingIcon from "./assets/icon.png";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { CustomConnectButton } from "./components/CustomConnectButton";

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

const AnimatedBackground = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(
    -45deg,
    #9C27B0,
    #673AB7,
    #7B1FA2,
    #4A148C
  );
  background-size: 400% 400%;
  animation: ${gradientAnimation} 15s ease infinite;
`;

const MainContent = styled(Box)`
  margin-left: 240px; // Same as sidebar width
  width: calc(100% - 240px);
`;

const customTheme = lightTheme({
  accentColor: '#9C27B0',
  accentColorForeground: 'white',
  borderRadius: 'large',
  overlayBlur: 'small',
});

export const App = () => {
  const { isConnected } = useAccount();

  return (
    <RainbowKitProvider theme={customTheme}>
      <AnimatedBackground>
        <Sidebar />
        <MainContent>
          <Container maxWidth='lg' sx={{ py: 4 }}>
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
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  Rollin Staking
                </Typography>
              </Box>
              <CustomConnectButton />
            </Box>
            {isConnected ? (
              <>
                <Box sx={{ mt: 3 }}>
                  <Routes>
                    <Route path="/stake">
                      <Route index element={<PoolsList />} />
                      <Route path="create-pool" element={<CreatePool />} />
                      <Route path="create-option" element={<CreateStakingOption />} />
                    </Route>
                    <Route path="/" element={<Navigate to="/stake" replace />} />
                    <Route path="*" element={<Navigate to="/stake" replace />} />
                  </Routes>
                </Box>
              </>
            ) : (
              <Typography 
                variant='h6' 
                textAlign='center'
                sx={{ 
                  color: '#ffffff',
                  mt: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(5px)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                Please connect your wallet to continue
              </Typography>
            )}
          </Container>
        </MainContent>
      </AnimatedBackground>
    </RainbowKitProvider>
  );
};

export default App;