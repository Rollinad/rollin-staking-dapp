import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMediaQuery } from "@mui/material";

export const CustomConnectButton = () => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:900px)');

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const commonButtonStyles = {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          color: '#ffffff',
          padding: isMobile ? '8px 12px' : '12px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
        };

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!mounted || !account || !chain) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    style={commonButtonStyles}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    Connect Wallet
                  </button>
                );
              }

              return (
                <div style={{ display: 'flex', gap: isMobile ? '6px' : '12px' }}>
                  <button
                    onClick={openChainModal}
                    type="button"
                    style={{
                      ...commonButtonStyles,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 'fit-content',
                      padding: isMobile ? '8px' : '12px 20px', // Smaller padding on mobile
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: isMobile ? '20px' : '24px',
                          height: isMobile ? '20px' : '24px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: '100%', height: '100%' }}
                          />
                        )}
                      </div>
                    )}
                    {!isMobile && chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    style={{
                      ...commonButtonStyles,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 'fit-content',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {!isMobile && (
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {account.displayBalance ?? 0}
                      </span>
                    )}
                    <span style={{ 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: isMobile ? '100px' : isTablet ? '120px' : '140px',
                    }}>
                      {account.displayName}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};