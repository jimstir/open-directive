const { execSync } = require('child_process');

/**
 * Deploy SiteRecord contract and call proposalOpen on OpenDirective
 * @param {string} url - The URL to propose
 * @param {string} providerUrl - The RPC provider URL
 * @param {string} userAddress - The address of the user making the proposal
 * @returns {Promise<{siteRecordAddress: string, proposalNum: number}>}
 */
async function deploy_site_record_and_propose(url, providerUrl, userAddress) {
  // 1. Deploy SiteRecord contract
  let siteRecordAddress;
  try {
    // Assumes deploySiteRecord.js outputs the address to stdout
    const output = execSync(`node ../../deploy/deploySiteRecord.js --url "${url}" --owner "${userAddress}"`, { encoding: 'utf8' });
    siteRecordAddress = output.trim();
  } catch (err) {
    throw new Error('SiteRecord deployment failed: ' + err.message);
  }

  // 2. Call proposalOpen on OpenDirective
  const openDirectiveAddress = contractAddresses.OPEN_DIRECTIVE_ADDRESS;
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const openDirective = new ethers.Contract(openDirectiveAddress, OPEN_DIRECTIVE_ABI, provider);

  // proposalOpen params
  const amount = 0;
  const policy = siteRecordAddress;
  const owner = userAddress;
  const token = ethers.ZeroAddress;
  // proposalOpen is external, so must be called via signer
  const signer = provider.getSigner(userAddress);
  const openDirectiveWithSigner = openDirective.connect(signer);
  let proposalNum;
  try {
    const tx = await openDirectiveWithSigner.proposalOpen(amount, policy, owner, token, url);
    const receipt = await tx.wait();
    // Find proposalNum from event logs
    const event = receipt.logs.find(l => l.address.toLowerCase() === openDirectiveAddress.toLowerCase());
    proposalNum = event ? event.args?.proposalNum : null;
  } catch (err) {
    throw new Error('proposalOpen failed: ' + err.message);
  }

  return { siteRecordAddress, proposalNum };
}

// ...existing code...
module.exports = { extractContractAddresses, check_recent_review, deploy_site_record_and_propose };
// --- Analyst Workflow: check_recent_review ---
const { ethers } = require('ethers');
const contractAddresses = require('../../deploy/contractAddresses');

