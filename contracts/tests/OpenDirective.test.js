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

  it("should reflect direct transfers in share price and redemptions", async function () {
    // Initial deposit by addr1
    await directiveToken.connect(owner).transfer(addr1.address, ethers.parseEther("1000"));
    await directiveToken.connect(addr1).approve(openDirective.target, ethers.parseEther("1000"));
    await openDirective.connect(addr1).deposit(ethers.parseEther("1000"), addr1.address);

    // Check initial share price (should be 1:1)
    let totalAssets = await openDirective.totalAssets();
    let totalSupply = await openDirective.totalSupply();
    expect(totalAssets).to.equal(ethers.parseEther("1000"));
    expect(totalSupply).to.equal(ethers.parseEther("1000"));

    // Direct transfer of rewards to the vault (simulating yield)
    await directiveToken.connect(owner).transfer(openDirective.target, ethers.parseEther("500"));

    // Share price should increase
    totalAssets = await openDirective.totalAssets();
    totalSupply = await openDirective.totalSupply();
    expect(totalAssets).to.equal(ethers.parseEther("1500"));
    expect(totalSupply).to.equal(ethers.parseEther("1000"));

    // New depositor gets fewer shares per asset
    await directiveToken.connect(owner).transfer(addr1.address, ethers.parseEther("1000"));
    await directiveToken.connect(addr1).approve(openDirective.target, ethers.parseEther("1000"));
    const previewShares = await openDirective.previewDeposit(ethers.parseEther("1000"));
    // Should be less than 1000 shares since share price increased
    expect(previewShares).to.be.lt(ethers.parseEther("1000"));

    // Redeem shares and check received assets
    await openDirective.connect(addr1).approve(openDirective.target, ethers.parseEther("1000"));
    const assetsReceived = await openDirective.connect(addr1).redeem(ethers.parseEther("1000"), addr1.address, addr1.address);
    // Should receive all assets in the vault
    const finalBalance = await directiveToken.balanceOf(addr1.address);
    expect(finalBalance).to.be.closeTo(ethers.parseEther("1500"), ethers.parseEther("0.0001"));
  });
});
