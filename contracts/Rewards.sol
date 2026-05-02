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

    // Merkle root history
    bytes32[] public balanceRoots;

    // Track user withdrawals per root: user => rootIndex => amount withdrawn
    mapping(address => mapping(uint256 => uint256)) public withdrawn;

    // ...existing code...
    event RootUpdated(bytes32 indexed newRoot, uint256 indexed rootIndex);
    event Withdrawn(address indexed user, uint256 indexed rootIndex, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == _verifier || msg.sender == _owner, "Only verifier or owner can send rewards");
        _;
    }

    constructor(address verifier, IERC20 token, address owner) {
        _verifier = verifier;
        _token = token;
        _owner = owner;
    }
    // ...existing code...
    // Get the total amount of tokens owned by rewards service
    function totalRewards()external view returns(uint256){
        return(_token.balanceOf(address(this)));
    }
    //set the max reward amount
    function setMax(uint256 max)external {
        require(msg.sender == _owner);
        _maxReward = max;
    }

    // Update merkle root for reward distribution (pushes new root)
    function updateRoot(bytes32 newRoot) external onlyOwner {
        balanceRoots.push(newRoot);
        emit RootUpdated(newRoot, balanceRoots.length - 1);
    }

    // Get the latest root index
    function latestRootIndex() public view returns (uint256) {
        require(balanceRoots.length > 0, "No roots set");
        return balanceRoots.length - 1;
    }

    // Verify a user's balance in a given root
    function verifyBalance(address user, uint256 balance, bytes32[] calldata proof, uint256 rootIndex) public view returns (bool) {
        require(rootIndex < balanceRoots.length, "Invalid root index");
        bytes32 leaf = keccak256(abi.encode(user, balance));
        return MerkleProof.verify(proof, balanceRoots[rootIndex], leaf);
    }

    // Withdraw rewards using latest root, with differential logic
    function withdraw(uint256 balance, bytes32[] calldata proof) external {
        uint256 rootIdx = latestRootIndex();
        require(verifyBalance(msg.sender, balance, proof, rootIdx), "Invalid proof for latest root");

        uint256 prevRootIdx = rootIdx > 0 ? rootIdx - 1 : 0;
        uint256 prevWithdrawn = withdrawn[msg.sender][prevRootIdx];
        uint256 alreadyWithdrawn = withdrawn[msg.sender][rootIdx];

        // Calculate withdrawable: balance in latest root - amount withdrawn since previous root
        uint256 withdrawable = balance;
        if (rootIdx > 0) {
            // User may have withdrawn from previous root
            withdrawable = balance > prevWithdrawn ? balance - prevWithdrawn : 0;
        }
        // Subtract any already withdrawn for this root
        if (alreadyWithdrawn >= withdrawable) {
            revert("Nothing to withdraw");
        }
        uint256 amount = withdrawable - alreadyWithdrawn;
        require(amount > 0, "Nothing to withdraw");
        require(_token.balanceOf(address(this)) >= amount, "Insufficient contract balance");

        withdrawn[msg.sender][rootIdx] += amount;
        _token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, rootIdx, amount);
    }
    // Get balance, when withdrawn through merkle proof update withdrawal amount(or user amount withdrawn/ track addresses)
    // Or set reward amount for each root set, every validator is paid equally based on current reward pool
    function getBalance( address user, uint256 balance, bytes32[] calldata proof) external view returns (bool){

        bytes32 leaf = keccak256(abi.encode(user, balance));
        return MerkleProof.verify(proof, balanceRoot, leaf);
    }


}
