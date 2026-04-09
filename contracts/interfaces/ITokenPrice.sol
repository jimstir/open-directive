// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPriceOracle {
    function getTokenPriceUSD() external view returns (uint256 price, uint8 decimals);
}