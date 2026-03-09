const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OpenDirective", function () {
  let directiveToken, openDirective, owner, addr1;

  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    const DirectiveToken = await ethers.getContractFactory("DirectiveToken");
    directiveToken = await DirectiveToken.deploy("OpenDirectiveToken", "ODT", ethers.parseEther("1000000"));
    await directiveToken.waitForDeployment();

    const OpenDirective = await ethers.getContractFactory("OpenDirective");
    openDirective = await OpenDirective.deploy(owner.address, directiveToken.target, "OpenDirectiveVault", "ODV");
    await openDirective.waitForDeployment();
  });

  it("should deploy DirectiveToken and OpenDirective", async function () {
    expect(directiveToken.target).to.be.properAddress;
    expect(openDirective.target).to.be.properAddress;
  });

  // Add more tests for OpenDirective contract logic here
});
