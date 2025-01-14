// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Oracle {
   
  address private owner;
  address private signer;
 
  constructor() {
    owner = msg.sender;
  }

  struct Record {
    uint64 height;
    uint48 timestamp;
    uint240 value;
  } 

  mapping (uint88 => Record) private pStore; 

  function setSignerAddress(address s) public {
      assert(owner == msg.sender);
      signer = s;
  }

  function transferOwnership(address o) public {
      assert(owner == msg.sender);
      owner = o;
  }

  function storeValues(bytes memory dat) public { 
      uint offset;
      assembly{
          offset := add(dat, 0x20) // skip bytes length
      }

      uint88 scid;
      uint16 plen;
      uint48 ts;
      uint64 h;
      (plen, scid, ts, h) = decodeHeader( offset );
      
      uint256 val;
      uint16 typ;
      uint8 j;

      checkSignature( plen, offset, signer );
      while (j < plen) {
        assembly {
          let start := add(dat, 0x40)
          val := mload(add(start,mul(0x20,j)))
          typ := shl(0x8, byte(0, val))
          typ := add(typ, byte(1, val))
        }
        scid = appendType( scid, typ);
        Record storage rec = pStore[scid];

        if ( rec.height < h && rec.timestamp <= ts ) { 
            pStore[scid] = Record(h,ts,uint240(val));
        }
        j++;
      }

  }

  function decodeHeader( uint offset ) private pure returns (uint16 plen, uint88 scid, uint48 ts, uint64 h)  { 
    uint64 cid;
    uint8 sid;
    bytes32 buf;
    assembly {

      // HEADER
      buf := mload(offset)

      // decode version 
      let ver :=  byte(0, buf)

      // shift 8 + decode height
      buf := shr(0x08, buf)  
      h := buf

      // shift 32 + decode chain id
      buf := shr(0x40, buf)  
      cid := buf

      // shift 32 + decode service id
      buf := shr(0x40, buf)  
      sid := buf

      // shift 8 + decode timestamp
      buf := shr(0x08, buf)
      ts  := buf

      // shift 48 + decode estimations length
      buf := shr(0x30, buf)
      plen := buf

      scid := sid
      scid := shl(0x40, scid) 
      scid := cid
      scid := shl(0x10, scid)
    }


    return (plen, scid, ts, h );
  }

  function checkSignature( uint16 plen, uint offset, address ssigner ) private pure    { 
    bytes32 r;
    bytes32 s;
    uint8 v;
    bytes32 kec;

    assembly {
        // SIGNATURE

        // calc signature pos 
        let sigPos := add(0x20, mul(0x20, plen))

        // hash content
        kec := keccak256(offset, sigPos)
        
        // shift + decode r
        offset := add(offset, sigPos)           
        r := mload(offset)  

        // shift + decode s
        offset := add(offset, 0x20)
        s := mload(offset)

        // shift + decode v
        offset := add(offset, 0x20) 
        v := byte(0, mload(offset))
    }
  
    if (v != 27 && v != 28) { 
      revert( "invalid signer v param");
    }
    
    address addr = ecrecover(kec, v, r, s); 
    require(addr != address(0), "ECDSA: invalid signature");
    require(ssigner==addr, "invalid signer");
  }


  function appendType(uint88 scida, uint16 typ) private pure returns (uint88 scidb) {
    assembly {
      scidb := shr(0x10, scida)
      scidb := shl(0x10, scidb)
      scidb := add(scidb, typ) 
    }
    return scidb;
  }

  function get(uint8 systemid, uint64 cid, uint16 typ) public view returns (uint256 value, uint64 height, uint48 timestamp ) {  
    Record storage s = pStore[getKey(systemid,cid,typ)];
    return (uint256(s.value), s.height, s.timestamp);
  }

  function getValue(uint8 systemid, uint64 cid, uint16 typ) public view returns (uint256 value) {
    Record storage s = pStore[getKey(systemid,cid,typ)];
    return uint256(s.value);
  }

  function getRecord(uint8 systemid, uint64 cid, uint16 typ) public view returns (Record memory r) { 
    return pStore[getKey(systemid,cid,typ)];
  }

  function getInTime(uint8 systemid, uint64 cid, uint16 typ, uint48 tin) public view returns (uint256 value, uint64 height, uint48 timestamp ) {  
    Record storage s = pStore[getKey(systemid,cid,typ)];
    if ( s.timestamp > block.timestamp * 1000 - tin ) {
      return (uint256(s.value), s.height, s.timestamp);
    }

    return (0,0,0);
  }

  function getKey(uint8 sid, uint64 cid, uint16 typ) private pure returns (uint88 scid) { 
    assembly {
      scid := sid
      scid := shl(0x40, scid)
    
      scid := add(scid, cid)
      scid := shl(0x10, scid)

      scid := add(scid, typ)
    }
    return (scid);
  }
}