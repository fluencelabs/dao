#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

ETH_KEY_FILE=$1
HASH="16b2a0fb0e44a02560123359ea248da287367d45340ab13d0a81045fda38283d"

if [ -z "$ETH_KEY_FILE" ]; then
    echo "Please pass path to secp256k1 openssl key"
    exit 1
fi

echo "Will read key '$1'"

echo "Private key is"
openssl ec -in "$ETH_KEY_FILE" -outform der  2>/dev/null | xxd -s7 -l 32 -p -c 32

PUB_KEY=$(openssl ec -in "$ETH_KEY_FILE" -pubout -outform der 2>/dev/null | xxd -s 24 -p -c 64)
echo "Public key $PUB_KEY"

PUB_KEY_HASH=$(echo "$PUB_KEY" | xxd -r -p | (sha3sum -a Keccak256 -t || true) | awk -F $'\xC2\xA0' '{ print $1 }')

ETH_ADDR=$(echo "$PUB_KEY_HASH" | xxd -r -p | xxd -p -c 20 -s 12)
echo "Ethereum address is $ETH_ADDR"

echo "Signing $HASH..."
echo "$HASH" | xxd -r -p | openssl pkeyutl -sign -inkey "$ETH_KEY_FILE" | xxd -p -c 9999
