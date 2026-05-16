// Subscription ABI for frontend contract calls (auto-synced with compiled contract)
export const SUBSCRIPTION_ABI = [
  { "inputs": [ { "internalType": "address", "name": "tokenAddress", "type": "address" }, { "internalType": "uint256", "name": "initialPrice", "type": "uint256" }, { "internalType": "uint256", "name": "direct", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [ { "internalType": "address", "name": "user", "type": "address" } ], "name": "getMonthsLeft", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getPrice", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getProposal", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getRewards", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getSubscribers", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "liqudate", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "oracleAddr", "type": "address" } ], "name": "setOracle", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "price", "type": "uint256" } ], "name": "setPrice", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "subscribe", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "subscriptions", "outputs": [ { "internalType": "uint256", "name": "paidMonths", "type": "uint256" }, { "internalType": "uint256", "name": "lastPaidTimestamp", "type": "uint256" }, { "internalType": "uint256", "name": "subNum", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "tokensOwned", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "verifier", "type": "address" } ], "name": "verifierAddrs", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "nonpayable", "type": "function" }
];
