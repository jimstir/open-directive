// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./interfaces/IOpenDirective.sol";
import "./interfaces/IDirectiveToken.sol";

contract SiteRecord {
        event AnalystReportAdded(uint256 indexed analystNum, address indexed submitter, bytes32 data, uint256 timestamp);
        event ValidatorReportAdded(uint256 indexed reportNum, address indexed submitter, bytes32 data, uint256 amount, uint256 timestamp);
        event VerifierReportAdded(uint256 indexed submitNum, address indexed submitter, bytes32 data, bool update, bool approved, uint256 timestamp);
        event NewExpose(uint256 count, uint256 report, uint256 analysis, uint256 time);
    // Report structure
    struct Report {
        bytes32 data; // Website address or CID hash
        address submitter;
        uint256 time; // time of report submission
        uint256 submitNum; // number of submission
        uint256 reportNum;
    }

    // Report structure
    struct Exposed {
        address validator;
        uint256 analystNum;
        uint256 reportNum; // validator report number
        uint256 exposeNum; // the expose count
        uint256 time; // time of expose

    }
    
    uint256 private _currentAnalystNum; // The current analyst report number
    address private _owner; //the open directive owner
    address private _agent; //the agent address
    uint256 private _proposal; //the created proposal number on the Open Directive Tokenized Reserve
    address private _verifier; // verifer address??
    uint256 private _reportNum; // the current validator report number
    IOpenDirective private _direct;
    uint256 private _exposed;
    bytes private _key; //operator encryption key

    // analyst
    mapping(uint256 => Report) public analystReport;
    // validator submit number => analystReport number
    mapping(uint256 => mapping(uint256 => Report)) public validatorReport;
    // validator submit number => Report
    mapping(uint256 => Report) public verifierReport;
    mapping(uint256 => bool) private _verifiedApproved;
    mapping(uint256 => bool) private _verifiedUpdate;
    mapping(uint256 => Exposed) private _exposing;

    constructor(address owner, address agent, IOpenDirective direct){
        _owner = owner;
        // If a second authorized address is required
        _agent = agent;
        // The tokenized reserve contract
        _direct = direct;
    }

    modifier onlyOwners() {
        require(msg.sender == _owner || msg.sender == _agent, "Not authorized");
        _;
    }
    // Check if user is a validator
    function checkValidator(address user) public view returns(bool){
        return _direct.userDeposit(user, _proposal) > 0;
    }

    // Get owner
    function getOwner() external view returns (address) {
        return _owner;
    }
    // Get verifier address, if added
    function getVerifier() external view returns (address) {
        return _verifier;
    }
    // Get encryptionKey
    function getKey() external view returns (bytes memory) {
        return _key;
    }
    // Get analyst report count
    function getAnalystReportNum() external view returns (uint256) {
        return _currentAnalystNum;
    }
    // Get the current analystReport
    function getReport() external view returns (bytes32 data, address submitter, uint256 time){
        Report storage rep = analystReport[_currentAnalystNum];
        return (rep.data, rep.submitter, rep.time);
    }
    // Get the current analystReport
    function getAnalystReport() external view returns (bytes32 data, address submitter, uint256 time){
        Report storage rep = analystReport[_currentAnalystNum];
        return (rep.data, rep.submitter, rep.time);
    }
    //  Get validator report count
    function getValidatorReportCount() external view returns (uint256) {
        return _reportNum;
    }
    // Get validator report hash
    function getValidatorReport(uint256 reportNum, uint256 analystNum) external view returns(bytes32, address, uint256){
        Report storage rep = validatorReport[reportNum][analystNum];
        return (rep.data, rep.submitter, rep.time);
    }

    // Get verifier report
    function getVerifierReport(uint256 submitNum) external view returns (bytes32, address, uint256) {
        Report storage r = verifierReport[submitNum];
        return (r.data, r.submitter, r.time);
    }
    // validator check verifier status, if approved and/or choosen for update, 
    // approve = false is rejected, true = valid submission but may not need to update latest report
    // update = true = update latest report, false = no update latest report
    function checkStatus(uint256 reportNum) external view returns(bool approved, bool update) {
        return (_verifiedApproved[reportNum], _verifiedUpdate[reportNum]);
    }
    //Add verifier address
    // is this needed??
    function addVerifier(address user) external onlyOwners {
        _verifier = user;

    }
    // add operator encrytpion keys for user
    function addKeys(bytes memory key) external onlyOwners returns(bytes32){
        _key = key;
    }
    // Add report by AI agent
    function addAnalystReport(string calldata data) external {
        require(msg.sender == _owner);

        bytes32 hash = keccak256(abi.encodePacked(data));
        _currentAnalystNum += 1;
        Report storage rep = analystReport[_currentAnalystNum];
        rep.data = hash;
        rep.submitter = msg.sender;
        rep.time = block.timestamp;
        emit AnalystReportAdded(_currentAnalystNum, msg.sender, hash, block.timestamp);

    }
    // Add report by validator
    function addValidatorReport(string calldata data, uint256 amount) external returns(uint256) {
        require(checkValidator(msg.sender));
        require(amount > 100);
        
        // add lock??
        _reportNum = _reportNum + 1;
        bytes32 hash = keccak256(abi.encodePacked(data));
        Report storage rep = validatorReport[_reportNum][_currentAnalystNum];
        _direct.proposalDeposit(amount, msg.sender, _proposal);
        rep.data = hash;
        rep.submitter = msg.sender;
        rep.time = block.timestamp;
        rep.reportNum = _reportNum;
        emit ValidatorReportAdded(_reportNum, msg.sender, hash, amount, block.timestamp);
        return _reportNum;
    }

    /**  Add report by a thrid party verifier agent
    ****** Check how recent the lastestReview request was and
    ***** implement rewards for updates go to this proposal if were recent, like this month over two months,
    * @param submitNum the current reportNum being verified
    */
    function addVerifierReport(string calldata data, uint256 submitNum, bool update, bool approved) external {
        require(msg.sender == _verifier);

        Report storage verify = verifierReport[submitNum];
        bytes32 hash = keccak256(abi.encodePacked(data));
        
        verify.data = hash;
        verify.submitter = msg.sender;
        verify.time = block.timestamp;
        _verifiedApproved[submitNum] = approved;
        _verifiedUpdate[submitNum] = update;
        emit VerifierReportAdded(submitNum, msg.sender, hash, update, approved, block.timestamp);
    }

    // Allows a validaotr to expose the operator
    function expose(uint256 reportNum, uint256 analystNum) external {
        require(msg.sender != _owner);
        require(analystNum < _currentAnalystNum);

        _exposed = _exposed + 1;

        Exposed storage rep = _exposing[_exposed];
        rep.validator = msg.sender;
        rep.analystNum = analystNum;
        rep.reportNum = reportNum;
        rep.time = block.timestamp;

        emit NewExpose(_exposed, analystNum, reportNum, block.timestamp);

    }
}
