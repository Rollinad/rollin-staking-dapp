import { Box, keyframes, styled } from "@mui/material";
import { lightTheme } from "@rainbow-me/rainbowkit";

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

export const AnimatedBackground = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(-45deg, #9c27b0, #673ab7, #7b1fa2, #4a148c);
  background-size: 400% 400%;
  animation: ${gradientAnimation} 15s ease infinite;
`;

export const customTheme = lightTheme({
  accentColor: '#9C27B0',
  accentColorForeground: 'white',
  borderRadius: 'large',
  overlayBlur: 'small',
});