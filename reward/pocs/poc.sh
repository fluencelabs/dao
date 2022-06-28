#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

## Generation PoC
# 1. Generate SSH key
# 2. Generate Ethereum temporary key
# 3. Generate temporary AGE identity
# 4. Encrypt #2 with #3 for #1
# 5. Decrypt #4 with #1

## Signing PoC 
# 1. Take Ethereum key
# 2. Make data for signing: "\x19Ethereum Signed Message:\n" + len(message) + message
# 3. Hash #2 with Keccak256 (sha3sum)
# 4. Sign #3 with #1 (openssl)
# 5. Compare signature to the one done in HardHat
# 5a. ~Submit signature to Smart Contract and see if it works~

set -x

ETHEREUM_ADDRESS="0xa"
DECRYPTED_DATA="./decrypted.data"

MESSAGE="$ETHEREUM_ADDRESS" 
PREFIX=$'\x19Ethereum Signed Message:\n'
LENGTH=$(echo "$MESSAGE" | awk '{print length}')
DATA="${PREFIX}${LENGTH}${MESSAGE}"

## '|| true' is needed to work around this bug https://gitlab.com/kurdy/sha3sum/-/issues/2
HASH=$(echo -n "$DATA" | (sha3sum -a Keccak256 -t || true) | awk -F $'\xC2\xA0' '{ print $1 }')

## Write temporary eth key to file
ETH_KEY_DER="$(pwd)/tmp_eth.key.der"
cat "$DECRYPTED_DATA" | cut -d',' -f2 | xxd -r -p > "$ETH_KEY_DER"
ETH_KEY="$(pwd)/tmp_eth.key"
## Convert secp256k1 key from DER (binary) to textual representation
openssl ec -inform der -in "$ETH_KEY_DER" > "$ETH_KEY"

# TMP_KEY_FROM_FILE=$(openssl ec -in secp256k1_tmp_eth.key -outform der 2>/dev/null | xxd -s 7 -l 32 -p -c 32)
## Sign hash of the real ethereum address with the temporary one
echo "$HASH" | openssl pkeyutl -sign -inkey "$ETH_KEY" | xxd -p -c 72
