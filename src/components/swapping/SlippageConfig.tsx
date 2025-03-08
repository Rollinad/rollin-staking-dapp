import React, { useState } from "react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";

// Interface for the component props
interface SlippageConfigProps {
  slippageBps: number;
  onSlippageChange: (slippageBps: number) => void;
  isAutoSlippage: boolean;
  onAutoSlippageChange: (isAuto: boolean) => void;
}

export const SlippageConfig: React.FC<SlippageConfigProps> = ({
  slippageBps,
  onSlippageChange,
  isAutoSlippage,
  onAutoSlippageChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [customSlippage, setCustomSlippage] = useState<string>(
    isAutoSlippage ? "" : (slippageBps / 100).toString()
  );
  const [inputError, setInputError] = useState<string>("");

  // Handle opening the popover
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle closing the popover
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle toggle between auto and custom slippage
  const handleSlippageTypeChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: string | null
  ) => {
    if (newValue === null) return; // Prevent deselection
    const isAuto = newValue === "auto";
    onAutoSlippageChange(isAuto);
    
    if (isAuto) {
      // If switching to auto, clear the custom value
      setCustomSlippage("");
    } else {
      // If switching to custom, set it to current slippage
      setCustomSlippage((slippageBps / 100).toString());
    }
  };

  // Handle custom slippage input change
  const handleCustomSlippageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    
    // Only allow numbers and decimal points
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCustomSlippage(value);
      
      // Validate input
      if (value === "") {
        setInputError("Please enter a value");
        return;
      }
      
      const numValue = parseFloat(value);
      if (numValue <= 0) {
        setInputError("Must be > 0");
      } else if (numValue > 100) {
        setInputError("Must be ≤ 100");
      } else {
        setInputError("");
        // Convert percentage to basis points (1% = 100 bps)
        onSlippageChange(Math.round(numValue * 100));
      }
    }
  };

  // Predefined slippage options in percentage (0.1%, 0.5%, 1%)
  const predefinedOptions = [0.1, 0.5, 1];

  // Check if popover is open
  const open = Boolean(anchorEl);
  const id = open ? "slippage-popover" : undefined;

  // Common styles
  const primaryColor = "#8a2be2"; // Deep purple
  const backgroundColor = "#1a1a1a"; // Dark background
  const borderRadius = "12px"; // Consistent border radius

  return (
    <>
      <Tooltip title="Configure Slippage">
        <IconButton
          onClick={handleClick}
          sx={{
            color: "#fff",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            padding: "8px",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(138, 43, 226, 0.15)",
            },
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        PaperProps={{
          sx: {
            borderRadius,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            p: 2.5,
            width: 300,
            bgcolor: backgroundColor,
            color: "#fff",
          }}
        >
          <Typography 
            sx={{ 
              mb: 2.5, 
              fontWeight: 600,
              fontSize: "1rem"
            }}
          >
            Slippage Tolerance
          </Typography>
          
          <ToggleButtonGroup
            value={isAutoSlippage ? "auto" : "custom"}
            exclusive
            onChange={handleSlippageTypeChange}
            sx={{ 
              mb: 2, 
              width: "100%",
              "& .MuiToggleButtonGroup-grouped": {
                borderRadius: "8px !important",
                border: "none !important",
                mx: 0.5,
                overflow: "hidden",
                "&:first-of-type": {
                  ml: 0,
                },
                "&:last-of-type": {
                  mr: 0,
                },
              }
            }}
          >
            <ToggleButton
              value="auto"
              sx={{
                flex: 1,
                py: 1,
                color: isAutoSlippage ? "#fff" : "rgba(255, 255, 255, 0.6)",
                backgroundColor: isAutoSlippage
                  ? `${primaryColor}90`
                  : "rgba(255, 255, 255, 0.05)",
                "&.Mui-selected": {
                  backgroundColor: `${primaryColor}90`,
                },
                "&:hover": {
                  backgroundColor: isAutoSlippage 
                    ? `${primaryColor}90` 
                    : "rgba(255, 255, 255, 0.1)",
                },
                transition: "all 0.2s ease",
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Auto
            </ToggleButton>
            <ToggleButton
              value="custom"
              sx={{
                flex: 1,
                py: 1,
                color: !isAutoSlippage ? "#fff" : "rgba(255, 255, 255, 0.6)",
                backgroundColor: !isAutoSlippage
                  ? `${primaryColor}90`
                  : "rgba(255, 255, 255, 0.05)",
                "&.Mui-selected": {
                  backgroundColor: `${primaryColor}90`,
                },
                "&:hover": {
                  backgroundColor: !isAutoSlippage 
                    ? `${primaryColor}90` 
                    : "rgba(255, 255, 255, 0.1)",
                },
                transition: "all 0.2s ease",
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Custom
            </ToggleButton>
          </ToggleButtonGroup>
          
          {!isAutoSlippage && (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 2,
                }}
              >
                {predefinedOptions.map((option) => (
                  <Box
                    key={option}
                    onClick={() => {
                      setCustomSlippage(option.toString());
                      onSlippageChange(option * 100); // Convert to basis points
                      setInputError("");
                    }}
                    sx={{
                      p: 1.5,
                      flex: "1 0 auto",
                      textAlign: "center",
                      borderRadius: "8px",
                      backgroundColor:
                        parseFloat(customSlippage) === option
                          ? `${primaryColor}90`
                          : "rgba(255, 255, 255, 0.05)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: parseFloat(customSlippage) === option
                          ? `${primaryColor}90`
                          : "rgba(255, 255, 255, 0.1)",
                      },
                      fontWeight: 500,
                    }}
                  >
                    {option}%
                  </Box>
                ))}
              </Box>
              
              <TextField
                fullWidth
                value={customSlippage}
                onChange={handleCustomSlippageChange}
                error={!!inputError}
                helperText={inputError}
                placeholder="Custom slippage"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                  sx: {
                    color: "#fff",
                    height: "48px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    padding: "0 12px",
                    "& .MuiInputAdornment-root": {
                      color: "rgba(255, 255, 255, 0.6)",
                    },
                  },
                }}
                FormHelperTextProps={{
                  sx: {
                    color: "#ff6b6b",
                    mt: 1,
                    ml: 0.5,
                  },
                }}
                variant="filled"
                sx={{
                  mt: 1,
                  "& .MuiFilledInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                    },
                    "&:before, &:after": {
                      display: "none",
                    },
                    borderRadius: "8px",
                  },
                  "& input": {
                    color: "#fff",
                    padding: "12px",
                  },
                }}
              />
            </>
          )}
          
          {isAutoSlippage && (
            <Box
              sx={{
                p: 2,
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                mt: 1,
              }}
            >
              <Typography sx={{ 
                color: "rgba(255, 255, 255, 0.8)", 
                fontSize: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}>
                <span>Auto slippage will adjust based on market conditions.</span>
                <span style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Current setting:</span>
                  <span style={{ 
                    color: "#fff", 
                    fontWeight: 600,
                    backgroundColor: `${primaryColor}50`,
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}>
                    {slippageBps / 100}%
                  </span>
                </span>
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};