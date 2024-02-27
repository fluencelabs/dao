import { ethers } from "ethers";
import { define } from "asn1.js";
import { BN } from "bn.js";
import { Buffer } from "buffer";
import * as ethutil from "ethereumjs-util";

const EcdsaSigAsnParse = define("EcdsaSig", function () {
  // parsing sig according to https://tools.ietf.org/html/rfc3279#section-2.2.3
  this.seq().obj(this.key("r").int(), this.key("s").int());
});

// 16b2a0fb0e44a02560123359ea248da287367d45340ab13d0a81045fda38283d

export function validateSignature(
  hashHex,
  signatureArg,
  expectedEthAddr,
  isASN1,
) {
  // let hash = "50b2c43fd39106bafbba0da34fc430e1f91e3c96ea2acee2bc34119f92b37750";
  // let asn1Signature = "304402204c45f724b4bc4b7994f634f94807701e399731f422f2556d205ffa10df1ab1b302206685617710ad55a5ac4f9b605e5d21461feba47ddf76eea8c581657eebc20734";

  // % echo 304402204c45f724b4bc4b7994f634f94807701e399731f422f2556d205ffa10df1ab1b302206685617710ad55a5ac4f9b605e5d21461feba47ddf76eea8c581657eebc20734 | xxd -r -p | openssl asn1parse -inform der
  //   0:d=0  hl=2 l=  68 cons: SEQUENCE
  //   2:d=1  hl=2 l=  32 prim: INTEGER           :4C45F724B4BC4B7994F634F94807701E399731F422F2556D205FFA10DF1AB1B3
  //  36:d=1  hl=2 l=  32 prim: INTEGER           :6685617710AD55A5AC4F9B605E5D21461FEBA47DDF76EEA8C581657EEBC20734

  var bufferHash;
  if (hashHex.startsWith("0x")) {
    bufferHash = Buffer.from(hashHex.slice(2), "hex");
  } else {
    bufferHash = Buffer.from(hashHex, "hex");
  }
  console.log("bufferHash", bufferHash);

  let signature = signatureArg;
  if (isASN1) {
    let asn1Signature = Buffer.from(signatureArg, "hex");

    let bufferSig = Buffer.from(asn1Signature);

    let { r, s } = findEthereumSig(bufferSig);
    let { v } = findRightKey(bufferHash, r, s, expectedEthAddr);
    let raw_signature = {
      r: "0x" + r.toString(16, 32),
      s: "0x" + s.toString(16, 32),
      v,
    };
    signature = ethers.utils.splitSignature(raw_signature);
  }

  console.log("signature", signature);
  let recoveredAddress = ethers.utils.recoverAddress(hashHex, signature);
  console.log("recoveredAddress", recoveredAddress);

  console.log("signature", ethers.utils.joinSignature(signature));

  if (recoveredAddress.toLowerCase() !== expectedEthAddr.toLowerCase()) {
    throw new Error(
      `Expected ETH addr ${expectedEthAddr}, but recovered ${recoveredAddress}. Signature must be invalid.`,
    );
  }

  return ethers.utils.joinSignature(signature);
}

function recoverPubKeyFromSig(msg, r, s, v) {
  console.log(
    "Recovering public key with msg " +
      msg.toString("hex") +
      " r: " +
      r.toString(16) +
      " s: " +
      s.toString(16),
  );
  let rBuffer = r.toArrayLike(Buffer);
  let sBuffer = s.toArrayLike(Buffer);

  let pubKey = ethutil.ecrecover(msg, v, rBuffer, sBuffer);
  let addrBuf = ethutil.pubToAddress(pubKey);
  var RecoveredEthAddr = ethutil.bufferToHex(addrBuf);
  // let RecoveredEthAddr = ethers.utils.recoverAddress(msg, v, rBuffer, sBuffer);
  console.log("Recovered ethereum address: " + RecoveredEthAddr);
  return RecoveredEthAddr;
}

function findRightKey(msg, r, s, expectedEthAddr) {
  // This is the wrapper function to find the right v value
  // There are two matching signatues on the elliptic curve
  // we need to find the one that matches to our public key
  // it can be v = 27 or v = 28
  let v = 27;
  let pubKey = recoverPubKeyFromSig(msg, r, s, v);
  console.log("PubKey: " + pubKey + " expected: " + expectedEthAddr);
  if (pubKey.toLowerCase() !== expectedEthAddr.toLowerCase()) {
    // if the pub key for v = 27 does not match
    // it has to be v = 28
    v = 28;
    pubKey = recoverPubKeyFromSig(msg, r, s, v);
  }
  console.log("Found the right ETH Address: " + pubKey + " v: " + v);
  return { pubKey, v };
}

export function findEthereumSig(signatureHex) {
  let decoded = EcdsaSigAsnParse.decode(signatureHex, "der");
  let r = decoded.r;
  let s = decoded.s;
  console.log("decoded: " + JSON.stringify(decoded));
  console.log("r: " + r.toString(10));
  console.log("s: " + s.toString(10));

  let tempsig = r.toString(16) + s.toString(16);

  let secp256k1N = new BN(
    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
    16,
  ); // max value on the curve
  let secp256k1halfN = secp256k1N.div(new BN(2)); // half of the curve
  // Because of EIP-2 not all elliptic curve signatures are accepted
  // the value of s needs to be SMALLER than half of the curve
  // i.e. we need to flip s if it's greater than half of the curve
  if (s.gt(secp256k1halfN)) {
    console.log(
      "s is on the wrong side of the curve... flipping - tempsig: " +
        tempsig +
        " length: " +
        tempsig.length,
    );
    // According to EIP2 https://github.com/ethereum/EIPs/blob/master/EIPS/eip-2.md
    // if s < half the curve we need to invert it
    // s = curve.n - s
    s = secp256k1N.sub(s);
    console.log("new s: " + s.toString(10));
    return { r, s };
  }
  // if s is less than half of the curve, we're on the "good" side of the curve, we can just return
  return { r, s };
}
