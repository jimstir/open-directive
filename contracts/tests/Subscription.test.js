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

  it("should allow a user to subscribe and track their subscription", async function () {
    const [owner, user1, user2] = await ethers.getSigners();
    // Mint tokens to user1
    await directiveToken.connect(owner).mintToken(user1.address, ethers.parseEther("1000"));
    // Approve subscription contract to spend user1's tokens
    await directiveToken.connect(user1).approve(subscription.target, ethers.parseEther("100"));
    // Get price and decimals logic from contract
    const price = await subscription.getPrice();
    const tokenPrice = price; // No oracle set, so tokenPrice = price
    const decimals = 18;
    const tokenAmountPerMonth = price * (10n ** BigInt(decimals)) / tokenPrice;
    // User1 subscribes for 1 month
    await expect(subscription.connect(user1).subscribe(tokenAmountPerMonth))
      .to.emit(subscription, "Subscribed").withArgs(user1.address, 1, tokenAmountPerMonth);

    // Check months left for user1
    const monthsLeft = await subscription.getMonthsLeft(user1.address);
    expect(monthsLeft).to.equal(1);

    // Check that user2 (not subscribed) has 0 months left
    const monthsLeft2 = await subscription.getMonthsLeft(user2.address);
    expect(monthsLeft2).to.equal(0);

    // Check that getSubscribers returns 1
    const count = await subscription.getSubscribers();
    expect(count).to.equal(1);
  });

  it("should allow different parties to check if a wallet has a subscription", async function () {
    const [owner, user1, user2, checker] = await ethers.getSigners();
    // Mint tokens to user2
    await directiveToken.connect(owner).mintToken(user2.address, ethers.parseEther("2000"));
    await directiveToken.connect(user2).approve(subscription.target, ethers.parseEther("2000"));
    // Get price and decimals logic from contract
    const price = await subscription.getPrice();
    const tokenPrice = price;
    const decimals = 18;
    const tokenAmountPerMonth = price * (10n ** BigInt(decimals)) / tokenPrice;
    // User2 subscribes for 2 months
    const twoMonths = tokenAmountPerMonth * 2n;
    await subscription.connect(user2).subscribe(twoMonths);
    // Checker checks user2's subscription
    const months = await subscription.connect(checker).getMonthsLeft(user2.address);
    expect(months).to.equal(2);
    // Checker checks user1 (should be 0)
    const months1 = await subscription.connect(checker).getMonthsLeft(user1.address);
    expect(months1).to.equal(0);
  });

  it("should not allow subscribing with insufficient funds or without approval", async function () {
    const [owner, user3] = await ethers.getSigners();
    // user3 has no tokens
    await expect(subscription.connect(user3).subscribe(ethers.parseEther("100"))).to.be.revertedWithCustomError;
    // Mint tokens but do not approve
    await directiveToken.connect(owner).mintToken(user3.address, ethers.parseEther("100"));
    await expect(subscription.connect(user3).subscribe(ethers.parseEther("100"))).to.be.reverted;
  });
});
