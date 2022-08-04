#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# TODO: check age is installed
# TODO: check sha3sum is installed via cargo
# TODO: tell user how to install utilities
# TODO: or just have "install_utils.sh" in docs

# REWARDED_KEYS format:
# GH username,SSH key
#
# NOTE: there could be multiple entries for a single GH username

# `$#`` is the number of arguments
if [ $# -eq 1 ]; then
    REWARDED_KEYS="$(pwd)/$1"
else
    # shellcheck disable=SC2162 # backslash mangling is expected
    read -p "Enter path to REWARDED_KEYS file: " REWARDED_KEYS
fi

# dir to store all output files
WORK_DIR="$(pwd)/workdir"
# JS tool to generate merkle proofs
MERKLE_PROOF_TOOL_DIR="$(pwd)/merkle_proof"
# Data to create Merkle Tree: userId,tmp_eth_addr
TREE_DATA="$WORK_DIR/tree_data"
# Data with Merkle Proofs: userId,tmp_eth_addr,merkle proof
MERKLE_TREE="$WORK_DIR/merkle_tree"
# Merkle tree root
MERKLE_ROOT="$WORK_DIR/merkle_root"
# final output: GH UserName,Encrypted[userId,tmp_eth_addr,tmp_eth_key,merkle proof]
KEYS_BIN="$WORK_DIR/keys.bin"
REWARDED_KEYS_SHUFFLED="$WORK_DIR/rewarded_keys_shuffled"

rm -f "$TREE_DATA"
rm -f "$MERKLE_TREE"
rm -f "$MERKLE_ROOT"
rm -f "$KEYS_BIN"
rm -f "$REWARDED_KEYS_SHUFFLED"

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

USERNAMES=$(cat "$REWARDED_KEYS" | cut -d',' -f1 | sort -u)
NUMBER_OF_USERS=$(echo "$USERNAMES" | wc -l | awk '{ print $1 }')

# Shuffle usernames in $REWARDED_KEYS so user ids are assigned randomly
cat "$REWARDED_KEYS" | sort -R | sort -t, -k1 > "$REWARDED_KEYS_SHUFFLED"

# Generate randomized sequence of user ids
# shellcheck disable=SC2207 # already taken care of
USER_IDS=($(seq 1 "$NUMBER_OF_USERS" | sort -R))

#####
### Generate temporary Ethereum wallet for each USER_ID
###

USER_ID_WITH_ETH_KEY=()
for USER_ID in "${USER_IDS[@]}"; do
    # Generate Ethereum temporary key - that key user would use to sign award claim proof
    ETH_KEY_PEM=$(openssl ecparam -name secp256k1 -genkey 2>/dev/null | grep -A10 'EC PRIVATE')
    ETH_KEY_HEX=$(echo "$ETH_KEY_PEM" | openssl ec -outform der 2>/dev/null | xxd -p -c 118)
    # Save relation between USER_ID and ETH_KEY in memory
    USER_ID_WITH_ETH_KEY+=("$USER_ID,$ETH_KEY_HEX")

    # Calculate Ethereum address: uncompressed secp256k1, strip first 23+1 bytes
    PUB_KEY=$(echo "$ETH_KEY_PEM" | openssl ec -pubout -outform der 2>/dev/null | xxd -s 24 -p -c 64)
    PUB_KEY_HASH=$(echo "$PUB_KEY" | xxd -r -p | (sha3sum -a Keccak256 -t || true) | awk -F $'\xC2\xA0' '{ print $1 }')
    ETH_ADDR=$(echo "$PUB_KEY_HASH" | xxd -r -p | xxd -p -c 20 -s 12)
    MEKLRE_TREE_ENTRY="${USER_ID},${ETH_ADDR}"
    echo "$MEKLRE_TREE_ENTRY" >> "$TREE_DATA"
done

#####
### Generate Merkle Proofs
###

pushd "$MERKLE_PROOF_TOOL_DIR" >/dev/null # change directory to
node index.js merkle_proofs "$TREE_DATA" "$MERKLE_TREE"
node index.js merkle_root "$TREE_DATA" > "$MERKLE_ROOT"
popd >/dev/null # we're back to WORK_DIR

#####
### Merge Merkle Proofs with GitHub usernames and SSH keys
### NOTE: This is a very sensitive data. It shows connection between USER_ID and a GitHub Username.
###       So this code doesn't leave any trace on the filesystem to avoid accidental publication of that information.
###       For that reason, `<(echo VAR)` is used. That syntax allows to create in-memory "files" without leaving any traces on the file system.

# format: userid,tmp_eth_key
ETH_KEYS_SORTED=$(printf "%s\n" "${USER_ID_WITH_ETH_KEY[@]}" | sort -k1)

# format: userid,tmp_eth_addr,merkle_proof
MERKLE_TREE_SORTED=$(cat "$MERKLE_TREE" | sort -k1)

# format: userid,tmp_eth_addr,tmp_eth_key,merkle_proof
TREE_WITH_ETH_KEYS=$(join -t, -1 1 -2 1 -o '2.1,2.2,1.2,2.3' <(echo "$ETH_KEYS_SORTED") <(echo "${MERKLE_TREE_SORTED}"))

# format: github username,userid,tmp_eth_addr,tmp_eth_key,merkle_proof
BY_USERNAME=$(paste -d, <(echo "$USERNAMES") <(echo "$TREE_WITH_ETH_KEYS") | sort -k1)

# format: github username,ssh key
REWARDED_KEYS_SORTED=$(cat "$REWARDED_KEYS" | sort -t, -k1)

# format: github username,ssh key,userid,tmp_eth_addr,tmp_eth_key,merkle_proof
DATA_WITH_SSH_KEYS=$(join -t, -1 1 -2 1 -o '2.1,2.2,1.2,1.3,1.4,1.5' <(echo "$BY_USERNAME") <(echo "$REWARDED_KEYS_SORTED"))

#####
### Encrypt and write to keys.bin
###
while IFS= read -r ENTRY; do
    # Encrypt `userid,tmp_eth_addr,tmp_eth_private_key,merkle_proof` for SSH key
    GITHUB_USERNAME=$(echo "$ENTRY" | cut -d, -f1)
    SSH_KEY=$(echo "$ENTRY" | cut -d, -f2)
    DATA=$(echo "$ENTRY" | cut -d, -f3,4,5,6)

    ENCRYPTED_DATA_HEX=$(echo "$DATA" | age --encrypt --recipient "$SSH_KEY" -o - | xxd -p -c 10000)
    echo "${GITHUB_USERNAME},${ENCRYPTED_DATA_HEX}" >> "$KEYS_BIN"
done <<< "$DATA_WITH_SSH_KEYS"
