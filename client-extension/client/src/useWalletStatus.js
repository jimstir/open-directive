// React hook to check wallet connection status from the wallet interaction page (via postMessage)
import { useEffect, useState } from 'react';

/**
 * useWalletStatus - checks if wallet interaction page is connected (via postMessage)
 * @param {string} walletInteractionUrl - URL of the wallet interaction page (e.g. http://localhost:5173)
 * @returns { status, address, network, loading }
 */
export default function useWalletStatus(walletInteractionUrl) {
  const [status, setStatus] = useState('loading'); // 'loading', 'connected', 'not_connected', 'error'
  const [address, setAddress] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    // Only create one iframe per hook instance
    let iframe = document.getElementById('walletStatusIframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.id = 'walletStatusIframe';
      iframe.src = walletInteractionUrl;
      document.body.appendChild(iframe);
    }
    function handleMessage(event) {
      // Accept both localhost and deployed origins
      if (!event.origin.startsWith(walletInteractionUrl) && !event.origin.startsWith('http://localhost')) return;
      const data = event.data;
      if (data && data.type === 'WALLET_INFO') {
        if (data.address) {
          setStatus('connected');
          setAddress(data.address);
          setNetwork(data.network);
        } else {
          setStatus('not_connected');
        }
      }
    }
    window.addEventListener('message', handleMessage);
    iframe.onload = function() {
      iframe.contentWindow.postMessage({ type: 'REQUEST_WALLET_INFO' }, '*');
    };
    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      // Only remove the iframe if this hook created it
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };
  }, [walletInteractionUrl]);

  return { status, address, network, loading: status === 'loading' };
}
