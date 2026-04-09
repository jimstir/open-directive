// Fuji RPC
const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
// URL where connecting.html is hosted (adjust the port/path to match your local server)
// Expecting server root at project root, so connecting.html is under /client-extension/
const CONNECTING_PAGE_URL = "http://localhost:8080/client-extension/connecting.html";

const createBtn = document.getElementById('createBtn');
const walletInfo = document.getElementById('walletInfo');
const walletBanner = document.getElementById('walletBanner');
const status = document.getElementById('status');
let connectWindow = null;

// Listen for messages from connecting.html (wallet connect + deploy results)
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  // Wallet connection result
  if (data.type === 'WALLET_CONNECTED' && data.address) {
    const address = data.address;
    window.selectedAccount = address;

    if (createBtn) {
      createBtn.classList.add('connected');
      createBtn.textContent = 'Wallet Connected';
    }
    if (walletInfo) {
      walletInfo.innerHTML = `<div>Address: ${address}</div>`;
    }
    if (walletBanner) {
      walletBanner.textContent = `Connected: ${address}`;
    }
    if (status) {
      status.textContent = `Wallet connected: ${address}`;
    }
  }

  // Deployment result
  if (data.type === 'DEPLOY_RESULT') {
    const { contract, address, success, message } = data;
    if (status) {
      if (!success) {
        status.textContent = `Deployment failed for ${contract || 'contract'}: ${message || 'Unknown error'}`;
      } else {
        status.textContent = `Deployment successful for ${contract}.\nContract Address: ${address}\n(Note: simulated deployment)`;
        try {
          if (contract && address) {
            localStorage.setItem(`${contract}_address`, address);
            status.textContent += '\nAddress saved to local storage.';
          }
        } catch (e) {
          status.textContent += `\nFailed to save address: ${e.message}`;
        }
      }
    }
  }

  // Close the connecting window if it is still open
  if (connectWindow && !connectWindow.closed) {
    connectWindow.close();
  }
});

// Initialize wallet connection on page load
window.addEventListener('load', async () => {
  console.log('Page loaded, checking for Web3 providers...');
  console.log('window.ethereum (extension page):', typeof window.ethereum);

  if (createBtn) {
    createBtn.onclick = () => {
      // Open the connecting.html page on localhost to perform the MetaMask connection
      connectWindow = window.open(
        CONNECTING_PAGE_URL,
        'walletConnect',
        'width=480,height=640'
      );

      if (status) {
        status.textContent = 'Opening wallet connection window...';
      }
    };
  }
});

  // Save contract address to prototype.env using File System Access API
  async function saveAddressToEnv(contract, address) {
    // Map scriptName to env variable
    const envMap = {
      deployOpenDirective: 'OPEN_DIRECTIVE_ADDRESS',
      deploySiteRecord: 'SITE_RECORD_ADDRESS',
      deploySubscription: 'SUBSCRIPTION_ADDRESS',
      deployVerifierRewards: 'VERIFIER_REWARDS_ADDRESS',
      deployDirectiveToken: 'DIRECTIVE_TOKEN_ADDRESS'
    };
    const envVar = envMap[contract];
    if (!envVar) throw new Error('Unknown contract type');

    // Prompt user to select prototype.env file
    if (!window.envFileHandle) {
      window.envFileHandle = await window.showOpenFilePicker({
        types: [{ description: 'Env File', accept: { 'text/plain': ['.env'] } }],
        multiple: false
      }).then(handles => handles[0]);
    }
    const fileHandle = window.envFileHandle;
    const file = await fileHandle.getFile();
    let text = await file.text();

    // Update the env variable
    const regex = new RegExp(`^${envVar}=.*$`, 'm');
    if (regex.test(text)) {
      text = text.replace(regex, `${envVar}=${address}`);
    } else {
      text += `\\n${envVar}=${address}`;
    }

    // Write back to file
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
  }

const buttons = {
  deployOpenDirective: 'deployOpenDirective',
  deploySiteRecord: 'deploySiteRecord',
  deploySubscription: 'deploySubscription',
  deployVerifierRewards: 'deployVerifierRewards',
  deployDirectiveToken: 'deployDirectiveToken'
};

Object.keys(buttons).forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.onclick = () => {
    if (status) {
      status.textContent = `Opening deployment window for ${id}...`;
    }
    connectWindow = window.open(
      `${CONNECTING_PAGE_URL}?contract=${encodeURIComponent(id)}`,
      `deploy_${id}`,
      'width=480,height=640'
    );
  };
});
