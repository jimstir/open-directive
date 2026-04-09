import React, { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { SUBSCRIPTION_ABI } from '../abi/subscription';

// Subscription contract addresses by network (from env or config)
const SUBSCRIPTION_CONTRACTS = {
  mainnet: {
    address: import.meta.env.VITE_SUBSCRIPTION_MAINNET,
    rpc: import.meta.env.VITE_MAINNET_RPC_URL,
    name: 'Ethereum Mainnet',
    chainId: 1
  },
  sepolia: {
    address: import.meta.env.VITE_SUBSCRIPTION_SEPOLIA,
    rpc: import.meta.env.VITE_SEPOLIA_RPC_URL,
    name: 'Ethereum Sepolia',
    chainId: 11155111
  },
  fuji: {
    address: import.meta.env.VITE_SUBSCRIPTION_FUJI,
    rpc: import.meta.env.VITE_FUJI_RPC_URL,
    name: 'Avalanche Fuji',
    chainId: 43113
  }
};

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || '';
}

function WalletInteraction() {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [status, setStatus] = useState('');
  const [dapp, setDapp] = useState('');
  const [report, setReport] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [action, setAction] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('sepolia');
  const [monthsLeft, setMonthsLeft] = useState(null);
  const [checkingSub, setCheckingSub] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  // Listen for popup/report page wallet info request (for iframe communication)
  useEffect(() => {
    function handleMessage(event) {
      // Only respond to REQUEST_WALLET_INFO
      if (event.data && event.data.type === 'REQUEST_WALLET_INFO') {
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
    setAction(getQueryParam('action'));
  }, []);
  // Subscription contract addresses by network
  const SUBSCRIPTION_CONTRACTS = {
    mainnet: {
      address: '0xMAINNET_SUBSCRIPTION_ADDRESS',
      rpc: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      name: 'Ethereum Mainnet',
      chainId: 1
    },
    sepolia: {
      address: '0xSEPOLIA_SUBSCRIPTION_ADDRESS',
      rpc: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      name: 'Ethereum Sepolia',
      chainId: 11155111
    },
    fuji: {
      address: '0xFUJI_SUBSCRIPTION_ADDRESS',
      rpc: 'https://api.avax-test.network/ext/bc/C/rpc',
      name: 'Avalanche Fuji',
      chainId: 43113
    }
  };

  // ABI now imported from ../abi/subscription.js

  // When action=subscribe and address, fetch months left
  // Fetch months left and monthly price
  useEffect(() => {
    if (action === 'subscribe' && address) {
      setCheckingSub(true);
      setPriceLoading(true);
      const net = SUBSCRIPTION_CONTRACTS[selectedNetwork];
      if (!net) return;
      const provider = new ethers.JsonRpcProvider(net.rpc);
      const contract = new ethers.Contract(net.address, SUBSCRIPTION_ABI, provider);
      contract.getMonthsLeft(address)
        .then((months) => {
          setMonthsLeft(Number(months));
          setCheckingSub(false);
        })
        .catch((err) => {
          setStatus('Error checking subscription: ' + (err.message || err));
          setCheckingSub(false);
        });
      contract.getPrice()
        .then((price) => {
          setMonthlyPrice(Number(price));
          setPriceLoading(false);
        })
        .catch((err) => {
          setStatus('Error fetching price: ' + (err.message || err));
          setPriceLoading(false);
        });
    }
  }, [action, address, selectedNetwork]);
  // Handle subscribe button click
  const handleSubscribe = async () => {
    setSubmitting(true);
    setStatus('');
    try {
      if (!window.ethereum) throw new Error('MetaMask not detected');
      const net = SUBSCRIPTION_CONTRACTS[selectedNetwork];
      if (!net) throw new Error('Network not found');
      // Switch network if needed
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + net.chainId.toString(16) }]
      });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(net.address, SUBSCRIPTION_ABI, signer);
      // Convert amount to BigInt (ERC20 decimals, assume 18)
      const decimals = 18;
      const amountWei = BigInt(Math.floor(Number(amount) * 10 ** decimals)).toString();
      const tx = await contract.subscribe(amountWei);
      setStatus('Transaction sent: ' + tx.hash);
      await tx.wait();
      setStatus('Subscription successful!');
      setSubmitted(true);
    } catch (err) {
      setStatus('Subscription failed: ' + (err.message || err));
    }
    setSubmitting(false);
  };

  // Handle report generation (action=generatereport)
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setStatus('Submitting report...');
    setSubmitted(false);
    try {
      // Simulate contract call (replace with actual addValidatorReport logic)
      // For now, just show success after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus('Report submitted! (Simulated)');
      setSubmitted(true);
    } catch (err) {
      setStatus('Report submission failed: ' + (err.message || err));
    }
  };

  // On mount, check if already connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          window.ethereum.request({ method: 'net_version' }).then(net => {
            setNetwork(net);
            // Store in chrome.storage.local for popup to read
            if (window.chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({ od_wallet_address: accounts[0], od_wallet_network: net });
            } else {
              window.localStorage.setItem('od_wallet_address', accounts[0]);
              window.localStorage.setItem('od_wallet_network', net);
            }
          });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting transaction...');
    setSubmitted(false);
    try {
      const decimals = 18;
      const amountWei = BigInt(Math.floor(Number(amount) * 10 ** decimals)).toString();
      setStatus('Transaction submitted!');
      setSubmitted(true);
    } catch (err) {
      setStatus('Transaction failed: ' + (err.message || err));
    }
  };

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
      {/* Network dropdown for subscription */}
      {action === 'subscribe' && (
        <div style={{ marginBottom: 18 }}>
          <label style={{ color: '#fff', fontWeight: 500, marginRight: 8 }}>Select Network:</label>
          <select value={selectedNetwork} onChange={e => setSelectedNetwork(e.target.value)} style={{ fontSize: 15, padding: 6, borderRadius: 6 }}>
            <option value="mainnet">Ethereum Mainnet</option>
            <option value="sepolia">Ethereum Sepolia</option>
            <option value="fuji">Avalanche Fuji</option>
          </select>
        </div>
      )}
      {/* Subscription widget */}
      {action === 'subscribe' && address && (
        <div style={{ margin: '18px 0', color: '#fff', fontWeight: 500 }}>
          {checkingSub ? (
            <div>Checking subscription status...</div>
          ) : monthsLeft !== null ? (
            <div>Months left on subscription: <span style={{ color: '#ffd600' }}>{monthsLeft}</span></div>
          ) : (
            <div>Unable to check subscription status.</div>
          )}
          {priceLoading ? (
            <div>Loading monthly price...</div>
          ) : monthlyPrice !== null ? (
            <div>Monthly Price: <span style={{ color: '#ffd600' }}>{monthlyPrice}</span> (raw units)</div>
          ) : null}
          <div style={{ margin: '12px 0' }}>
            <label style={{ color: '#fff', fontWeight: 500, marginRight: 8 }}>Amount (ERC20, decimals auto):</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ fontSize: 15, borderRadius: 6, border: '1px solid #444', padding: 8, width: 180 }}
              placeholder="Enter amount"
              required
            />
          </div>
          <button
            onClick={handleSubscribe}
            style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', marginTop: 8, width: '100%' }}
            disabled={submitting || !amount}
          >
            {submitting ? 'Subscribing...' : 'Subscribe'}
          </button>
          <div style={{ color: '#fff', minHeight: 24, marginTop: 8 }}>{status}</div>
        </div>
      )}
      {/* Report generation widget for action=generatereport */}
      {action === 'generatereport' && address && (
        <div style={{ marginTop: 18 }}>
          <div style={{ marginBottom: 12, color: '#fff', fontWeight: 500 }}>
            <div><span style={{ color: '#a0a0b8' }}>dApp Address:</span> {dapp || <span style={{ color: '#888' }}>—</span>}</div>
            <div><span style={{ color: '#a0a0b8' }}>Report Address:</span> {report || <span style={{ color: '#888' }}>—</span>}</div>
          </div>
          <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              Generate Report
            </button>
            {submitted && <div style={{ color: '#27ae60', fontWeight: 600, textAlign: 'center' }}>Report Submitted!</div>}
            <div style={{ color: '#fff', minHeight: 24 }}>{status}</div>
          </form>
        </div>
      )}

      {/* Default widgets for dapp/report or connected */}
      {!action && address && !dapp && !report && (
        <div style={{ color: '#27ae60', fontWeight: 600, fontSize: 18, textAlign: 'center', margin: '32px 0' }}>You're Connected!</div>
      )}
      {!action && address && (dapp || report) && (
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
      {!address && (
        <>
          <button onClick={connectWallet} style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer', marginBottom: 18, width: '100%' }}>
            Connect Wallet
          </button>
          <div style={{ color: '#fff', minHeight: 24 }}>{status}</div>
        </>
      )}
    </div>
  );
}

export default WalletInteraction;
