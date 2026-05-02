// operator/submit.js
// Submits an analyst report onchain after encrypting the data and uploading to decentralized storage (0G)
// Uses @0gfoundation/0g-storage-ts-sdk for storage
// 1. Ad method for input data
// 2. TODO: Contract ABI
require('dotenv').config({ path: '../../project.env' });

const { ethers } = require('hardhat');
const { ZgIndexer, MemData } = require('@0gfoundation/0g-storage-ts-sdk');
const { TextEncoder } = require('util');
const sodium = require('libsodium-wrappers');
const fs = require('fs');
const path = require('path');

// Encrypt data using libsodium (Curve25519)
async function encryptData(data, publicKeyBase64) {
  await sodium.ready;
  const publicKey = sodium.from_base64(publicKeyBase64, sodium.base64_variants.ORIGINAL);
  const messageBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  // Generate ephemeral keypair for sender
  const ephemeralKeyPair = sodium.crypto_box_keypair();
  // Encrypt using crypto_box_easy (Curve25519 XSalsa20-Poly1305)
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const cipher = sodium.crypto_box_easy(
    messageBytes,
    nonce,
    publicKey,
    ephemeralKeyPair.privateKey
  );
  // Output: ephemeral public key + nonce + cipher
  const encryptedPayload = new Uint8Array(
    ephemeralKeyPair.publicKey.length + nonce.length + cipher.length
  );
  encryptedPayload.set(ephemeralKeyPair.publicKey, 0);
  encryptedPayload.set(nonce, ephemeralKeyPair.publicKey.length);
  encryptedPayload.set(cipher, ephemeralKeyPair.publicKey.length + nonce.length);
  return encryptedPayload;
}

async function uploadTo0GStorage(encryptedData, rpcUrl, signer) {
  // Upload in-memory data using MemData
  const data = new TextEncoder().encode(encryptedData);
  const memData = new MemData(data);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`);

  const indexer = new ZgIndexer();
  const [tx, uploadErr] = await indexer.upload(memData, rpcUrl, signer);
  if (uploadErr !== null) throw new Error(`Upload error: ${uploadErr}`);

  // Always close when done (not strictly needed for MemData, but for API consistency)
  if (memData.close) await memData.close();

  // Handle both single and fragmented (>4GB) responses
  if ('rootHash' in tx) {
    return tx.rootHash;
  } else {
    // For fragmented files, return the first rootHash (or handle as needed)
    return tx.rootHashes[0];
  }
}


async function main() {
  const [deployer] = await ethers.getSigners();
  const siteRecordAddress = process.env.SITE_RECORD_ADDRESS;
  const encryptionPubKey = process.env.ENCRYPTION_PUBLIC_KEY;
  const rpcUrl = process.env.RPC_URL;
  if (!siteRecordAddress || !encryptionPubKey || !rpcUrl) {
    throw new Error('SITE_RECORD_ADDRESS, ENCRYPTION_PUBLIC_KEY, and RPC_URL must be set in project.env');
  }

  // Accept report data from a file path argument
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error('Usage: node submit.js <report-file-path>');
  }
  const reportData = fs.readFileSync(path.resolve(filePath), 'utf8');

  const SiteRecord = await ethers.getContractFactory('SiteRecord');
  const siteRecord = SiteRecord.attach(siteRecordAddress);

  // Encrypt the data
  const encryptedData = await encryptData(reportData, encryptionPubKey);

  // Upload to 0G decentralized storage
  const rootHash = await uploadTo0GStorage(encryptedData, rpcUrl, deployer);

  // Submit the report onchain (using the rootHash as the data)
  const tx = await siteRecord.addAnalystReport(rootHash);
  await tx.wait();
  console.log('Analyst report submitted onchain with rootHash:', rootHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});// operator/submit.js
// Submits an analyst report onchain after encrypting the data and uploading to decentralized storage (0G)
// The storage upload logic is left as a placeholder for now.

require('dotenv').config({ path: '../../project.env' });
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
// You may use a library like 'crypto' or 'tweetnacl' for encryption if needed

async function encryptData(data, publicKey) {
  // TODO: Implement encryption using the operator's public key
  // Placeholder: return the data as-is (unencrypted)
  return data;
}

async function uploadTo0GStorage(encryptedData) {
  // TODO: Implement upload to 0G decentralized storage
  // Placeholder: return a fake CID/hash
  return 'FAKE_CID_HASH';
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const siteRecordAddress = process.env.SITE_RECORD_ADDRESS;
  const encryptionPubKey = process.env.ENCRYPTION_PUBLIC_KEY;
  if (!siteRecordAddress || !encryptionPubKey) {
    throw new Error('SITE_RECORD_ADDRESS and ENCRYPTION_PUBLIC_KEY must be set in project.env');
  }

  const SiteRecord = await ethers.getContractFactory('SiteRecord');
  const siteRecord = SiteRecord.attach(siteRecordAddress);

  // Get the report data (from file, input, or argument)
  const reportData = 'PLACEHOLDER_REPORT_DATA'; // Replace with actual data source

  // Encrypt the data
  const encryptedData = await encryptData(reportData, encryptionPubKey);

  // Upload to 0G decentralized storage
  const cid = await uploadTo0GStorage(encryptedData);

  // Submit the report onchain (using the CID/hash as the data)
  const tx = await siteRecord.addAnalystReport(cid);
  await tx.wait();
  console.log('Analyst report submitted onchain with CID:', cid);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
