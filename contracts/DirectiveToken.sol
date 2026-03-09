// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DirectiveToken is ERC20, Ownable {
    
    // Treasury token identifier
    string public constant TREASURY_TOKEN_IDENTIFIER = "OPEN_TREASURY_TOKEN_V1";
    
    string private _name;
    string private _symbol;
    
    constructor(
        string memory name, 
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
        _name = name;
        _symbol = symbol;

    }

    // Transfer ownership to the directive contract
    function initDirective(address newOwner) external onlyOwner returns(bool) {
        require(totalSupply() > 0, "No tokens minted");
        transferOwnership(newOwner);
        return true;
    }

    /// @notice Mint new tokens to an account (onlyOwner)
    /// @param to The address to receive the minted tokens
    /// @param amount The amount of tokens to mint
    function mintToken(address to, uint256 amount) public onlyOwner returns(uint256) {
        _mint(to, amount);
        return amount;
    }

    /// @notice Get the reserve name (returns the owner address)
    /// @return The address of the treasury owner
    function reserveAddr() external view returns (address) {
        return owner();
    }
}
