// subscribe.js

// Load configuration
let CONFIG = {};
try {
  // This will be loaded from config.js
  CONFIG = window.OD_CONFIG || {
    CONNECTING_PAGE_URL: 'http://localhost:8080/connecting.html',
    CONNECT_BASE_URL: 'http://localhost:8080'
  };
} catch (e) {
  console.log('Config not loaded, using defaults');
}

// Import deployed address at the top level using dynamic import or assume it's available, but let's just fetch it normally or use a hardcoded address if dynamic import is complex. Since this is a browser module, we can change the script tag, BUT wait, if we change the script tag to type="module", we can use top-level await. Since we can't do that easily without breaking things, I'll use dynamic import for contractAddresses.js.
window.addEventListener('DOMContentLoaded', async () => {
  const priceElem = document.getElementById('currentPrice');
  const subscribeForm = document.getElementById('subscribeForm');
  const statusElem = document.getElementById('subscribeStatus');

  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const walletInfo = document.getElementById('walletInfo');
  let connectWindow = null;

  let provider, signer, contract;
  let subscriptionAddress = '';

  try {
    const deployModule = await import('./contractAddresses.js');
    subscriptionAddress = deployModule.SUBSCRIPTION_ADDRESS;
  } catch (e) {
    console.error('Failed to import contract addresses', e);
  }

  const subscriptionABI = [
    // Minimal ABI for getPrice and subscribe
    {
      "inputs": [],
      "name": "getPrice",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
      "name": "subscribe",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  // Listen for wallet connection result from connecting.html

  // Session logic: check if wallet is already connected
  function getSession() {
    const session = localStorage.getItem('od_wallet_session');
    if (!session) return null;
    const parsed = JSON.parse(session);
    if (Date.now() > parsed.expires) {
      localStorage.removeItem('od_wallet_session');
      return null;
    }
    return parsed;
  }

  function setConnectedUI(address) {
    if (connectWalletBtn) {
      connectWalletBtn.classList.add('connected');
      connectWalletBtn.textContent = 'Connected';
      connectWalletBtn.style.background = '#888';
      connectWalletBtn.disabled = true;
    }
    if (walletInfo) {
      walletInfo.innerHTML = `<div>Address: ${address}</div>`;
    }
  }

  // On load, check session
  const session = getSession();
  if (session && session.address) {
    setConnectedUI(session.address);
  }

  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (!data || data.type !== 'WALLET_CONNECTED' || !data.address) return;
    setConnectedUI(data.address);

    // When we have an address, initialize ethers + contract and fetch price
    if (typeof ethers !== 'undefined' && subscriptionAddress) {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        contract = new ethers.Contract(subscriptionAddress, subscriptionABI, signer);

        if (priceElem) {
          try {
            const price = await contract.getPrice();
            priceElem.textContent = ethers.formatEther(price) + ' ODT';
          } catch (err) {
            priceElem.textContent = 'Error fetching price';
          }
        }
      } catch (err) {
        console.error('Failed to init contract after wallet connect', err);
      }
    }

    if (connectWindow && !connectWindow.closed) {
      connectWindow.close();
    }
  });

  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      console.log('Opening wallet connection URL:', CONFIG.CONNECTING_PAGE_URL);
      connectWindow = window.open(
        CONFIG.CONNECTING_PAGE_URL,
        'walletConnectSubscribe',
        'width=480,height=640'
      );
      if (walletInfo) {
        walletInfo.textContent = 'Opening wallet connection window...';
      }
    });
  }

  // Handle subscribe form
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('amountInput');
      const amount = amountInput ? amountInput.value : 0;
      if (statusElem) statusElem.textContent = 'Processing...';

      if (!contract) {
        if (statusElem) statusElem.textContent = 'Wallet not connected or contract not loaded.';
        return;
      }

      try {
        const tx = await contract.subscribe(ethers.parseEther(amount.toString()));
        await tx.wait();
        if (statusElem) statusElem.textContent = 'Subscription successful!';
      } catch (err) {
        if (statusElem) statusElem.textContent = 'Subscription failed: ' + err.message;
      }
    });
  }
});
