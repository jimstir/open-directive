const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Subscription", function () {
  let directiveToken, subscription, owner;

  before(async function () {
    [owner] = await ethers.getSigners();
    const DirectiveToken = await ethers.getContractFactory("DirectiveToken");
    directiveToken = await DirectiveToken.deploy("OpenDirectiveToken", "ODT", ethers.parseEther("1000000"));
    await directiveToken.waitForDeployment();

    const Subscription = await ethers.getContractFactory("Subscription");
    subscription = await Subscription.deploy(directiveToken.target, 100, 1);
    await subscription.waitForDeployment();
  });

  it("should deploy Subscription and DirectiveToken", async function () {
    expect(subscription.target).to.be.properAddress;
    expect(directiveToken.target).to.be.properAddress;
  });

  // Add more tests for Subscription contract logic here
});
