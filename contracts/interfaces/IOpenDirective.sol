// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOpenDirective {
    function proposalOpen(uint256 amount, address policy, address owner, address token, string calldata url) external returns (uint256);
    function addFunds(address token, uint256 amount, address sender) external returns (bool);
    function proposalDeposit(uint256 assets, address receiver, uint256 proposal) external returns (uint256);
    function proposalMint(uint256 shares, address receiver, uint256 proposal) external returns (uint256);
    function proposalWithdraw(uint256 assets, address receiver, address owner, uint256 proposal) external returns (uint256);
    function proposalRedeem(uint256 shares, address receiver, address owner, uint256 proposal) external returns (uint256);
    function proposalCheck() external view returns (uint256);
    function closedProposal(uint256 proposal) external view returns (bool);
    function userDeposit(address user, uint256 proposal) external view returns(uint256);
    function userWithdrew(address user, uint256 proposal) external view returns(uint256);
    function userNumOfProposal(address user) external view returns(uint256);
    function userProposal(address user, uint256 proposal) external view returns(uint256);
    function proposalToken(uint256 proposal) external view returns(address);
    function getProposalWithdrawAmount(uint256 proposal) external view returns(uint256);
    function proposalReceiver(uint256 proposal) external view returns(address);
    function totalShares(uint256 proposal) external view returns(uint256);
    function whosOwner() external view returns (address);
    function getAuth(address user) external view returns (bool);
    function add(uint256 a, uint256 b) external pure returns(uint256);
    function newURL(string calldata url) external returns(bytes32);
    function checkURL(string calldata url) external view returns(bool);
}
