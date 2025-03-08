import { Box, Container, Typography, useMediaQuery } from "@mui/material";
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
import { AnimatedBackground } from "./styles/styled";
import { ProposalDetail } from "./components/funding/proposal-detail/ProposalDetail";
import { MyContributions } from "./components/funding/MyContribution";
import { MyProposals } from "./components/funding/MyProposals";
import { ProposalList } from "./components/funding/ProposalList";
import { DepositToken } from "./components/staking/DepositToken";
import { CreateProposal } from "./components/funding/CreateProposal";
import UserRegistration from "./components/funding/UserRegistration";
import { BecomeCreator } from "./components/BecomeCreator";
import { AdminProposalReview } from "./components/funding/AdminProposalReview";
import { ApproveContributors } from "./components/funding/ApproveContributors";
import { useUserManagement } from "./hooks/useFundingContract";

const rollinStakingIcon = "/icon.png";

interface MainContentProps {
  sidebarCollapsed: boolean;
}

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== "sidebarCollapsed",
})<MainContentProps>(({ sidebarCollapsed }) => ({
  marginLeft: sidebarCollapsed ? "64px" : "240px",
  width: `calc(100% - ${sidebarCollapsed ? "64px" : "240px"})`,
  transition:
    "margin 225ms cubic-bezier(0.4, 0, 0.6, 1), width 225ms cubic-bezier(0.4, 0, 0.6, 1)",
  "@media (max-width: 600px)": {
    marginLeft: 0,
    width: "100%",
  },
}));

export const App = () => {
  const { isConnected } = useAccount();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  
  // Get user data from contract
  const { userData } = useUserManagement();
  const isRegistered = userData?.isRegistered || false;

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  ml: { xs: 5, sm: 6 },
                }}
              >
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
                    color: "rgba(251, 250, 249, 1)",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    fontSize: {
                      xs: "1.5rem", // 24px for mobile
                      sm: "2rem", // 32px for tablet
                      md: "2.125rem", // 34px (default h4 size)
                    },
                  }}
                >
                  Rollinad
                </Typography>
              </Box>
              <CustomConnectButton />
            </Box>
            {isConnected ? (
              <>
                <Box sx={{ mt: 3 }}>
                  <Routes>
                    <Route path='/stake'>
                      <Route index element={<PoolsList />} />
                      <Route path='create-pool' element={<CreatePool />} />
                      <Route
                        path='create-option'
                        element={<CreateStakingOption />}
                      />
                      <Route path='deposit' element={<DepositToken />} />
                    </Route>

                    {/* Swap Route */}
                    <Route path='/swap' element={<SwapCard />} />

                    {/* New DAO Funding Routes */}
                    <Route path='/funding'>
                      <Route index element={<ProposalList />} />
                      <Route path='my-proposals' element={<MyProposals />} />
                      <Route path="create" element={
                        isRegistered 
                          ? (userData?.isCreator ? <CreateProposal /> : <BecomeCreator />) 
                          : <UserRegistration />
                      } />
                      <Route path='detail/:id' element={<ProposalDetail />} />
                      <Route path='contributions' element={<MyContributions />} />
                      <Route path="register" element={<UserRegistration />} />
                      <Route path="become-creator" element={<BecomeCreator />} />
                      <Route path="manage-contributors/:id" element={<ApproveContributors />} />
                    </Route>

                    {/* Admin Routes - Only accessible to contract owner */}
                    <Route path='/admin'>
                      <Route path='proposals' element={<AdminProposalReview />} />
                    </Route>

                    {/* Default routes */}
                    <Route path='/' element={<Navigate to='/swap' replace />} />
                    <Route
                      path='*'
                      element={<Navigate to='/stake' replace />}
                    />
                  </Routes>
                </Box>
              </>
            ) : (
              <Typography
                variant='h6'
                textAlign='center'
                sx={{
                  color: "#ffffff",
                  mt: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(5px)",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                Please connect your wallet to continue
              </Typography>
            )}
          </Container>
        </MainContent>
      </AnimatedBackground>
  );
};

export default App;
