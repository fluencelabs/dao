#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

## This script generates a k/v database of GitHub username to encrypted Ethereum accounts
## The database will be used by rewarded users to generate Fluence Token Reward proofs, see award.sh

## Data format is simple. Two colums: string and base64-string.
## GH-username,Encrypted(key, userId)

# 'age' is the tool that does all the encryption heavy lifting for us
command -v age >/dev/null 2>&1 || {
    echo >&2 "age is not installed. Please install it from https://github.com/FiloSottile/age#installation" 
    exit 1 
}

# this file must contain list of GH username and their public SSH keys
AWARDED_USERS="$(pwd)/awarded"





# temporary key, immediately dropped
temp_sk, temp_pk = gen_key()

# user's key that she should use to claim tokens
new_sk, new_pk = gen_key()

encrypted_new_sk = encrypt(ssh_pk, temp_sk, data = new_sk)

merkle_tree.add(new_pk)
echo $encrypted_new_sk >> keys.bin