const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VerifierRewards", function () {
  let directiveToken, verifierRewards, owner, verifier;

  before(async function () {
    [owner, verifier] = await ethers.getSigners();
    const DirectiveToken = await ethers.getContractFactory("DirectiveToken");
    directiveToken = await DirectiveToken.deploy("OpenDirectiveToken", "ODT", ethers.parseEther("1000000"));
    await directiveToken.waitForDeployment();

    const VerifierRewards = await ethers.getContractFactory("VerifierRewards");
    verifierRewards = await VerifierRewards.deploy(verifier.address, directiveToken.target, owner.address);
    await verifierRewards.waitForDeployment();
  });

  it("should deploy VerifierRewards and DirectiveToken", async function () {
    expect(verifierRewards.target).to.be.properAddress;
    expect(directiveToken.target).to.be.properAddress;
  });

  // Add more tests for VerifierRewards contract logic here
});
