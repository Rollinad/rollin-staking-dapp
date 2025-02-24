import { Avatar, Box, Button, Tooltip, CircularProgress } from "@mui/material";
import { Token } from "../../hooks/useTokens";
import { KeyboardArrowDown, VerifiedUser } from "@mui/icons-material";
import { tokenButtonStyle } from "./styles";

interface TokenButtonProps {
  token: Token;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const TokenButton = ({
  token,
  onClick,
  disabled = false,
  loading = false,
}: TokenButtonProps) => (
  <Button
    variant="contained"
    sx={{
      ...tokenButtonStyle,
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
    }}
    endIcon={loading ? null : <KeyboardArrowDown />}
    onClick={onClick}
    disabled={disabled}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {loading ? (
        <CircularProgress size={24} sx={{ color: "#fff" }} />
      ) : token.logoURI ? (
        <img
          src={token.logoURI}
          alt={token.symbol}
          style={{ 
            width: 24, 
            height: 24, 
            borderRadius: "50%",
            filter: disabled ? "grayscale(50%)" : "none"
          }}
        />
      ) : (
        <Avatar
          src={token.logoURI}
          sx={{ 
            backgroundColor: disabled 
              ? "rgba(255, 255, 255, 0.05)" 
              : "rgba(255, 255, 255, 0.1)",
            width: 24,
            height: 24,
            fontSize: '0.75rem'
          }}
        >
          {token.symbol.charAt(0)}
        </Avatar>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {token.symbol}
        {token.verified && (
          <Tooltip title="Verified Token">
            <VerifiedUser
              sx={{
                fontSize: 16,
                color: disabled ? "rgba(0, 230, 118, 0.5)" : "#00e676",
                ml: 0.5,
              }}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  </Button>
);