const { ethers } = require("hardhat");

async function deployOpenDirective(agent, dTokenAddress, name = "OpenDirectiveVault", symbol = "ODV") {
  const OpenDirective = await ethers.getContractFactory("OpenDirective");
  const openDirective = await OpenDirective.deploy(agent, dTokenAddress, name, symbol);
  await openDirective.waitForDeployment();
  console.log("OpenDirective deployed at:", openDirective.target);
  // Save address to contractAddresses.js
  const fs = require('fs');
  const path = require('path');
  const addressesPath = path.join(__dirname, 'contractAddresses.js');
  let addresses = require(addressesPath);
  addresses.OPEN_DIRECTIVE_ADDRESS = openDirective.target;
  fs.writeFileSync(addressesPath, 'module.exports = ' + JSON.stringify(addresses, null, 2) + ';\n');
  return openDirective.target;
}

module.exports = { deployOpenDirective };
