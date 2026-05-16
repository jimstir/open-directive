

import React, { useState, useEffect, useRef } from 'react';

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || '';
}

function App() {

  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [status, setStatus] = useState('');
  const [dapp, setDapp] = useState('');
  const [report, setReport] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef();

  // Listen for popup's wallet info request (for iframe communication)
  useEffect(() => {
    function handleMessage(event) {
      console.log('[WalletInteraction] Received message event:', event);
      // Only respond to REQUEST_WALLET_INFO
      if (event.data && event.data.type === 'REQUEST_WALLET_INFO') {
        // Respond to the source window (popup)
        event.source.postMessage({ type: 'WALLET_INFO', address, network }, event.origin);
        console.log('[WalletInteraction] Responded to REQUEST_WALLET_INFO:', address, network, 'to', event.origin);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [address, network]);

  // On mount, check for query params
  useEffect(() => {
    setDapp(getQueryParam('dapp'));
    setReport(getQueryParam('report'));
  }, []);

  // On mount, check if already connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          window.ethereum.request({ method: 'net_version' }).then(net => {
            setNetwork(net);
            // Store in chrome.storage.local for popup to read
            console.log('[WalletInteraction] Saving to storage:', accounts[0], net);
            if (window.chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({ od_wallet_address: accounts[0], od_wallet_network: net }, () => {
                console.log('[WalletInteraction] chrome.storage.local set complete');
              });
            } else {
              window.localStorage.setItem('od_wallet_address', accounts[0]);
              window.localStorage.setItem('od_wallet_network', net);
              console.log('[WalletInteraction] localStorage set complete');
            }
          });
        } else {
          console.log('[WalletInteraction] No accounts found');
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(accounts[0]);
        setStatus('Wallet connected!');
        const net = await window.ethereum.request({ method: 'net_version' });
        setNetwork(net);
        // Store in chrome.storage.local for popup to read
        if (window.chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ od_wallet_address: accounts[0], od_wallet_network: net });
        } else {
          window.localStorage.setItem('od_wallet_address', accounts[0]);
          window.localStorage.setItem('od_wallet_network', net);
        }
        if (window.opener) {
          window.opener.postMessage({ type: 'WALLET_CONNECTED', address: accounts[0], network: net }, '*');
        }
      } catch (err) {
        setStatus('Connection failed: ' + (err.message || err));
      }
    } else {
      setStatus('MetaMask not detected.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setFileContent(evt.target.result);
    };
    reader.readAsText(file);
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  // Simulate addValidatorReport transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting transaction...');
    setSubmitted(false);
    try {
      // Convert amount to wei (ERC20 decimals, assume 18)
      const decimals = 18;
      const amountWei = BigInt(Math.floor(Number(amount) * 10 ** decimals)).toString();
      // Simulate contract call (replace with ethers.js logic)
      // await contract.addValidatorReport(report, fileContent, amountWei);
      setStatus('Transaction submitted!');
      setSubmitted(true);
    } catch (err) {
      setStatus('Transaction failed: ' + (err.message || err));
    }
  };

  // Wallet info always at top
  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: 32, background: 'rgba(255,255,255,0.03)', borderRadius: 18, boxShadow: '0 24px 60px rgba(15,23,42,0.18),0 0 0 1px rgba(148,163,184,0.08)' }}>
      <div style={{ marginBottom: 18, borderBottom: '1px solid #333', paddingBottom: 12 }}>
        <div style={{ color: '#ffd600', fontWeight: 600, fontSize: 15 }}>
          {address ? (
            <>
              Connected: <span style={{ color: '#fff' }}>{address}</span>
              {network && <span style={{ color: '#a0a0b8', marginLeft: 8 }}>(Network: {network})</span>}
            </>
          ) : (
            'No wallet connected'
          )}
        </div>
      </div>

      {/* If not connected, show connect button */}
      {!address && (
        <>
          <button onClick={connectWallet} style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer', marginBottom: 18, width: '100%' }}>
            Connect Wallet
          </button>
          <div style={{ color: '#fff', minHeight: 24 }}>{status}</div>
        </>
      )}

      {/* If connected and no dapp/report params, show connected message */}
      {address && !dapp && !report && (
        <div style={{ color: '#27ae60', fontWeight: 600, fontSize: 18, textAlign: 'center', margin: '32px 0' }}>You're Connected!</div>
      )}

      {/* If connected and dapp/report params, show widget */}
      {address && (dapp || report) && (
        <div style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 12, color: '#fff', fontWeight: 500 }}>
            <div><span style={{ color: '#a0a0b8' }}>dApp Address:</span> {dapp || <span style={{ color: '#888' }}>—</span>}</div>
            <div><span style={{ color: '#a0a0b8' }}>Report Address:</span> {report || <span style={{ color: '#888' }}>—</span>}</div>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ color: '#fff', fontWeight: 500 }}>
              Report Data (.json):
              <input
                type="file"
                accept=".json,application/json"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ marginTop: 8, marginBottom: 8 }}
              />
            </label>
            {fileContent && (
              <textarea
                value={fileContent}
                readOnly
                rows={4}
                style={{ width: '100%', fontSize: 13, background: '#23272f', color: '#ffd600', border: '1px solid #444', borderRadius: 6, padding: 8, marginBottom: 8 }}
              />
            )}
            <label style={{ color: '#fff', fontWeight: 500 }}>
              Amount (ERC20, decimals auto):
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={handleAmountChange}
                style={{ marginTop: 8, marginBottom: 8, width: '100%', fontSize: 15, borderRadius: 6, border: '1px solid #444', padding: 8 }}
                placeholder="Enter amount"
                required
              />
            </label>
            <button type="submit" style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginTop: 8 }}>
              Submit
            </button>
            {submitted && <div style={{ color: '#27ae60', fontWeight: 600, textAlign: 'center' }}>Submitted!</div>}
            <div style={{ color: '#fff', minHeight: 24 }}>{status}</div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
