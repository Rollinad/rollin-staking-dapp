import { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemIcon,
  ListItemText,
  Collapse,
  ListItemButton,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CampaignIcon from "@mui/icons-material/Campaign";
import MenuIcon from "@mui/icons-material/Menu";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useLocation, useNavigate } from "react-router-dom";
import { useContractOwner } from "../hooks/useContractOwner";

interface SidebarContainerProps {
  open: boolean;
}

const SIDEBAR_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open",
})<SidebarContainerProps>(({ theme, open }) => ({
  width: open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
  background:
    "linear-gradient(180deg, rgba(156, 39, 176, 0.3) 0%, rgba(103, 58, 183, 0.3) 100%)",
  backdropFilter: "blur(20px)",
  color: "#ffffff",
  height: "100vh",
  position: "fixed",
  left: 0,
  top: 0,
  zIndex: 1200,
  paddingTop: theme.spacing(8),
  borderRight: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
  transition: "width 225ms cubic-bezier(0.4, 0, 0.6, 1)",
  overflowX: "hidden",
  [`${theme.breakpoints.down("sm")}`]: {
    left: open ? 0 : -SIDEBAR_WIDTH,
    width: SIDEBAR_WIDTH,
  },
}));

const MobileToggle = styled(IconButton)(({ theme }) => ({
  position: "fixed",
  left: 16,
  top: 16,
  zIndex: 1300,
  color: "#ffffff",
  display: "none",
  [`${theme.breakpoints.down("sm")}`]: {
    display: "flex",
  },
}));

const StyledListItemButton = styled(ListItemButton)({
  margin: "4px 8px",
  borderRadius: "8px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "&.Mui-selected": {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
  },
});

