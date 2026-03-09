// subscribe.js

// Import deployed address at the top level using dynamic import or assume it's available, but let's just fetch it normally or use a hardcoded address if dynamic import is complex. Since this is a browser module, we can change the script tag, BUT wait, if we change the script tag to type="module", we can use top-level await. Since we can't do that easily without breaking things, I'll use dynamic import for contractAddresses.js.
window.addEventListener('DOMContentLoaded', async () => {
  const priceElem = document.getElementById('currentPrice');
  const subscribeForm = document.getElementById('subscribeForm');
  const statusElem = document.getElementById('subscribeStatus');

  const connectWalletBtn = document.getElementById('connectWalletBtn');
  const walletInfo = document.getElementById('walletInfo');
  const CONNECTING_PAGE_URL = 'http://localhost:8080/client-extension/connecting.html';
  let connectWindow = null;

  let provider, signer, contract;
  let subscriptionAddress = '';

  try {
    const deployModule = await import('../deploy/contractAddresses.js');
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
  window.addEventListener('message', async (event) => {
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
      connectWindow = window.open(
        CONNECTING_PAGE_URL,
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
