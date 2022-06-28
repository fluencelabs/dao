#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

TMP_DIR="$(pwd)/tmp/generate_poc"
mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

USER_ID=0
# MERKLE_PROOF='["0x3338db17274c0b47d9904160039c39ad88b20478df6152be17726473a3d516cd","0x7036afa22b2bb60ae94796a3a44f77e167d5a7c70f5f519669dbf4c82546e221","0x1896606ae773d08575c33e0ac117a7ffe7d69cb8ead5f69b732a6c1a44a60571","0xa958cced9f51806a438c57e178fada2d178c56d0dfe56ccd8ecd12c8aabb556d","0xcaf51742730d507e79adf2003a1b17ba3fd2193987d18ba514bbf299e809d064","0x19d2b08f052bce60bc9dcc8c923a5847d8ced70b7287f2b6b4572a55d29ecd9b","0x53af452e8526c0615491e09e193ffc8ebb8595bb1bdf18d50828a5acbd69e7c0","0x516e7b3a2a47a30f4dc262a337b8c25047f3e3b48a941c3ae16e9df6f8ef1dc8","0xd7eed87cde7bcce821cfdf1ab84993a97d7fb880b21a3f6c1e635859d08313bc","0x8cca3ca81cc7950c693edcd690b2ba1001d19a30778363a664eda845b45ea144"]'
MERKLE_PROOF='WyIweDMzMzhkYjE3Mjc0YzBiNDdkOTkwNDE2MDAzOWMzOWFkODhiMjA0NzhkZjYxNTJiZTE3NzI2NDczYTNkNTE2Y2QiLCIweDcwMzZhZmEyMmIyYmI2MGFlOTQ3OTZhM2E0NGY3N2UxNjdkNWE3YzcwZjVmNTE5NjY5ZGJmNGM4MjU0NmUyMjEiLCIweDE4OTY2MDZhZTc3M2QwODU3NWMzM2UwYWMxMTdhN2ZmZTdkNjljYjhlYWQ1ZjY5YjczMmE2YzFhNDRhNjA1NzEiLCIweGE5NThjY2VkOWY1MTgwNmE0MzhjNTdlMTc4ZmFkYTJkMTc4YzU2ZDBkZmU1NmNjZDhlY2QxMmM4YWFiYjU1NmQiLCIweGNhZjUxNzQyNzMwZDUwN2U3OWFkZjIwMDNhMWIxN2JhM2ZkMjE5Mzk4N2QxOGJhNTE0YmJmMjk5ZTgwOWQwNjQiLCIweDE5ZDJiMDhmMDUyYmNlNjBiYzlkY2M4YzkyM2E1ODQ3ZDhjZWQ3MGI3Mjg3ZjJiNmI0NTcyYTU1ZDI5ZWNkOWIiLCIweDUzYWY0NTJlODUyNmMwNjE1NDkxZTA5ZTE5M2ZmYzhlYmI4NTk1YmIxYmRmMThkNTA4MjhhNWFjYmQ2OWU3YzAiLCIweDUxNmU3YjNhMmE0N2EzMGY0ZGMyNjJhMzM3YjhjMjUwNDdmM2UzYjQ4YTk0MWMzYWUxNmU5ZGY2ZjhlZjFkYzgiLCIweGQ3ZWVkODdjZGU3YmNjZTgyMWNmZGYxYWI4NDk5M2E5N2Q3ZmI4ODBiMjFhM2Y2YzFlNjM1ODU5ZDA4MzEzYmMiLCIweDhjY2EzY2E4MWNjNzk1MGM2OTNlZGNkNjkwYjJiYTEwMDFkMTlhMzA3NzgzNjNhNjY0ZWRhODQ1YjQ1ZWExNDQiXQo='

## Generation PoC
# 1. Generate SSH key
# 2. Generate Ethereum temporary key (secp256k1 key)
# 3. Encrypt #2 for #1
# 5. Decrypt #4 with #1

# Generate SSH key - that way we're emulating a user who would be reward. Imagine we took that key from GitHub.
SSH_KEY_FILE="$(pwd)/tmp_ssh_ed25519.key"
echo "removing $SSH_KEY_FILE"
rm -f "$SSH_KEY_FILE"
ssh-keygen -t ed25519 -f "$SSH_KEY_FILE" -N ''

# Generate Ethereum temporary key - that key user would use to sign award claim proof
ETH_KEY_FILE="$(pwd)/../rewarded.eth.key"
# openssl ecparam -name secp256k1 -genkey -noout -out "$ETH_KEY_FILE"

# Serialize secp256k1 in DER (binary) form to hex
ETH_KEY=$(openssl ec -in "$ETH_KEY_FILE" -outform der | xxd -p -c 118) # -c 118 sets width of output to 118 bytes to avoid newlines

# Calculate Ethereum address: uncompressed secp256k1, strip first 23+1 bytes
PUB_KEY=$(openssl ec -in "$ETH_KEY_FILE" -pubout -outform der 2>/dev/null | xxd -s 24 -p -c 64)
PUB_KEY_HASH=$(echo "$PUB_KEY" | xxd -r -p | (sha3sum -a Keccak256 -t || true) | awk -F $'\xC2\xA0' '{ print $1 }')
ETH_ADDR=$(echo "$PUB_KEY_HASH" | xxd -r -p | xxd -p -c 20 -s 12)

# Encrypt data with AGE key for SSH public key - this way it's possible to publish it securely. i.e., only awarded user (owner of SSH private key) can decrypt it
ENCRYPTED_DATA="$(pwd)/encrypted.data"
DATA="${USER_ID},${ETH_ADDR},${ETH_KEY},${MERKLE_PROOF}"
echo "Encrypting $DATA"
echo "$DATA" | age --encrypt --recipients-file "$SSH_KEY_FILE.pub" -o "$ENCRYPTED_DATA"

# Decrypt Ethereum key with SSH private key
DECRYPTED_DATA=$(age --decrypt -i "$SSH_KEY_FILE" "$ENCRYPTED_DATA")
echo "Decrypted $DECRYPTED_DATA"

echo "Encrypted in hex:"
xxd -p -c 100000 "$ENCRYPTED_DATA"

if [[ "$DATA" == "$DECRYPTED_DATA" ]]; then
    echo "Success"
else
    echo "Fail! ETH_KEY != DECRYPTED_DATA"
    exit 1
fi
