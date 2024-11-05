// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "./EIP712.sol";

contract Oracle is EIP712 {
    
    address owner;
    address verifier;

    mapping (uint256 => Estimation) private estimations;

    bytes32 public constant ESTIMATION_VALUES_TYPEHASH = keccak256(
        "EstimationValues(uint256 gasPrice,uint256 maxPriorityFeePerGas,uint256 maxFeePerGas)"
    );

    bytes32 public constant ESTIMATION_TYPEHASH = keccak256(
        "Estimation(EstimationValues Q70,EstimationValues Q80,EstimationValues Q90,EstimationValues Q95,EstimationValues Q99,uint8 precision,uint128 height,uint256 timestamp,uint256 chainid)EstimationValues(uint256 gasPrice,uint256 maxPriorityFeePerGas,uint256 maxFeePerGas)"
    );

    enum Quantile {  
        Q99,  
        Q95,    
        Q90,  
        Q80, 
        Q70
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

    constructor(string memory name, address verifyingContract, uint256 chainid) EIP712(name, verifyingContract, chainid, "1") {
        owner = msg.sender;
        verifier = msg.sender;
    }

    function setVerifier(address v) public {
        require(msg.sender == owner);
        verifier = v;
    }

    function hashEstimationValues(EstimationValues memory values) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            ESTIMATION_VALUES_TYPEHASH,
            values.gasPrice,
            values.maxPriorityFeePerGas,
            values.maxFeePerGas
        ));
    }

    function setEstimation(Estimation calldata est, bytes calldata signature ) public {

        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            ESTIMATION_TYPEHASH, 
            hashEstimationValues(est.Q70),
            hashEstimationValues(est.Q80),
            hashEstimationValues(est.Q90),
            hashEstimationValues(est.Q95),
            hashEstimationValues(est.Q99),
            est.precision,
            est.height,
            est.timestamp,
            est.chainid
        )));

        address signer = ECDSA.recover(digest, signature);
        require(signer == verifier, "invalid signer");
        require(signer != address(0), "ECDSA: invalid signature");

        Estimation memory prev = estimations[est.chainid];
        require(est.height > prev.height, "estimation already exists");

        estimations[est.chainid] = est;
    }
 
    function getGasEstimationQuantile(uint256 chainId, uint64 delay, Quantile quantile ) 
    public view returns ( EstimationValues memory val) {
        
        Estimation memory e = estimations[chainId];
        require(e.height > 0, "no estimations for network");
        require(block.timestamp - e.timestamp < delay, "timeout");
        
        if (quantile == Quantile.Q99) {
            return e.Q99;
        } else if (quantile == Quantile.Q95) {
            return e.Q95;
        } else if (quantile == Quantile.Q90) {
            return e.Q90;
        } else if (quantile == Quantile.Q80) {
            return e.Q80;
        } else if (quantile == Quantile.Q70) {
            return e.Q70;
        }  
    }
}


