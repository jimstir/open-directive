// verify_request.js
// Workflow tool: Checks user subscription and analyst report recency on-chain.
// If user is not subscribed, returns false and ends workflow.
// If analyst's report is too recent (< 1 week), returns false and triggers send_recent_report.
// Otherwise, returns true to continue workflow.

const { ethers } = require("ethers");
const env = require("../client-extension/env.js");

// Assumes Subscription and SiteRecord contract ABIs/addresses are available in env.js
const SUBSCRIPTION_ABI = env.SUBSCRIPTION_ABI;
const SUBSCRIPTION_ADDRESS = env.SUBSCRIPTION_ADDRESS;
const SITERECORD_ABI = env.SITERECORD_ABI;
const SITERECORD_ADDRESS = env.SITERECORD_ADDRESS;

const provider = new ethers.providers.JsonRpcProvider(env.RPC_URL);

async function verifyRequest(userAddress) {
    // 1. Check user subscription
    const subscription = new ethers.Contract(SUBSCRIPTION_ADDRESS, SUBSCRIPTION_ABI, provider);
    const monthsLeft = await subscription.getMonthsLeft(userAddress);
    if (monthsLeft.toNumber() < 1) {
        return { success: false, reason: "no_subscription" };
    }

    // 2. Check analyst report recency
    const siteRecord = new ethers.Contract(SITERECORD_ADDRESS, SITERECORD_ABI, provider);
    const rep = await siteRecord._currentAnalyst();
    // rep: { data, submitter, time }
    const now = Math.floor(Date.now() / 1000);
    const oneWeek = 7 * 24 * 60 * 60;
    if (now - rep.time < oneWeek) {
        // Too recent, trigger send_recent_report
        return {
            success: false,
            reason: "recent_report",
            report: {
                data: rep.data,
                submitter: rep.submitter,
                time: rep.time
            }
        };
    }

    // All checks passed
    return { success: true };
}

module.exports = verifyRequest;
