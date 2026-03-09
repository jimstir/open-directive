// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IOpenDirective.sol";
import "./interfaces/IDirectiveToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Subscription {
    using SafeERC20 for IERC20;
    
    event PriceSet(uint256 price);
    event Subscribed(address indexed user, uint256 months, uint256 amount);

    IERC20 private _token;
    uint256 private _monthlyPrice;
    address private _owner;
    uint256 private _proposal;

    struct UserSub {
        uint256 paidMonths;
        uint256 lastPaidTimestamp;
    }

    mapping(address => UserSub) public subscriptions;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address tokenAddress, uint256 initialPrice, uint256 proposal) {
        token = IERC20(tokenAddress);
        monthlyPrice = initialPrice;
        owner = msg.sender;
        _proposal = proposal
    }
    //Get proposal number of OpenDirective policy
    function getProposal() external returns(uint256){
        return _proposal;
    }
    function getMonthsLeft(address user) external view returns (uint256) {
        UserSub storage sub = subscriptions[user];
        if (sub.paidMonths == 0) return 0;
        
        uint256 end = sub.lastPaidTimestamp + sub.paidMonths * 30 days;
        if (block.timestamp >= end) return 0;
        uint256 remaining = end - block.timestamp;
        return remaining / 30 days;
    }

    function setPrice(uint256 price) external onlyOwner returns(uint256){
        require(price > 0, "Price must be positive");
        _monthlyPrice = price;
        emit PriceSet(price);
        return _monthlyPrice;
    }

    function subscribe(uint256 amount) external {
        require(_monthlyPrice > 0, "Price not set");
        require(amount % _monthlyPrice == 0, "Amount must be multiple of monthly price");
        uint256 months = amount / _monthlyPrice;
        require(months > 0, "Must pay for at least one month");
        require(IERC20.balanceOf(msg.sender) >= amount, "Not enough funds");

        token.safeTransferFrom(msg.sender, address(this), amount);
        
        UserSub storage sub = subscriptions[msg.sender];
        // If user has an active subscription, add months
        if (sub.paidMonths > 0 && block.timestamp < sub.lastPaidTimestamp + sub.paidMonths * 30 days) {
            uint256 remaining = (sub.lastPaidTimestamp + sub.paidMonths * 30 days) - block.timestamp;
            uint256 remainingMonths = remaining / 30 days;
            sub.paidMonths = remainingMonths + months;
            sub.lastPaidTimestamp = block.timestamp;
        } else {
            sub.paidMonths = months;
            sub.lastPaidTimestamp = block.timestamp;
        }
        emit Subscribed(msg.sender, months, amount);
    }

    
}
