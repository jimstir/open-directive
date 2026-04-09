import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Wraps a component and redirects to /walletinteraction if wallet not connected.
 * Provides address/network as props to children (function-as-child pattern).
 * Usage: <RequireWallet>{({address, network}) => <Report address={address} network={network} />}</RequireWallet>
 */
function RequireWallet({ children }) {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    // Try chrome.storage.local first, fallback to localStorage
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['od_wallet_address', 'od_wallet_network'], (result) => {
        const addr = result.od_wallet_address || window.localStorage.getItem('od_wallet_address');
        const net = result.od_wallet_network || window.localStorage.getItem('od_wallet_network');
        setAddress(addr);
        setNetwork(net);
        if (!addr) navigate('/walletinteraction', { replace: true });
      });
    } else {
      const addr = window.localStorage.getItem('od_wallet_address');
      const net = window.localStorage.getItem('od_wallet_network');
      setAddress(addr);
      setNetwork(net);
      if (!addr) navigate('/walletinteraction', { replace: true });
    }
  }, [navigate]);

  if (!address) return null;
  // Children is a function: ({address, network}) => ...
  return typeof children === 'function' ? children({ address, network }) : children;
}

export default RequireWallet;
