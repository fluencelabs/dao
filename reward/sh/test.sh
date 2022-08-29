#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

TEST_DIR="$(pwd)/test_data"
WORK_DIR="$TEST_DIR/workdir"
REWARDED_KEYS_FULL_PATH="$TEST_DIR/rewarded_keys.csv"

TEMP_ETH_KEY_DER="$WORK_DIR/tmp_eth.key.der"
SIGN_FILE="$WORK_DIR/sign.bin"
MERKLE_ROOT_FILE="$WORK_DIR/merkle_root"
MERKLE_TREE_FILE="$WORK_DIR/merkle_tree"

REWARDED_KEYS="test_data/rewarded_keys.csv"

GENERATE_SH="$(pwd)/generate.sh"
PROOF_SH="$(pwd)/proof.sh"
MERKLE_PROOF_TOOL_DIR="$(pwd)/merkle_proof"

# Generate random ethereum ADDRESS
ETH_KEY_PEM=$(openssl ecparam -name secp256k1 -genkey 2>/dev/null | grep -A10 'EC PRIVATE')
ETH_KEY_HEX=$(echo "$ETH_KEY_PEM" | openssl ec -outform der 2>/dev/null | xxd -p -c 118)

# Calculate Ethereum ADDRESS: uncompressed secp256k1, strip first 23+1 bytes
PUB_KEY=$(echo "$ETH_KEY_PEM" | openssl ec -pubout -outform der 2>/dev/null | xxd -s 24 -p -c 64)
PUB_KEY_HASH=$(echo "$PUB_KEY" | xxd -r -p | (sha3sum -a Keccak256 -t || true) | awk -F $'\xC2\xA0' '{ print $1 }')
RANDOM_ETH_ADDRESS=$(echo "$PUB_KEY_HASH" | xxd -r -p | xxd -p -c 20 -s 12)

USERS=("user_1" "user_2" "user_3")
USER_WITH_DOUBLE_KEY="user_3"
TESTS=(test_generate test_proof test_double_key)

fail_if_error() {
    if ! [ $? -eq 0 ]; then
        echo - ❌ fail$'\n'
        exit 1
    fi
}

throw() {
    ERROR=$1
    echo - ❌ fail $ERROR $'\n'
    exit
}

print_test_title() {
    TEST_NAME=$1
    echo "Test: $TEST_NAME"
}

test_generate() {
    $GENERATE_SH $REWARDED_KEYS $WORK_DIR
    MERKLE_ROOT=$(cat $MERKLE_ROOT_FILE)

    pushd "$MERKLE_PROOF_TOOL_DIR" >/dev/null # change directory to
    EXPECTED_ROOT=$(node index.js merkle_root "$MERKLE_TREE_FILE")
    fail_if_error
    popd >/dev/null # we're back to WORK_DIR

    if [ "$MERKLE_ROOT" != "$EXPECTED_ROOT" ]; then
        throw "Invalid merkle root"
    fi
}

