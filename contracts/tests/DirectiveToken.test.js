const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DirectiveToken", function () {
  let directiveToken, owner, addr1;

  before(async function () {
    [owner, addr1] = await ethers.getSigners();
    const DirectiveToken = await ethers.getContractFactory("DirectiveToken");
    directiveToken = await DirectiveToken.deploy("OpenDirectiveToken", "ODT", ethers.parseEther("1000000"));
    await directiveToken.waitForDeployment();
  });

  it("should deploy DirectiveToken", async function () {
    expect(directiveToken.target).to.be.properAddress;
  });

  // Add more tests for DirectiveToken contract logic here
});
