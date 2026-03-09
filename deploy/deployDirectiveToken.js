const { ethers } = require("hardhat");

async function deployDirectiveToken(name = "OpenDirectiveToken", symbol = "ODT", initialSupply = ethers.parseEther("1000000")) {
  const DirectiveToken = await ethers.getContractFactory("DirectiveToken");
  const directiveToken = await DirectiveToken.deploy(name, symbol, initialSupply);
  await directiveToken.waitForDeployment();
  console.log("DirectiveToken deployed at:", directiveToken.target);
  // Save address to contractAddresses.js
  const fs = require('fs');
  const path = require('path');
  const addressesPath = path.join(__dirname, 'contractAddresses.js');
  let addresses = require(addressesPath);
  addresses.DIRECTIVE_TOKEN_ADDRESS = directiveToken.target;
  fs.writeFileSync(addressesPath, 'module.exports = ' + JSON.stringify(addresses, null, 2) + ';\n');
  return directiveToken.target;
}

module.exports = { deployDirectiveToken };
