import { Avatar, Box, Button, Tooltip } from "@mui/material";
import { Token } from "../../hooks/useTokens";
import { KeyboardArrowDown, VerifiedUser } from "@mui/icons-material";
import { tokenButtonStyle } from "./styles";

export const TokenButton = ({
  token,
  onClick,
}: {
  token: Token;
  onClick: () => void;
}) => (
  <Button
    variant='contained'
    sx={tokenButtonStyle}
    endIcon={<KeyboardArrowDown />}
    onClick={onClick}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {token.logoURI ? (
        <img
          src={token.logoURI}
          alt={token.symbol}
          style={{ width: 24, height: 24, borderRadius: "50%" }}
        />
      ) : (
        <Avatar
          src={token.logoURI}
          sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        >
          {token.symbol.charAt(0)}
        </Avatar>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {token.symbol}
        {token.verified && (
          <Tooltip title='Verified Token'>
            <VerifiedUser
              sx={{
                fontSize: 16,
                color: "#00e676",
                ml: 0.5,
              }}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  </Button>
);
