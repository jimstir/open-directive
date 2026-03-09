// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IOpenDirective.sol";
import "./interfaces/IDirectiveToken.sol";

contract SiteRecord {
        event AnalystReportAdded(uint256 indexed analystNum, address indexed submitter, bytes32 data, uint256 timestamp);
        event ValidatorReportAdded(uint256 indexed reportNum, address indexed submitter, bytes32 data, uint256 amount, uint256 timestamp);
        event VerifierReportAdded(uint256 indexed submitNum, address indexed submitter, bytes32 data, bool update, bool approved, uint256 timestamp);
    // Report structure
    struct Report {
        bytes32 data; // Website address or CID hash
        address submitter;
        uint256 time; // time of report submission
        uint256 submitNum; // number of submission
    }
    
    uint256 private _currentAnalystNum; // The current analyst report number
    address private _owner; //the open directive owner
    address private _agent; //the agent address
    uint256 private _proposal; //the created proposal number on the Open Directive Tokenized Reserve
    address private _verifier; // verifer address??
    uint256 private _reportNum; // the current validator report number
    IOpenDirective private _direct;
     
    // analyst
    mapping(uint256 => Report) public analystReport;
    // validator submit number => analystReport number
    mapping(uint256 => mapping(uint256 => Report)) public validatorReport;
    // validator submit number => Report
    mapping(uint256 => Report) public verifierReport;
    mapping(uint256 => bool) private verifiedApproved;
    mapping(uint256 => bool) private verifiedUpdate;

    constructor(address owner, address agent, IOpenDirective direct){
        _owner = owner;
        _agent = agent;
        _direct = direct;
    }

    modifier onlyOwners() {
        require(msg.sender == _owner || msg.sender == _agent, "Not authorized");
        _;
    }
    // Check if validator
    function checkValidator(address user) public view returns(bool){
        return _direct.userDeposit(user, _proposal) > 0;
    }
    
    // Get owner
    function getOwner() external view returns (address) {
        return _owner;
    }
    // Get verifier
    function getVerifier() external view returns (address) {
        return _verifier;
    }
    // Get anaylst report count
    function getAnalystReportNum() external view returns (uint256) {
        return _currentAnalystNum;
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
    // validator check verifier status, if approved and/or choosen for update
    function checkStatus(uint256 reportNum) external view returns(bool approved, bool update) {
        return (verifiedApproved[reportNum], verifiedUpdate[reportNum]);
    }
    //Add verifier address
    // ???
    function addVerifier(address user) external onlyOwners {
        _verifier = user;

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
        
        _reportNum += 1;
        bytes32 hash = keccak256(abi.encodePacked(data));
        Report storage rep = validatorReport[_reportNum][_currentAnalystNum];
        _direct.proposalDeposit(amount, msg.sender, _proposal);
        rep.data = hash;
        rep.submitter = msg.sender;
        rep.time = block.timestamp;
        emit ValidatorReportAdded(_reportNum, msg.sender, hash, amount, block.timestamp);
        return _reportNum;
    }
    /**  Add report by verifier agent
    * @param submitNum the current reportNum being verified
    */
    function addVerifierReport(string calldata data, uint256 submitNum, bool update, bool approved) external {
        require(msg.sender == _verifier);

        Report storage verify = verifierReport[submitNum];
        bytes32 hash = keccak256(abi.encodePacked(data));
        
        verify.data = hash;
        verify.submitter = msg.sender;
        verify.time = block.timestamp;
        verifiedApproved[submitNum] = approved;
        verifiedUpdate[submitNum] = update;
        emit VerifierReportAdded(submitNum, msg.sender, hash, update, approved, block.timestamp);
    }

}
