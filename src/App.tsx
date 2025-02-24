import { Box, Container, Typography, useMediaQuery } from "@mui/material";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useAccount } from "wagmi";
import { Routes, Route, Navigate } from "react-router-dom";
import { PoolsList } from "./components/staking/PoolsList";
import { CreatePool } from "./components/staking/CreatePool";
import { CreateStakingOption } from "./components/staking/CreateStakingOption";
import { Sidebar } from "./components/Sidebar";
import styled from "@emotion/styled";
import { CustomConnectButton } from "./components/CustomConnectButton";
import { useState, useEffect } from "react";
import { SwapCard } from "./components/swapping/SwapCard";
import { AnimatedBackground, customTheme } from "./styles/styled";

const rollinStakingIcon = "/icon.png";

interface MainContentProps {
  sidebarCollapsed: boolean;
}

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarCollapsed'
})<MainContentProps>(({ sidebarCollapsed }) => ({
  marginLeft: sidebarCollapsed ? '64px' : '240px',
  width: `calc(100% - ${sidebarCollapsed ? '64px' : '240px'})`,
  transition: 'margin 225ms cubic-bezier(0.4, 0, 0.6, 1), width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
  '@media (max-width: 600px)': {
    marginLeft: 0,
    width: '100%',
  },
}));

export const App = () => {
  const { isConnected } = useAccount();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <RainbowKitProvider theme={customTheme}>
      <AnimatedBackground>
        <Sidebar onCollapse={handleSidebarCollapse} />
        <MainContent sidebarCollapsed={sidebarCollapsed}>
          <Container maxWidth='lg' sx={{ py: 4 }}>
            <Box
              sx={{
                mb: 4,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 2,
                ml: { xs: 5, sm: 6 } // Add margin to move logo and title right
              }}>
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
                    fontSize: {
                      xs: '1.5rem',    // 24px for mobile
                      sm: '2rem',      // 32px for tablet
                      md: '2.125rem',  // 34px (default h4 size)
                    },
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
                    <Route path="/" element={<Navigate to="/swap" replace />} />
                    <Route path="*" element={<Navigate to="/stake" replace />} />
                    <Route path="/swap" element={<SwapCard />} />
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