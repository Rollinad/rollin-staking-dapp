// Sidebar.tsx
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
import MenuIcon from "@mui/icons-material/Menu";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [stakeOpen, setStakeOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

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
            onClick={handleStakeClick}
            selected={location.pathname.startsWith("/stake")}
          >
            <StyledListItemIcon>
              <AccountBalanceWalletIcon />
            </StyledListItemIcon>
            {sidebarOpen && <StyledListItemText primary='Stake' />}
            {sidebarOpen && (stakeOpen ? <ExpandLess /> : <ExpandMore />)}
          </StyledListItemButton>
          <Collapse in={stakeOpen && sidebarOpen} timeout='auto' unmountOnExit>
            <List component='div' disablePadding>
              <StyledSubListItemButton
                selected={isCurrentRoute("/stake")}
                onClick={() => handleNavigation("/stake")}
              >
                <StyledListItemText primary='Pools List' />
              </StyledSubListItemButton>
              <StyledSubListItemButton
                selected={isCurrentRoute("/stake/create-pool")}
                onClick={() => handleNavigation("/stake/create-pool")}
              >
                <StyledListItemText primary='Create Pool' />
              </StyledSubListItemButton>
              <StyledSubListItemButton
                selected={isCurrentRoute("/stake/create-option")}
                onClick={() => handleNavigation("/stake/create-option")}
              >
                <StyledListItemText primary='Create Staking Option' />
              </StyledSubListItemButton>
            </List>
          </Collapse>
          <StyledListItemButton disabled>
            <StyledListItemIcon>
              <SwapHorizIcon />
            </StyledListItemIcon>
            {sidebarOpen && (
              <StyledListItemText
                primary='Swap'
                secondary='Coming Soon'
                sx={{
                  "& .MuiListItemText-secondary": {
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "0.75rem",
                  },
                }}
              />
            )}
          </StyledListItemButton>
        </List>
      </SidebarContainer>
    </>
  );
};
