// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDirectiveToken {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function mintToken(address to, uint256 amount) external returns(uint256);
    function reserveAddr() external view returns (address);
    function initDirective(address newOwner) external returns(bool);
}
