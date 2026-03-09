console.log('Working script loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  
  // Subscription contract setup
  // Import deployed address
  // NOTE: Replace with actual ABI import or inline ABI
  const SUBSCRIPTION_ADDRESS = 'YOUR_SUBSCRIPTION_CONTRACT_ADDRESS';
  const SUBSCRIPTION_ABI = [
    {
      "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
      "name": "getMonthsLeft",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const popupNotify = document.getElementById('popupNotify');

  async function checkSubscription(address) {
    if (!window.ethereum) return false;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(SUBSCRIPTION_ADDRESS, SUBSCRIPTION_ABI, provider);
      const months = await contract.getMonthsLeft(address);
      return months > 0;
    } catch (err) {
      return false;
    }
  }

  function showNotify(message) {
    popupNotify.textContent = message;
    popupNotify.classList.add('show');
    setTimeout(() => popupNotify.classList.remove('show'), 3500);
  }

  // Endpoint addresses (replace with actual values or import from endpoints.js)
  const GUARD_ENDPOINT = 'YOUR_GUARD_ENDPOINT';
  const REPORT_ENDPOINT = 'YOUR_REPORT_ENDPOINT';

  // Helper to get current tab URL
  async function getCurrentTabUrl() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          resolve(tabs[0].url);
        } else {
          resolve('');
        }
      });
    });
  }

  // View Latest Report button - subscription check and send request
  const viewReportBtn = document.getElementById('viewReportBtn');
  if (viewReportBtn) {
    viewReportBtn.addEventListener('click', async function() {
      if (!window.ethereum) {
        showNotify('Wallet not detected.');
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      const subscribed = await checkSubscription(address);
      if (!subscribed) {
        showNotify('You need to subscribe to access reports.');
        return;
      }
      const url = await getCurrentTabUrl();
      // Send request to endpoint
      fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, url })
      });
      chrome.tabs.create({url: chrome.runtime.getURL('report.html')});
    });
  }

  // Guard button - subscription check and send request
  const guardBtn = document.getElementById('guardBtn');
  guardBtn.addEventListener('click', async () => {
    if (!window.ethereum) {
      showNotify('Wallet not detected.');
      return;
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    const subscribed = await checkSubscription(address);
    if (!subscribed) {
      showNotify('You need to subscribe to use Guard.');
      return;
    }
    const url = await getCurrentTabUrl();
    // Send request to endpoint
    fetch(GUARD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, url })
    });
    const loadingUrl = chrome.runtime.getURL('loading.html');
    chrome.tabs.create({ url: loadingUrl });
  });

  // Subscribe button handler
  const subscribePopupBtn = document.getElementById('subscribePopupBtn');
  if (subscribePopupBtn) {
    subscribePopupBtn.addEventListener('click', () => {
      const subscribeUrl = chrome.runtime.getURL('subscribe.html');
      chrome.tabs.create({ url: subscribeUrl });
    });
  }
  
  // Alert toggle - simplified working version
  const alertToggle = document.getElementById('alertToggle');
  if (alertToggle) {
    alertToggle.addEventListener('change', function() {
      console.log('Alert toggle changed');
    });
  }

  // MetaMask connect wallet functionality via external connecting.html
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const walletInfo = document.getElementById('walletInfo');
  const CONNECTING_PAGE_URL = 'http://localhost:8080/client-extension/connecting.html';
  let connectWindow = null;

  // Listen for connection result from connecting.html
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || data.type !== 'WALLET_CONNECTED' || !data.address) return;

    const address = data.address;

    if (connectWalletBtn) {
      connectWalletBtn.classList.add('connected');
      connectWalletBtn.textContent = 'Wallet Connected';
    }
    if (walletInfo) {
      walletInfo.innerHTML = `<div>Address: ${address}</div>`;
    }
    // Optionally close the popup window
    if (connectWindow && !connectWindow.closed) {
      connectWindow.close();
    }
  });

  if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', () => {
      connectWindow = window.open(
        CONNECTING_PAGE_URL,
        'walletConnectPopup',
        'width=480,height=640'
      );
      if (walletInfo) {
        walletInfo.textContent = 'Opening wallet connection window...';
      }
    });
  }
});