verify_sign() {
    ADDRESS=$1
    SIGNATURE=$2
    ## Prepare real ethereum addres to be hashed and signed
    ETH_ADDR_HEX_ONLY=$(echo -n "$RANDOM_ETH_ADDRESS" | sed -e 's/^0x//')
    # length of ETH key is always 20 bytes
    LENGTH="20"
    PREFIX_HEX=$(echo -n $'\x19Ethereum Signed Message:\n'${LENGTH} | xxd -p)
    DATA_HEX="${PREFIX_HEX}${ETH_ADDR_HEX_ONLY}"

    ## '|| true' is needed to work around this bug https://gitlab.com/kurdy/sha3sum/-/issues/2
    HASH=$(echo -n "$DATA_HEX" | xxd -r -p | (sha3sum -a Keccak256 -t || true) | awk -F $'\xC2\xA0' '{ print $1 }')
    echo $SIGNATURE | xxd -r -p -c 72 >$SIGN_FILE

    VERIFICATION_RESULT=$(echo "$HASH" | xxd -r -p | openssl pkeyutl -verify -keyform DER -inkey "$TEMP_ETH_KEY_DER" -sigfile "$SIGN_FILE")

    TEMP_PUB_KEY=$(openssl ec -pubout -outform der -inform der -in "$TEMP_ETH_KEY_DER" 2>/dev/null | xxd -s 24 -p -c 64)
    fail_if_error

    TEMP_PUB_KEY_HASH=$(echo "$TEMP_PUB_KEY" | xxd -r -p | (sha3sum -a Keccak256 -t || true) | awk -F $'\xC2\xA0' '{ print $1 }')
    fail_if_error

    TEMP_ETH_ADDR=$(echo "$TEMP_PUB_KEY_HASH" | xxd -r -p | xxd -p -c 20 -s 12)

    if [ "$VERIFICATION_RESULT" != "Signature Verified Successfully" ] || [ "$TEMP_ETH_ADDR" != "$ADDRESS" ]; then
        throw "Invalid signature"
    fi
}

test_proof_by_user() {
    USER=$1
    KEY=$USER
    if [ $# -gt 2 ]; then
        KEY=$2
    fi
    pushd "$TEST_DIR" >/dev/null
    PROOF_SH_RESULT=$($PROOF_SH "$USER" ${RANDOM_ETH_ADDRESS} "${TEST_DIR}/$USER" | tail -1)
    fail_if_error
    popd >/dev/null

    PARSED_OUT=(${PROOF_SH_RESULT//,/ })
    SIGNATURE=${PARSED_OUT[2]}
    ADDRESS=${PARSED_OUT[1]}
    verify_sign $ADDRESS $SIGNATURE
    fail_if_error
}

test_proof() {
    for user in "${USERS[@]}"; do
        echo "- test user: $user"
        test_proof_by_user $user
        fail_if_error
    done
}

test_double_key() {
    test_proof_by_user $USER_WITH_DOUBLE_KEY $USER3_SECOND_KEY_NAME
    fail_if_error

    MERKLE_TREE=$(cat $WORK_DIR/merkle_tree)

    MERKLE_TREE=(${MERKLE_TREE//n/ })

    if [ ${#MERKLE_TREE[@]} != 3 ]; then
        throw "Invalid merkle tree"
    fi
}

init() {
    if [ -d "$TEST_DIR" ]; then
        rm -r $TEST_DIR
    fi

    mkdir $TEST_DIR

    IS_FIRST=true
    for user in "${USERS[@]}"; do
        if [ $IS_FIRST ]; then
            ssh-keygen -t ed25519 -C "$user" -f "$TEST_DIR/$user" -N ""
        else
            ssh-keygen -t rsa -C "$user" -f "$TEST_DIR/$user" -N ""
        fi

        PUB_KEY=$(cat "$TEST_DIR/$user.pub")
        echo -e "$user,$(echo $PUB_KEY | awk -F ' ' '{print $1" "$2}')" >>$REWARDED_KEYS_FULL_PATH
    done

    USER3_SECOND_KEY_NAME="${USER_WITH_DOUBLE_KEY}_second"

    ssh-keygen -t rsa -C "$USER_WITH_DOUBLE_KEY" -f "$TEST_DIR/$USER3_SECOND_KEY_NAME" -N ""

    PUB_KEY=$(cat "$TEST_DIR/$USER3_SECOND_KEY_NAME.pub")
    echo -e "user_3,$(echo $PUB_KEY | awk -F ' ' '{print $1" "$2}')" >>$REWARDED_KEYS_FULL_PATH
}

echo "Initialization..."
init
echo "Initialization is ended."
printf "\nStart tests...\n\n"

for test in "${TESTS[@]}"; do
    print_test_title "$test"

    set +o errexit
    $test
    set -o errexit

    fail_if_error

    echo - ✅ success$'\n'
done

rm -r $TEST_DIR
