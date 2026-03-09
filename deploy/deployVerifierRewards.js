const { ethers } = require("hardhat");

async function deployVerifierRewards(verifier, tokenAddress, owner) {
  const VerifierRewards = await ethers.getContractFactory("VerifierRewards");
  const verifierRewards = await VerifierRewards.deploy(verifier, tokenAddress, owner);
  await verifierRewards.waitForDeployment();
  console.log("VerifierRewards deployed at:", verifierRewards.target);
  // Save address to contractAddresses.js
  const fs = require('fs');
  const path = require('path');
  const addressesPath = path.join(__dirname, 'contractAddresses.js');
  let addresses = require(addressesPath);
  addresses.VERIFIER_REWARDS_ADDRESS = verifierRewards.target;
  fs.writeFileSync(addressesPath, 'module.exports = ' + JSON.stringify(addresses, null, 2) + ';\n');
  return verifierRewards.target;
}

module.exports = { deployVerifierRewards };
