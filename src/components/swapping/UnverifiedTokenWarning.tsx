import { Typography } from "@mui/material";
import { Token } from "../../hooks/useTokens";

export const UnverifiedTokenWarning = ({ token }: { token: Token }) =>
  !token.verified && (
    <Typography
      sx={{
        color: "#ffb74d",
        fontSize: "0.875rem",
        mt: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      ⚠️ Unverified token - Trade with caution
    </Typography>
  );
