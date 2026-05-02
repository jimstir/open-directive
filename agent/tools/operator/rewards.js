// operator/rewards.js
// Downloads a validator report from 0G storage using the hash from getValidatorReport().
// Saves the file in agent/tools/extra/validatorReports

require('dotenv').config({ path: '../../project.env' });
const { ethers } = require('hardhat');
const { ZgIndexer } = require('@0gfoundation/0g-storage-ts-sdk');
const fs = require('fs');
const path = require('path');

async function main() {
  const siteRecordAddress = process.env.SITE_RECORD_ADDRESS;
  const rpcUrl = process.env.RPC_URL;
  if (!siteRecordAddress || !rpcUrl) {
    throw new Error('SITE_RECORD_ADDRESS and RPC_URL must be set in project.env');
  }

  // Accept reportNum and analystNum as arguments
  const reportNum = process.argv[2];
  const analystNum = process.argv[3];
  if (!reportNum || !analystNum) {
    throw new Error('Usage: node rewards.js <reportNum> <analystNum>');
  }

  const [deployer] = await ethers.getSigners();
  const SiteRecord = await ethers.getContractFactory('SiteRecord');
  const siteRecord = SiteRecord.attach(siteRecordAddress);

  // Get the validator report hash (rep.data)
  const [hash] = await siteRecord.getValidatorReport(reportNum, analystNum);
  if (!hash) {
    throw new Error('No hash found for the given reportNum and analystNum');
  }
  const rootHash = hash;

  // Download from 0G storage
  const indexer = new ZgIndexer();
  const outputPath = path.join(__dirname, '../extra/validatorReports', `${reportNum}_${analystNum}.bin`);
  const err = await indexer.download(rootHash, outputPath, true);
  if (err !== null) {
    throw new Error(`Download error: ${err}`);
  }
  console.log(`Validator report downloaded to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
