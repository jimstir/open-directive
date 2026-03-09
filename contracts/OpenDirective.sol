// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
/// @title The Open Directive, Tokenized Reserve(ERC7425)
/// @author @jimstir

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IDirectiveToken.sol";

contract OpenDirective is ERC4626, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev proposalOpen event
    event proposalO(
        address indexed token,
        uint256 indexed proposalNum,
        uint256 indexed amount,
        address recipient
    );
    /// dev proposlClose event
    event proposalC(
        uint256 indexed proposalNum,
        bool indexed closed,
        address closer
    );
    /// @dev deposit event
    event FundsAdded(
        address indexed token,
        uint256 indexed amount,
        uint256 indexed time,
        address sender
    );

    struct userAccount{
        uint256 proposal;
        uint256 deposit;
        uint256 withdrew;
    }

    struct proposalAccount{
        address owner;
        uint256 withdraw; // amount being withdrawn from treasury
        address receiver; // the receiving address/contract
        IERC20 token;
        uint256 time;
        uint256 deposits; // amount returned
        bytes32 urlHash; // the url for urlProposals
    }

    struct UserDeposit{
        uint256 num; // the deposit number
        uint256 amount;
        IERC20 token;
        address owner; // address of contract or wallet
        uint256 time; // time of deposit
        uint256 proposalNum;
    }

    address private _oOwner;
    IERC20 private _directiveToken;
    //number of opened proposals
    uint256 private _proposalNum;
    uint256 private _depositNum;
    address private _agent;
    string private _name;
    IERC20 private _treasuryToken;

    mapping(address => bool) private _authUsers;
    mapping(uint256 => uint256) private _totalShares;
    mapping(uint256 => bool) private _closedProposals;
    
    //Track the number of proposals a shareholder has voted in
    mapping(address => mapping(uint256 => userAccount)) internal userBook;
    //mapping(uint256 => ownerAccount) internal ownerBook;
    mapping(uint256 => proposalAccount) internal proposalBook;
    // Record deposits for reference
    mapping(uint256 => UserDeposit) internal addFund;
    // For storing the urlList
    mapping(bytes32 => bool) internal urlList;
    // Find the proposalNumber of a url
    mapping(bytes32 => uint256) internal urlProposal;

    bool private _allowInternal = false;

    constructor(address agent, IERC20 dToken, string memory name, string memory symbol) ERC20(name, symbol) ERC4626(dToken){
        _oOwner = msg.sender;
        _directiveToken = dToken; 
        _agent = agent;
    }

    // Get owner address
    function whosOwner() public view returns (address){
        return _oOwner;
    }
     // Get agent address
    function whosAgent() public view returns (address){
        return _agent;
    }

    /** @dev Check current total number of opened proposals
    * @return uint256
    */ 
    function proposalCheck() public view returns (uint256) {
        return _proposalNum;
    }

    // Authorized users of the treasury
    function getAuth(address user) public view returns (bool){
        return _authUsers[user];
    }

    /** @dev Amount deposited for shareToken by user, it is 1:1
    * - MUST be an ERC20 address
    * @param user address of user
    * @param proposal the proposal number for which the user deposited to
    */
    function userDeposit(address user, uint256 proposal) public view returns(uint256){
        return userBook[user][proposal].deposit;
    }

    /** @dev Amount withdrawn from given proposal by the user
    * @param user address of user
    * @param proposal number of the proposal the user withdrew
    */
    function userWithdrew(address user, uint256 proposal) public view returns(uint256){
        return userBook[user][proposal].withdrew;
    }

    /** @dev The total number of proposals joined by the user
    * @param user address of user
    */
    function userNumOfProposal(address user) public view returns(uint256){
        return userBook[user][0].proposal;
    }

    /** @dev The proposal number from the specific proposal joined by the user
    * @param user address of user
    * @param proposal the number the user was apart of
    * MUST NOT be zero
    */
    function userProposal(address user, uint256 proposal) public view returns(uint256){
        return userBook[user][proposal].proposal;
    }

    /** @dev Token used for given proposal
    * - MUST be ERC20 address
    * @param proposal number for requested token
    * @return token address
    */
    /**
     * @dev Proposal info
     * @param proposal Proposal number
     * @return token Token address
     * @return withdrawAmount Amount withdrawn
     * @return receiver Receiver address
     */
    function getProposalInfo(uint256 proposal) external view returns(address token, uint256 withdrawAmount, address receiver) {
        proposalAccount memory p = proposalBook[proposal];
        return (address(p.token), p.withdraw, p.receiver);
    }

    /** @dev Total shares issued for a given proposal
    * NOTE: Number does not change after proposal closed and shares are redeemed
    */
    function totalShares(uint256 proposal) public view returns(uint256){
        return _totalShares[proposal];
    }

    // get the proposalNumber
    function urlProposalNum(bytes32 url) external view returns(uint256){
        bytes32 hash = keccak256(abi.encodePacked(url));
        return urlProposal[url];
    }

    // Check if URL already has proposal
    function checkURL(string calldata url) external view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(url));
        return urlList[hash];
    }
    /**
    * @dev SafeAdd function
    */
    function add(uint256 a, uint256 b) internal pure returns(uint256){
        return a + b;
    }
    // Update the agent address (only owner)
    function addAgent(address agent) external {
        require(msg.sender == _oOwner, "Only owner");
        _agent = agent;
    }
    // Add a new URL from an open proposal
    function newURL(string calldata url) public returns (bytes32) {
        bytes32 hash = keccak256(abi.encodePacked(url));
        urlList[hash] = true;
        return hash;
    }
    /** @dev Make a deposit to proposal creating new shares
    * - MUST be open proposal
    * - MUST NOT be a proposal that was previously closed
    * @param assets amount being deposited
    * @param receiver address of depositor, address receiving shares
    * @param proposal number of the proposal
    */
    function proposalDeposit(uint256 assets, address receiver, uint256 proposal) public nonReentrant returns (uint256) {
        require(proposalCheck() >= proposal, "Invalid proposal");

        _allowInternal = true;
        uint256 shares = super.deposit(assets, receiver);
        _allowInternal = false;
        _totalShares[proposal] = add(totalShares(proposal), shares);
        uint256 cc = userNumOfProposal(msg.sender) + 1;
        userBook[receiver][proposal].deposit = add(userDeposit(receiver, proposal), shares);
        userBook[msg.sender][0].proposal = cc;
        userBook[msg.sender][cc].proposal = proposal;
        return shares;
    }

    /** @dev Make a deposit to proposal creating new shares
    * - MUST have proposalNumber
    * NOTE: using the proposalMint() will cause shares to not be accounted for in a proposal
    * @param shares amount being deposited
    * @param receiver address of depositor
    * @param proposal the number to open proposal
    */
    function proposalMint(uint256 shares, address receiver, uint256 proposal) public nonReentrant returns(uint256){
         require(proposalCheck() <= proposal, "Invalid proposal");

         _allowInternal = true;
         uint256 assets = super.mint(shares, receiver);
         _allowInternal = false;
         _totalShares[proposal] = add(totalShares(proposal), assets);
         uint256 cc = userNumOfProposal(msg.sender) + 1;
         userBook[receiver][proposal].deposit = add(userDeposit(receiver, proposal), assets);
         userBook[msg.sender][0].proposal = cc;
         userBook[msg.sender][cc].proposal = proposal;

         return assets;
    }

    /** @dev Burn shares, receive 1 to 1 value of assets
    * - MUST NOT have a userDeposit amount less than or equal to userWithdrew amount
    * @param assets amount of shares being returned
    * @param receiver address of depositor
    * @param owner the address to receive the treasury token
    * @param proposal the number to closed proposal
    */
    function proposalWithdraw(uint256 assets, address receiver, address owner, uint256 proposal)public nonReentrant returns(uint256){
        require(userWithdrew(receiver, proposal) + assets <= userDeposit(receiver, proposal), "Insufficient deposit");
    
        _allowInternal = true;
        uint256 shares = super.withdraw(assets, receiver, owner);
        _allowInternal = false;
        userBook[receiver][proposal].withdrew = add(userWithdrew(receiver, proposal), shares);
        
       return shares;
    }

    /** @dev Burn shares, receive 1 to 1 value of shares
    * - MUST have userDeposit less than or equal to userWithdrawal
    * NOTE: using ERC 4626 redeem() will not account for proposalWithdrawal
    */
    function proposalRedeem(uint256 shares, address receiver, address owner, uint256 proposal) public nonReentrant returns(uint256){
        require(userWithdrew(receiver, proposal) <= userDeposit(receiver, proposal), "Invalid redeem state");

        _allowInternal = true;
        uint256 assets = super.redeem(shares, receiver, owner);
        _allowInternal = false;
        userBook[receiver][proposal].withdrew = add(userWithdrew(receiver, proposal), assets);

        return assets;
    }
    /** @dev Issue new proposal
    * - MUST create new proposal number
    * - MUST account for amount to be withdrawn 
    * @param amount token amount being withdrawn
    * @param policy MAY be the policy address for urlProposals or address for TransferProposals
    * @param owner address of proposalOwner
    * @param url the address of the url for urlProposals 
    */
    function proposalOpen(uint256 amount, address policy, address owner, IERC20 token, string calldata url) external returns (uint256){
        require(msg.sender == _agent || msg.sender == _oOwner, "Not authorized");
        bytes32 hash = newURL(url);
        require(!urlList[hash]);
        
        uint256 num = proposalCheck() + 1;
        urlProposal[hash] = num;
        urlList[hash] = true;
        proposalBook[num].owner = owner;
        proposalBook[num].token = token;
        proposalBook[num].withdraw = amount;
        proposalBook[num].receiver = policy;
        _proposalNum = num;

        emit proposalO(address(token), num, amount, policy);
        return num;
    }
    /** @dev Account for added funds
    * - 
    * -  
    */
   function addFunds(IERC20 token, uint256 amount, address sender) public returns(bool){
        require(amount > 0, "Amount must be greater than zero");
        UserDeposit storage deposits = addFund[_depositNum];
        _depositNum = _depositNum + 1;

        deposits.num = _depositNum;
        deposits.amount = amount;
        deposits.token = token;
        deposits.time = block.timestamp;
        deposits.owner = sender;

        SafeERC20.safeTransferFrom(token, sender, address(this), amount);
        emit FundsAdded(address(token), amount, block.timestamp, sender);
        return true;
   }

    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256) {
        return super.deposit(assets, receiver);
    }

    function mint(uint256 shares, address receiver) public override nonReentrant returns (uint256) {
        return super.mint(shares, receiver);
    }

    function redeem(uint256 shares, address receiver, address owner) public override nonReentrant returns (uint256) {
        require(_allowInternal, "Direct redeem not allowed, use proposalRedeem");
        return super.redeem(shares, receiver, owner);
    }

    function withdraw(uint256 assets, address receiver, address owner) public override nonReentrant returns (uint256) {
        require(_allowInternal, "Direct withdraw not allowed, use proposalWithdraw");
        return super.withdraw(assets, receiver, owner);
    }

}