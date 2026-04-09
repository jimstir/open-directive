// All logic from the previous inline <script> in connecting.html
// (Paste the entire script content here, unchanged except for removal of <script> tags)

// Session logic: store wallet and subscription status for 1 hour
function setSession(address, subscribed) {
  const session = {
    address,
    subscribed,
    expires: Date.now() + 3600 * 1000
  };
  localStorage.setItem('od_wallet_session', JSON.stringify(session));
}
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
async function connectMetaMask() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not found. Make sure you opened this page in a normal browser tab (https:// or http://localhost), not as an extension.');
  }
  // Switch to Avalanche Fuji Testnet first
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xa869' }], // Fuji Testnet
    });
    console.log('Switched to Avalanche Fuji Testnet');
  } catch (switchError) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xa869',
            chainName: 'Avalanche Fuji Testnet',
            rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
            nativeCurrency: {
              name: 'AVAX',
              symbol: 'AVAX',
              decimals: 18,
            },
            blockExplorerUrls: ['https://subnets-test.avax.network/'],
          }],
        });
        console.log('Added Avalanche Fuji Testnet');
      } catch (addError) {
        console.error('Failed to add Fuji Testnet:', addError);
      }
    } else {
      console.error('Failed to switch to Fuji Testnet:', switchError);
    }
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned from MetaMask.');
  }
  return accounts[0];
}
function getContractFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('contract') || '';
  } catch {
    return '';
  }
}
// Map deploy keys used by deploy.html to artifact paths and constructor args
const DEPLOY_CONFIG = {
  // Example: deploy DirectiveToken exactly like deploy/deployDirectiveToken.js
  deployDirectiveToken: {
    artifactPath: '../artifacts/contracts/DirectiveToken.sol/DirectiveToken.json',
    getArgs: async () => {
      // Defaults from deployDirectiveToken.js
      const name = 'OpenDirectiveToken';
      const symbol = 'ODT';
      const initialSupply = ethers.parseEther('1000000');
      return [name, symbol, initialSupply];
    },
    envVar: 'DIRECTIVE_TOKEN_ADDRESS'
  }
  // Other contracts (OpenDirective, SiteRecord, Subscription, VerifierRewards)
  // can be added here later with their artifactPath + getArgs
};
async function saveAddressToEnv(contractKey, address, statusEl) {
  const cfg = DEPLOY_CONFIG[contractKey];
  const envVar = cfg && cfg.envVar;
  if (!envVar) return;
  try {
    if (!window.showOpenFilePicker) {
      statusEl.textContent += '\nCannot update prototype.env: File System Access API not available in this browser.';
      return;
    }
    if (!window.envFileHandle) {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Env File',
            accept: { 'text/plain': ['.env', '.txt', '.env.local', '.env.example'] }
          }
        ],
        multiple: false
      });
      window.envFileHandle = handle;
    }
    const fileHandle = window.envFileHandle;
    const file = await fileHandle.getFile();
    let text = await file.text();
    const regex = new RegExp(`^${envVar}=.*$`, 'm');
    if (regex.test(text)) {
      text = text.replace(regex, `${envVar}=${address}`);
    } else {
      text += `\n${envVar}=${address}`;
    }
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
    statusEl.textContent += '\nAddress saved to prototype.env.';
  } catch (e) {
    statusEl.textContent += `\nFailed to update prototype.env: ${e.message}`;
  }
}
async function deployWithMetaMask(contractKey, statusEl) {
  const cfg = DEPLOY_CONFIG[contractKey];
  if (!cfg) {
    throw new Error('Unsupported contract type for browser deployment: ' + contractKey);
  }
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask not found. Open this page in a normal browser tab (https:// or http://localhost).');
  }
  if (typeof ethers === 'undefined' || !ethers.BrowserProvider) {
    throw new Error('Ethers.js not loaded.');
  }
  // Ensure we're on Fuji Testnet before deploying
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xa869' }], // Fuji Testnet
    });
    console.log('Ensuring deployment on Avalanche Fuji Testnet');
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xa869',
            chainName: 'Avalanche Fuji Testnet',
            rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
            nativeCurrency: {
              name: 'AVAX',
              symbol: 'AVAX',
              decimals: 18,
            },
            blockExplorerUrls: ['https://subnets-test.avax.network/'],
          }],
        });
        console.log('Added Avalanche Fuji Testnet');
      } catch (addError) {
        console.error('Failed to add Fuji Testnet:', addError);
      }
    } else {
      console.error('Failed to switch to Fuji Testnet:', switchError);
    }
  }
  // Connect provider + signer from MetaMask
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  // Optional: show current network
  try {
    const net = await provider.getNetwork();
    statusEl.textContent = `Connected to network: chainId=${net.chainId.toString()}. Deploying...`;
  } catch {
    statusEl.textContent = 'Deploying...';
  }
  // Load artifact (ABI + bytecode) from Hardhat build
  const res = await fetch(cfg.artifactPath);
  if (!res.ok) {
    throw new Error('Failed to load contract artifact: ' + cfg.artifactPath);
  }
  const artifact = await res.json();
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;
  if (!abi || !bytecode) {
    throw new Error('Artifact missing abi or bytecode.');
  }
  const args = cfg.getArgs ? await cfg.getArgs() : [];
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy(...args);
  statusEl.textContent = 'Transaction sent. Waiting for deployment...';
  await contract.waitForDeployment();
  const deployedAddress = await contract.getAddress();
  return deployedAddress;
}
window.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectWalletBtn'); // Fixed: was connectBtn
  const connectStatus = document.getElementById('status'); // Fixed: was connectStatus
  const walletNotification = document.getElementById('walletAddress'); // Fixed: was walletNotification
  const subscriptionNotification = document.getElementById('walletInfo'); // Fixed: was subscriptionNotification
  const backPrompt = document.getElementById('backPrompt');
  const backBtn = document.getElementById('backBtn');
  const actionButtons = document.getElementById('actionButtons');
  const guardBtn = document.getElementById('guardBtn');
  const viewReportBtn = document.getElementById('viewReportBtn');
  const subscribeBtn = document.getElementById('subscribeBtn');
  
  // Restore session if available
  const session = getSession();
  if (session && session.address) {
    connectStatus.textContent = 'Wallet already connected.';
    walletNotification.textContent = `Wallet: ${session.address}`;
    subscriptionNotification.textContent = session.subscribed ? 'Subscription active.' : 'No active subscription.';
    if (backPrompt) backPrompt.style.display = 'block';
    if (actionButtons) actionButtons.style.display = 'block';
    if (guardBtn) guardBtn.style.display = session.subscribed ? 'inline-block' : 'none';
    if (viewReportBtn) viewReportBtn.style.display = session.subscribed ? 'inline-block' : 'none';
    if (subscribeBtn) subscribeBtn.style.display = !session.subscribed ? 'inline-block' : 'none';
    if (connectBtn) connectBtn.style.display = 'none';
  }
  
  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      if (connectStatus) connectStatus.textContent = 'Connecting...';
      if (walletNotification) walletNotification.textContent = '';
      if (subscriptionNotification) subscriptionNotification.textContent = '';
      try {
        const address = await connectMetaMask();
        if (connectStatus) connectStatus.textContent = 'Wallet connection successful.';
        if (walletNotification) walletNotification.textContent = `Wallet: ${address}`;
        
        // Notify the opener (extension) about the connected wallet
        if (window.opener) {
          window.opener.postMessage(
            { type: 'WALLET_CONNECTED', address },
            '*'
          );
        }
        
        // Fetch subscription status from Subscription contract
        let subscribed = false;
        let monthsLeft = 0;
        try {
          // Load contract address from contractAddresses.js
          let contractAddresses = {};
          try {
            contractAddresses = await import('./contractAddresses.js');
          } catch (e) {
            contractAddresses = require('./contractAddresses.js');
          }
          const SUBSCRIPTION_ADDRESS = contractAddresses.SUBSCRIPTION_ADDRESS || '';
          const SUBSCRIPTION_ABI = [
            {
              "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
              "name": "getMonthsLeft",
              "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
              "stateMutability": "view",
              "type": "function"
            }
          ];
          if (SUBSCRIPTION_ADDRESS && typeof ethers !== 'undefined') {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(SUBSCRIPTION_ADDRESS, SUBSCRIPTION_ABI, provider);
            monthsLeft = await contract.getMonthsLeft(address);
            subscribed = monthsLeft > 0;
          }
        } catch (e) {
          subscribed = false;
          monthsLeft = 0;
        }
        if (subscriptionNotification) subscriptionNotification.textContent = subscribed ? `Subscription active (${monthsLeft} months left).` : 'No active subscription.';
        setSession(address, subscribed);
        if (backPrompt) backPrompt.style.display = 'block';
        if (actionButtons) actionButtons.style.display = 'block';
        if (guardBtn) guardBtn.style.display = subscribed ? 'inline-block' : 'none';
        if (viewReportBtn) viewReportBtn.style.display = subscribed ? 'inline-block' : 'none';
        if (subscribeBtn) subscribeBtn.style.display = !subscribed ? 'inline-block' : 'none';
        if (connectBtn) connectBtn.style.display = 'none';
      } catch (err) {
        console.error(err);
        if (walletNotification) walletNotification.textContent = 'No wallet connected';
        const msg = err && err.code === 4001
          ? 'Connection rejected by user.'
          : (err.message || 'Connection failed.');
        if (connectStatus) connectStatus.textContent = 'Connection failed: ' + msg;
      }
    });
  }
  backBtn.addEventListener('click', () => {
    window.close();
  });
  // Action button handlers (simulate or implement actual logic)
  guardBtn.addEventListener('click', () => {
    alert('Guard action!');
  });
  viewReportBtn.addEventListener('click', () => {
    alert('View Report action!');
  });
  subscribeBtn.addEventListener('click', () => {
    alert('Subscribe action!');
  });
});
