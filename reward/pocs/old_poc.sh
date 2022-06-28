#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# Make data for signing
### // const messagePrefix = "\x19Ethereum Signed Message:\n";
### // function hashMessage(message) {
### //     if (typeof (message) === "string") {
### //         message = toUtf8Bytes(message);
### //     }
### //     return keccak256(concat([
### //         toUtf8Bytes(messagePrefix),
### //         toUtf8Bytes(String(message.length)),
### //         message
### //     ]));
### // }

### const { toUtf8Bytes } = require("@ethersproject/strings");
### > toUtf8Bytes("a")
### Uint8Array(1) [ 97 ]
### > toUtf8Bytes("\x19")
### Uint8Array(1) [ 25 ]
### > toUtf8Bytes("\x19")
### Uint8Array(1) [ 25 ]
### > toUtf8Bytes("\x19Ethereum Signed Message:\n")
### Uint8Array(26) [
###    25,  69, 116, 104, 101, 114, 101,
###   117, 109,  32,  83, 105, 103, 110,
###   101, 100,  32,  77, 101, 115, 115,
###    97, 103, 101,  58,  10
### ]
### > toUtf8Bytes("\n")
### Uint8Array(1) [ 10 ]

# TODO: MESSAGE=userId + real ethereum address (but it is not the leaf)
MESSAGE="hello" 
PREFIX=$'\x19Ethereum Signed Message:\n'
LENGTH=$(echo "$MESSAGE" | awk '{print length}')
DATA="${PREFIX}${LENGTH}${MESSAGE}"

# # Hash data with Keccak256, replace unbreakable space with usual space, take first argument
# # cargo install sha3sum
HASH=$(echo -n "$DATA" | (sha3sum -a Keccak256 -t || true) | awk -F $'\xC2\xA0' '{ print $1 }')
echo "HASH is $HASH"


# # Generate Ethereum key
# # openssl ecparam -name secp256k1 -genkey -noout -out secp256k1_tmp_eth.key

# # generate key in DER form and extract byte range (7, 39) to get 32-byte key
# # NOTE: you can use `openssl asn1parse -inform der` to analyze DER
# TMP_KEY=$(openssl ecparam -name secp256k1 -genkey -noout -outform der 2>/dev/null | xxd -s 7 -l 32 -p -c 32)

# # Generate new key: openssl ecparam -name secp256k1 -genkey -noout -out secp256k1_tmp_eth.key
TMP_KEY_FROM_FILE=$(openssl ec -in secp256k1_tmp_eth.key -outform der 2>/dev/null | xxd -s 7 -l 32 -p -c 32)

# # openssl ec -in secp256k1_tmp_eth.key -outform der  2>/dev/null | xxd -s 7 -l 32 -p -c 32

# # openssl pkeyutl -sign -inkey secp256k1_tmp_eth.key -in hello_sha256.bin > hello_secp256k.sign
# echo "$HASH" | openssl pkeyutl -sign -inkey secp256k1_tmp_eth.key
# openssl asn1parse -inform der

# c1e652e7e91cef64a526a4940c2b4b3f63964b09766adab5b90ecb86a38c17f8