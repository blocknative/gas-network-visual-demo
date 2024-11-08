// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Oracle is Ownable { 

    mapping (uint256 => SignedEstimation) estimations;

    constructor() Ownable(msg.sender) {} 

    struct SignedEstimation {
        Estimation e;
        bytes sig;
    }

    struct EstimationValues {
        uint256 gasPrice;
        uint256 maxPriorityFeePerGas;
        uint256 maxFeePerGas;
    }

    struct Estimation {
        EstimationValues Q70;
        EstimationValues Q80;
        EstimationValues Q90;
        EstimationValues Q95;
        EstimationValues Q99;
        uint8 precision;
        uint128 height;
        uint256 timestamp;
        uint256 chainid;
    }

    function setEstimation(Estimation calldata e, bytes calldata signature) public onlyOwner {
        SignedEstimation storage prev = estimations[e.chainid];
        require(e.height >= prev.e.height, "newer block estimation already exists");
        require(e.timestamp > prev.e.timestamp, "newer timestamp estimation already exists");

        prev.e = e;
        prev.sig = signature;
    }
 
    function getEstimation(uint256 chainid) 
    public view returns ( Estimation memory e, bytes memory signature) {
        SignedEstimation storage se = estimations[chainid];
        require(se.e.height > 0, "no estimations for network");
        return (se.e, se.sig);  
    }
}