const StyledSubListItemButton = styled(ListItemButton)({
  margin: "2px 8px 2px 16px",
  borderRadius: "8px",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  "&.Mui-selected": {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});

const StyledListItemIcon = styled(ListItemIcon)({
  color: "#ffffff",
  minWidth: "40px",
});

const StyledListItemText = styled(ListItemText)({
  "& .MuiListItemText-primary": {
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  whiteSpace: "nowrap",
});

interface SidebarProps {
  onCollapse: (collapsed: boolean) => void;
}

export const Sidebar = ({ onCollapse }: SidebarProps) => {
  const [stakeOpen, setStakeOpen] = useState(false);
  const [fundingOpen, setFundingOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const { isOwner } = useContractOwner();

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    onCollapse(!sidebarOpen);
  }, [sidebarOpen, onCollapse]);

  const handleStakeClick = () => {
    if (!isMobile && !sidebarOpen) {
      setSidebarOpen(true);
    } else {
      setStakeOpen(!stakeOpen);
    }
  };

  const handleFundingClick = () => {
    if (!isMobile && !sidebarOpen) {
      setSidebarOpen(true);
    } else {
      setFundingOpen(!fundingOpen);
    }
  };

  const handleAdminClick = () => {
    if (!isMobile && !sidebarOpen) {
      setSidebarOpen(true);
    } else {
      setAdminOpen(!adminOpen);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isCurrentRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <MobileToggle onClick={toggleSidebar}>
        <MenuIcon />
      </MobileToggle>
      <SidebarContainer open={sidebarOpen}>
        <List sx={{ px: 1 }}>
          <StyledListItemButton
            onClick={() => handleNavigation("/swap")}
            selected={location.pathname.startsWith("/swap")}
          >
            <StyledListItemIcon>
              <SwapHorizIcon />
            </StyledListItemIcon>
            {sidebarOpen && (
              <StyledListItemText
                primary='Swap'
                secondary='Exchange tokens'
                sx={{
                  "& .MuiListItemText-secondary": {
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.7rem",
                  },
                }}
              />
            )}
          </StyledListItemButton>
          
          <StyledListItemButton
            onClick={handleStakeClick}
            selected={location.pathname.startsWith("/stake")}
          >
            <StyledListItemIcon>
              <AccountBalanceWalletIcon />
            </StyledListItemIcon>
            {sidebarOpen && (
              <StyledListItemText
                primary='Stake'
                secondary='Earn reward'
                sx={{
                  "& .MuiListItemText-secondary": {
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.7rem",
                  },
                }}
              />
            )}
            {sidebarOpen && (stakeOpen ? <ExpandLess /> : <ExpandMore />)}
          </StyledListItemButton>
          
          <Collapse in={stakeOpen && sidebarOpen} timeout='auto' unmountOnExit>
            <List component='div' disablePadding>
              <StyledSubListItemButton
                selected={isCurrentRoute("/stake")}
                onClick={() => handleNavigation("/stake")}
              >
                <StyledListItemText
                  primary='Pools List'
                  secondary='Available Pools'
                  sx={{
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </StyledSubListItemButton>
              <StyledSubListItemButton
                selected={isCurrentRoute("/stake/create-pool")}
                onClick={() => handleNavigation("/stake/create-pool")}
              >
                <StyledListItemText
                  primary='Create Pool'
                  secondary='Create Own Staking Pool'
                  sx={{
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </StyledSubListItemButton>
              <StyledSubListItemButton
                selected={isCurrentRoute("/stake/create-option")}
                onClick={() => handleNavigation("/stake/create-option")}
              >
                <StyledListItemText
                  primary='Create Staking Option'
                  secondary='Create Option for Staking Pool'
                  sx={{
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </StyledSubListItemButton>
              <StyledSubListItemButton
                selected={isCurrentRoute("/stake/deposit")}
                onClick={() => handleNavigation("/stake/deposit")}
              >
                <StyledListItemText
                  primary='Deposit Rewards'
                  secondary='Add tokens for staking rewards'
                  sx={{
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </StyledSubListItemButton>
            </List>
          </Collapse>
          
          {/* New DAO Funding Section */}
          <StyledListItemButton
            onClick={handleFundingClick}
            selected={location.pathname.startsWith("/funding")}
          >
            <StyledListItemIcon>
              <CampaignIcon />
            </StyledListItemIcon>
            {sidebarOpen && (
              <StyledListItemText
                primary='DAO Funding'
                secondary='Create & fund proposals'
                sx={{
                  "& .MuiListItemText-secondary": {
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.7rem",
                  },
                }}
              />
            )}
            {sidebarOpen && (fundingOpen ? <ExpandLess /> : <ExpandMore />)}
          </StyledListItemButton>
          
          <Collapse in={fundingOpen && sidebarOpen} timeout='auto' unmountOnExit>
            <List component='div' disablePadding>
              <StyledSubListItemButton
                selected={isCurrentRoute("/funding")}
                onClick={() => handleNavigation("/funding")}
              >
                <StyledListItemText
                  primary='All Proposals'
                  secondary='Browse funding proposals'
                  sx={{
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </StyledSubListItemButton>
              <StyledSubListItemButton
                selected={isCurrentRoute("/funding/my-proposals")}
                onClick={() => handleNavigation("/funding/my-proposals")}
              >
                <StyledListItemText
                  primary='My Proposals'
                  secondary='View your created proposals'
                  sx={{
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </StyledSubListItemButton>
              <StyledSubListItemButton
                selected={isCurrentRoute("/funding/create") || isCurrentRoute("/funding/become-creator")}
                onClick={() => handleNavigation("/funding/create")}
              >
                <StyledListItemText
                  primary='Create Proposal'
                  secondary='Start a new funding proposal'
                  sx={{
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </StyledSubListItemButton>
              <StyledSubListItemButton
                selected={isCurrentRoute("/funding/contributions")}
                onClick={() => handleNavigation("/funding/contributions")}
              >
                <StyledListItemText
                  primary='My Contributions'
                  secondary='Manage your contributions'
                  sx={{
                    "& .MuiListItemText-secondary": {
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.7rem",
                    },
                  }}
                />
              </StyledSubListItemButton>
            </List>
          </Collapse>
          
          {/* Admin Section - Only visible to contract owner */}
          {isOwner && (
            <>
              <StyledListItemButton
                onClick={handleAdminClick}
                selected={location.pathname.startsWith("/admin")}
              >
                <StyledListItemIcon>
                  <AdminPanelSettingsIcon />
                </StyledListItemIcon>
                {sidebarOpen && (
                  <StyledListItemText
                    primary='Admin'
                    secondary='Contract management'
                    sx={{
                      "& .MuiListItemText-secondary": {
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.7rem",
                      },
                    }}
                  />
                )}
                {sidebarOpen && (adminOpen ? <ExpandLess /> : <ExpandMore />)}
              </StyledListItemButton>
              
              <Collapse in={adminOpen && sidebarOpen} timeout='auto' unmountOnExit>
                <List component='div' disablePadding>
                  <StyledSubListItemButton
                    selected={isCurrentRoute("/admin/proposals")}
                    onClick={() => handleNavigation("/admin/proposals")}
                  >
                    <StyledListItemText
                      primary='Review Proposals'
                      secondary='Approve new proposals'
                      sx={{
                        "& .MuiListItemText-secondary": {
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: "0.7rem",
                        },
                      }}
                    />
                  </StyledSubListItemButton>
                </List>
              </Collapse>
            </>
          )}
        </List>
      </SidebarContainer>
    </>
  );
};