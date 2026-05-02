// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IOpenDirective.sol";
import "./interfaces/IDirectiveToken.sol";
import "./interfaces/ITokenPrice.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Subscription {
    using SafeERC20 for IERC20;
    
    event PriceSet(uint256 price);
    event Liqudated(uint256 amount);
    event Subscribed(address indexed user, uint256 months, uint256 amount);

    IERC20 private _token;
    uint256 private _monthlyPrice;
    address private _owner;
    address private _verifier;
    uint256 private _directive;
    uint256 _count; // number of subscribers;
    IPriceOracle private _oracle;
    address private _rewards; // the contract address of the Rewards contract

    struct UserSub {
        uint256 paidMonths;
        uint256 lastPaidTimestamp;
        uint256 subNum;
    }

    mapping(address => UserSub) public subscriptions;
     

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only owner");
        _;
    }

    constructor(address tokenAddress, uint256 initialPrice, uint256 direct) {
        _token = IERC20(tokenAddress);
        _monthlyPrice = initialPrice;
        _owner = msg.sender;
        _directive = direct;
    }
    // Get proposal number of OpenDirective policy to
    // Allows users to verify this subscription belongs to the correct reserve
    function getProposal() external view returns(uint256){
        return _directive;
    }

    //Get the rewards contract address
    function getRewards() external view returns(address){
        return _rewards;
    }
    // Get total of tokens owned by service
    function tokensOwned() external view returns(uint256){
        return(_token.balanceOf(address(this)));
    }

    //Get total number of subscribers
    function getSubscribers() external view returns(uint256){
        return(_count);
    }
    //Get total number of subscribers
    function getPrice() external view returns(uint256){
        return(_monthlyPrice);
    }
    function getMonthsLeft(address user) external view returns (uint256) {
        UserSub storage sub = subscriptions[user];
        if (sub.paidMonths == 0) return 0;
        
        uint256 end = sub.lastPaidTimestamp + sub.paidMonths * 30 days;
        if (block.timestamp >= end) return 0;
        uint256 remaining = end - block.timestamp;
        return remaining / 30 days;
    }
    // Set the oracle address for converting token price in fiat values
    function setOracle(address oracleAddr) external onlyOwner {
        _oracle = IPriceOracle(oracleAddr);
    }
    // Change verifier address if needed
    function verifierAddrs(address verifier) external onlyOwner returns(address){
        _verifier = verifier;
        return _verifier;
    }

    // Set monthly price in USD (with 2 decimals, e.g. 999 = $9.99)
    function setPrice(uint256 price) external onlyOwner returns(uint256){
        require(price > 0, "Price must be positive");
        _monthlyPrice = price;
        emit PriceSet(price);
        return _monthlyPrice;
    }

    function subscribe(uint256 amount) external {
        require(_monthlyPrice > 0, "USD price not set");
        require(_token.balanceOf(msg.sender) >= amount, "Not enough funds");
        uint256 tokenPrice; 
        uint8 decimals;

        if(address(_oracle) != address(0)){
            (tokenPrice, decimals) = _oracle.getTokenPriceUSD();
            require(tokenPrice > 0, "Oracle price invalid");
        } else {
            tokenPrice = _monthlyPrice;
            decimals = 18;
        }
        // Calculate token amount for one month
        uint256 tokenAmountPerMonth = (_monthlyPrice * (10 ** decimals)) / tokenPrice;
        require(amount % tokenAmountPerMonth == 0, "Amount must be multiple of monthly token price");
        uint256 months = amount / tokenAmountPerMonth;
        require(months > 0, "Must pay for at least one month");
        
        _token.safeTransferFrom(msg.sender, address(this), amount);

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
            _count = _count + 1;
            sub.subNum = _count;
        }
        emit Subscribed(msg.sender, months, amount);
    }

    //withdarw all funds collected, owner address get 50% other 50% goes to Rewards contract
    function liqudate() external onlyOwner returns(uint256){
        uint256 num = _token.balanceOf(address(this));
        require( num > 1000);
        
        _token.transferFrom(address(this), _rewards, num/2);
        num = _token.balanceOf(address(this));
        _token.transferFrom(address(this), msg.sender, num);
        
        emit Liqudated(num);
        return(num);
    }
    
}
