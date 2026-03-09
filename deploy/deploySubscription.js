const { ethers } = require("hardhat");

async function deploySubscription(tokenAddress, initialPrice, proposalNum) {
  const Subscription = await ethers.getContractFactory("Subscription");
  const subscription = await Subscription.deploy(tokenAddress, initialPrice, proposalNum);
  await subscription.waitForDeployment();
  console.log("Subscription deployed at:", subscription.target);
  // Save address to contractAddresses.js
  const fs = require('fs');
  const path = require('path');
  const addressesPath = path.join(__dirname, 'contractAddresses.js');
  let addresses = require(addressesPath);
  addresses.SUBSCRIPTION_ADDRESS = subscription.target;
  fs.writeFileSync(addressesPath, 'module.exports = ' + JSON.stringify(addresses, null, 2) + ';\n');
  return subscription.target;
}

module.exports = { deploySubscription };
