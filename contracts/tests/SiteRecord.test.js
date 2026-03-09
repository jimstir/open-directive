const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SiteRecord", function () {
  let directiveToken, siteRecord, owner, agent;

  before(async function () {
    [owner, agent] = await ethers.getSigners();
    const DirectiveToken = await ethers.getContractFactory("DirectiveToken");
    directiveToken = await DirectiveToken.deploy("OpenDirectiveToken", "ODT", ethers.parseEther("1000000"));
    await directiveToken.waitForDeployment();

    const SiteRecord = await ethers.getContractFactory("SiteRecord");
    siteRecord = await SiteRecord.deploy(1, owner.address, agent.address, directiveToken.target);
    await siteRecord.waitForDeployment();
  });

  it("should deploy SiteRecord and DirectiveToken", async function () {
    expect(siteRecord.target).to.be.properAddress;
    expect(directiveToken.target).to.be.properAddress;
  });

  // Add more tests for SiteRecord contract logic here
});