const OPEN_DIRECTIVE_ABI = [
  {
    "inputs": [{ "internalType": "string", "name": "url", "type": "string" }],
    "name": "checkURL",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "url", "type": "bytes32" }],
    "name": "urlProposalNum",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "proposal", "type": "uint256" }],
    "name": "getProposalInfo",
    "outputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "withdrawAmount", "type": "uint256" },
      { "internalType": "address", "name": "receiver", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "address", "name": "policy", "type": "address" },
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "string", "name": "url", "type": "string" }
    ],
    "name": "proposalOpen",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const SITE_RECORD_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "getAnalystReport",
    "outputs": [
      {"internalType": "bytes32", "name": "data", "type": "bytes32"},
      {"internalType": "address", "name": "submitter", "type": "address"},
      {"internalType": "uint256", "name": "time", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function check_recent_review(url, providerUrl) {
  const openDirectiveAddress = contractAddresses.OPEN_DIRECTIVE_ADDRESS;
  const provider = new ethers.JsonRpcProvider(providerUrl);
  const openDirective = new ethers.Contract(openDirectiveAddress, OPEN_DIRECTIVE_ABI, provider);

  // Step 1: checkUrl
  const urlHash = ethers.keccak256(ethers.toUtf8Bytes(url));
  const urlExists = await openDirective.checkUrl(urlHash);
  if (!urlExists) return { check_recent_review: false };

  // Step 2: urlProposalNum
  const proposalNum = await openDirective.urlProposalNum(urlHash);

  // Step 3: getProposalInfo
  const [, , receiver] = await openDirective.getProposalInfo(proposalNum);

  // Step 4: getAnalystReport from SiteRecord
  const siteRecord = new ethers.Contract(receiver, SITE_RECORD_ABI, provider);
  const report = await siteRecord.getAnalystReport(proposalNum);
  const { data, submitter, time } = report;

  // Step 5: check if report is recent
  const now = Math.floor(Date.now() / 1000);
  const isRecent = (now - time) < (15 * 24 * 60 * 60);

  return {
    check_recent_review: isRecent,
    data,
    submitter,
    time,
    proposalNum,
    receiver
  };
}

module.exports = { extractContractAddresses, check_recent_review };
// extract_contract_addresses.js
// Tool to extract smart contract addresses from a web3 app URL
// This template uses Node.js and can be expanded to call blockchain indexers and audit tools

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extract Ethereum contract addresses from a web3 app URL
 * @param {string} url - The web3 app URL to inspect
 * @returns {Promise<string[]>} - Array of contract addresses
 */
async function extractContractAddresses(url, queueNumber = 1) {
  // Fetch page content
  const response = await axios.get(url);
  const html = response.data;

  // Find Ethereum addresses in HTML
  const ethAddressPattern = /0x[a-fA-F0-9]{40}/g;
  const addresses = new Set(html.match(ethAddressPattern) || []);

  // Parse metadata and scripts
  const $ = cheerio.load(html);
  $('meta').each((_, meta) => {
    const content = $(meta).attr('content') || '';
    (content.match(ethAddressPattern) || []).forEach(addr => addresses.add(addr));
  });
  $('script').each((_, script) => {
    const scriptContent = $(script).html() || '';
    (scriptContent.match(ethAddressPattern) || []).forEach(addr => addresses.add(addr));
  });

  // After collecting addresses, try to find transaction targets and related contracts
  const allAddresses = await findTransactionTargetsAndRelatedContracts(url, addresses);

  // After collecting addresses, detect proxy contracts
  const proxyContracts = await detectProxyContracts(Array.from(allAddresses));

  // Format output as JSON
  return formatOutput(url, Array.from(allAddresses), proxyContracts, queueNumber);
}

/**
 * Detect proxy contracts using blockchain indexer APIs
 * @param {string[]} addresses - Array of contract addresses
 * @returns {Promise<string[]>} - Array of proxy contract addresses
 */
async function detectProxyContracts(addresses) {
  // TODO: Integrate with a blockchain indexer (e.g., Etherscan, BlockScout, Alchemy, etc.)
  // For each address, check if it is a proxy contract by inspecting its implementation address or using indexer metadata
  // Example (pseudo-code):
  // for (const addr of addresses) {
  //   const contractInfo = await getContractInfoFromIndexer(addr);
  //   if (contractInfo.isProxy) {
  //     proxyContracts.push(addr);
  //   }
  // }
  // Return proxy contracts found
  return []; // Replace with actual implementation
}

/**
 * Attempt to find contract addresses the user would interact with (transaction targets)
 * Also find related contracts (factory, implementation, etc.)
 * Note: Network monitoring should be done via automated browser (e.g., Puppeteer/Playwright), not user's browser.
 * @param {string} url - The web3 app URL
 * @param {Set<string>} addresses - Set of discovered contract addresses
 * @returns {Promise<Set<string>>} - Updated set of contract addresses
 */
async function findTransactionTargetsAndRelatedContracts(url, addresses) {
  // TODO: Use browser automation to simulate user actions and inspect network requests
  // Do NOT use user's browser network requests
  // 1. Monitor network requests for contract addresses in API responses or transaction payloads
  // 2. Look for contract addresses in frontend JavaScript variables/configs
  // 3. If factory patterns are detected, try to find implementation addresses
  // 4. If contracts are generated per user, look for contract creation events or endpoints
  // Example (pseudo-code):
  // const transactionTargets = await monitorUserActionsAndExtractAddresses(url);
  // transactionTargets.forEach(addr => addresses.add(addr));
  // const relatedContracts = await findRelatedContracts(addresses);
  // relatedContracts.forEach(addr => addresses.add(addr));
  return addresses; // Replace with actual implementation
}

/**
 * Format output as JSON with all relevant metadata
 * @param {string} url
 * @param {string[]} contractAddresses
 * @param {string[]} proxyContracts
 * @param {number} queueNumber
 * @returns {object}
 */
function formatOutput(url, contractAddresses, proxyContracts, queueNumber) {
  return {
    website: url,
    requestQueueNumber: queueNumber,
    contractAddresses: contractAddresses,
    proxyContracts: proxyContracts,
    timestamp: new Date().toISOString(),
    totalContracts: contractAddresses.length,
    totalProxies: proxyContracts.length
    // Add more metadata as needed
  };
}

// Example usage
if (require.main === module) {
  const testUrl = 'https://example-dapp.com';
  const queueNumber = 1;
  extractContractAddresses(testUrl, queueNumber)
    .then(result => {
      if (result.contractAddresses.length === 0) {
        console.log('Sorry, no smart contracts found.');
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    })
    .catch(err => {
      console.error('Error extracting contract addresses:', err);
    });
}

module.exports = extractContractAddresses;
