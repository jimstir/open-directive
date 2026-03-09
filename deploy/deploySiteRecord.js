const { ethers } = require("hardhat");

async function deploySiteRecord(proposalNum, owner, agent, tokenAddress) {
  const SiteRecord = await ethers.getContractFactory("SiteRecord");
  const siteRecord = await SiteRecord.deploy(proposalNum, owner, agent, tokenAddress);
  await siteRecord.waitForDeployment();
  console.log("SiteRecord deployed at:", siteRecord.target);
  // Save address to contractAddresses.js
  const fs = require('fs');
  const path = require('path');
  const addressesPath = path.join(__dirname, 'contractAddresses.js');
  let addresses = require(addressesPath);
  addresses.SITE_RECORD_ADDRESS = siteRecord.target;
  fs.writeFileSync(addressesPath, 'module.exports = ' + JSON.stringify(addresses, null, 2) + ';\n');
  return siteRecord.target;
}

module.exports = { deploySiteRecord };
