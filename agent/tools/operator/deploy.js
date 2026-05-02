// operator/deploy.js
// Deploys contracts in the required order using environment variables from project.env
// Order: DirectiveToken -> OpenDirective (needs DirectiveToken address) -> SiteRecord (needs OpenDirective address) -> Subscription (needs OpenDirective address) -> Rewards

require('dotenv').config({ path: '../../project.env' });

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const { Token, CurrencyAmount, Percent, nearestUsableTick, TickMath, encodeSqrtRatioX96 } = require('@uniswap/v3-sdk');
const { Token: CoreToken } = require('@uniswap/sdk-core');

// Uniswap ABIs
const NonfungiblePositionManagerABI = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json').abi;
const UniswapV3FactoryABI = [ 'function getPool(address,address,uint24) external view returns (address)', 'function createPool(address,address,uint24) external returns (address)' ];


async function main() {
      // Setup deployer wallet
      const provider = ethers.provider;
      const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    // --- Uniswap Pool Setup ---
    const operatorAddress = process.env.OPERATOR_ADDRESS;
    const operatorPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    const uniswapRouter = process.env.UNISWAP_ROUTER_ADDRESS;
    const uniswapFactory = process.env.UNISWAP_FACTORY_ADDRESS;
    const uniswapPositionManager = process.env.UNISWAP_POSITION_MANAGER_ADDRESS;
    const usdcAddress = process.env.UNISWAP_USDC_ADDRESS;
    const wethAddress = process.env.UNISWAP_WETH_ADDRESS;
    const pairToken = (process.env.UNISWAP_PAIR_TOKEN || 'USDC').toUpperCase();
    const feeTier = parseInt(process.env.UNISWAP_FEE_TIER || '3000');
    const initialPrice = process.env.UNISWAP_INITIAL_PRICE || '1';
    const initialTokens = process.env.UNISWAP_INITIAL_TOKENS || '0';
    const initialPair = process.env.UNISWAP_INITIAL_WETH || '0';

    // Deploy DirectiveToken
  const DirectiveToken = await ethers.getContractFactory('DirectiveToken');
  const directiveToken = await DirectiveToken.deploy();
  await directiveToken.deployed();
  console.log('DirectiveToken deployed to:', directiveToken.address);


  // --- Uniswap Pool Creation and Liquidity ---
  // Addresses and decimals
  const directiveTokenAddress = directiveToken.address;
  const pairTokenAddress = pairToken === 'WETH' ? wethAddress : usdcAddress;
  const directiveTokenDecimals = 18; // Adjust if your token uses different decimals
  const pairTokenDecimals = pairToken === 'USDC' ? 6 : 18;

  // Approve tokens for NonfungiblePositionManager
  const directiveTokenContract = DirectiveToken.attach(directiveTokenAddress).connect(deployer);
  await directiveTokenContract.approve(uniswapPositionManager, ethers.constants.MaxUint256);
  const pairTokenContract = new ethers.Contract(pairTokenAddress, [ 'function approve(address,uint256) public returns (bool)' ], deployer);
  await pairTokenContract.approve(uniswapPositionManager, ethers.constants.MaxUint256);

  // Create and initialize the pool (always new for this deployment)
  const positionManager = new ethers.Contract(uniswapPositionManager, NonfungiblePositionManagerABI, deployer);
  const token0 = directiveTokenAddress < pairTokenAddress ? directiveTokenAddress : pairTokenAddress;
  const token1 = directiveTokenAddress > pairTokenAddress ? directiveTokenAddress : pairTokenAddress;
  const fee = feeTier;
  // Initial price as sqrtPriceX96
  const priceNumerator = process.env.UNISWAP_INITIAL_PRICE_NUMERATOR || '1';
  const priceDenominator = process.env.UNISWAP_INITIAL_PRICE_DENOMINATOR || '1';
  const sqrtPriceX96 = encodeSqrtRatioX96(priceNumerator, priceDenominator).toString();
  const txPool = await positionManager.createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPriceX96);
  await txPool.wait();
  console.log('Uniswap pool created and initialized.');

  // Add liquidity
  const amount0Desired = ethers.utils.parseUnits(initialTokens, directiveTokenDecimals);
  const amount1Desired = ethers.utils.parseUnits(initialPair, pairTokenDecimals);
  const tickLower = nearestUsableTick(TickMath.MIN_TICK, fee);
  const tickUpper = nearestUsableTick(TickMath.MAX_TICK, fee);
  const mintParams = {
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient: operatorAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10
  };
  const txMint = await positionManager.mint(mintParams);
  await txMint.wait();
  console.log('Liquidity added to Uniswap pool.');

  // Get pool address
  const factory = new ethers.Contract(uniswapFactory, UniswapV3FactoryABI, deployer);
  const poolAddress = await factory.getPool(token0, token1, fee);
  console.log('Uniswap pool address:', poolAddress);
  // --- End Uniswap Pool Section ---

  // Deploy OpenDirective with DirectiveToken address
  const OpenDirective = await ethers.getContractFactory('OpenDirective');
  const openDirective = await OpenDirective.deploy(directiveToken.address);
  await openDirective.deployed();
  console.log('OpenDirective deployed to:', openDirective.address);


  // Deploy SiteRecord with OpenDirective address
  const SiteRecord = await ethers.getContractFactory('SiteRecord');
  const siteRecord = await SiteRecord.deploy(openDirective.address);
  await siteRecord.deployed();
  console.log('SiteRecord deployed to:', siteRecord.address);

  // Operator sets encryption public key for user submissions
  const encryptionPubKey = process.env.ENCRYPTION_PUBLIC_KEY || '';
  if (encryptionPubKey) {
    const tx = await siteRecord.addKeys(encryptionPubKey);
    await tx.wait();
    console.log('Encryption public key set on SiteRecord.');
  } else {
    console.warn('ENCRYPTION_PUBLIC_KEY not set in project.env, skipping addKeys call.');
  }

  // Deploy Subscription with OpenDirective address
  const Subscription = await ethers.getContractFactory('Subscription');
  const subscription = await Subscription.deploy(openDirective.address);
  await subscription.deployed();
  console.log('Subscription deployed to:', subscription.address);

  // Deploy Rewards with verifier, token, and owner from env or deployer
  const Rewards = await ethers.getContractFactory('Rewards');
  const verifier = process.env.REWARDS_VERIFIER || ethers.Wallet.createRandom().address;
  const owner = process.env.REWARDS_OWNER || ethers.Wallet.createRandom().address;
  // Use the deployed DirectiveToken as the token address
  const rewards = await Rewards.deploy(verifier, directiveToken.address, owner);
  await rewards.deployed();
  console.log('Rewards deployed to:', rewards.address);

  // Save addresses to a file
  const addresses = {
    DirectiveToken: directiveToken.address,
    OpenDirective: openDirective.address,
    SiteRecord: siteRecord.address,
    Subscription: subscription.address,
    Rewards: rewards.address
  };
  fs.writeFileSync(path.join(__dirname, '../../deploy/operator-deployed-addresses.json'), JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
