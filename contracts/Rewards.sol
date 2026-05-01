// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Rewards {
    using SafeERC20 for IERC20;
    address private _verifier;
    address private _owner;
    uint256 private _maxReward;
    IERC20 private _token;
    bytes32 public balanceRoot;

    struct RewardRecord {
        address recipient;
        uint256 amount;
        uint256 reportNum;
    }

    RewardRecord[] public rewards;

    event RewardSent(address indexed recipient, uint256 amount, uint256 reportNum);
    event RootUpdated(bytes32 indexed newRoot);

    modifier onlyOwner() {
        require(msg.sender == _verifier || msg.sender == _owner, "Only verifier or owner can send rewards");
        _;
    }

    constructor(address verifier, IERC20 token, address owner) {
        _verifier = verifier;
        _token = token;
        _owner = owner;
    }
    // get the number of rewards sent
    function getRewardCount() external view returns (uint256) {
        return rewards.length;
    }
    // Get the Reward Record
    function getRewardRecord(uint256 index) external view returns (address, uint256, uint256) {
        RewardRecord storage r = rewards[index];
        return (r.recipient, r.amount, r.reportNum);
    }
    // Get the total amount of tokens owned by rewards service
    function totalRewards()external view returns(uint256){
        return(_token.balanceOf(address(this)));
    }
    //set the max reward amount
    function setMax(uint256 max)external {
        require(msg.sender == _owner);
        _maxReward = max;
    }

    // Update merkle root for reward distribution
    function updateRoot(bytes32 newRoot) external onlyOwner {
        balanceRoot = newRoot;
    emit RootUpdated(newRoot);
    }
    // Get balance, when withdrawn through merkle proof update withdrawal amount(or user amount withdrawn/ track addresses)
    // Or set reward amount for each root set, every validator is paid equally based on current reward pool
    function getBalance( address user, uint256 balance, bytes32[] calldata proof) external view returns (bool){

        bytes32 leaf = keccak256(abi.encode(user, balance));
        return MerkleProof.verify(proof, balanceRoot, leaf);
    }

    // verifier take reward
    function validatorReward() external returns (uint256){
        require(msg.sender == _verifier);

    }

    // Owner send rewards
    function sendReward(address recipient, uint256 amount, uint256 reportNum) external onlyOwner {
        require(_token.balanceOf(address(this)) >= 100, "Insufficient balance on contract");
        require(amount < _maxReward);
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        
        _token.safeTransfer(recipient, amount);

        rewards.push(RewardRecord({recipient: recipient, amount: amount, reportNum: reportNum}));
        emit RewardSent(recipient, amount, reportNum);
    }

}
