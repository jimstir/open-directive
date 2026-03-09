const { ethers } = require("hardhat");
const { deployDirectiveToken } = require("./deployDirectiveToken");
const { deployOpenDirective } = require("./deployOpenDirective");

async function createNewDirective(agent, name = "OpenDirectiveToken", symbol = "ODT", initialSupply = ethers.parseEther("1000000"), vaultName = "OpenDirectiveVault", vaultSymbol = "ODV") {
  // Deploy DirectiveToken
  const dTokenAddress = await deployDirectiveToken(name, symbol, initialSupply);
  // Deploy OpenDirective with DirectiveToken address
  const openDirectiveAddress = await deployOpenDirective(agent, dTokenAddress, vaultName, vaultSymbol);
  console.log("New Directive created:", {
    directiveToken: dTokenAddress,
    openDirective: openDirectiveAddress
  });
  return {
    directiveToken: dTokenAddress,
    openDirective: openDirectiveAddress
  };
}

module.exports = { createNewDirective };
