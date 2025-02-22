import { createTheme } from '@mui/material/styles';
import './styles/fonts.css';

export const theme = createTheme({
  typography: {
    fontFamily: [
      'Gotham',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif'
    ].join(','),
    h4: {
      fontFamily: 'Gotham',
      fontWeight: 'normal',
      fontStyle: 'italic',
      letterSpacing: '0.02em',
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Gotham';
          src: url('../assets/fonts/GothamNarrow-Medium.otf') format('opentype');
          font-weight: normal;
          font-style: italic;
          font-display: swap;
        }
      `,
    },
  },
  palette: {
    mode: 'dark',
    primary: { main: '#9c27b0' },
    secondary: { main: '#7b1fa2' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

export default theme;