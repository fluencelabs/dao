import argparse
from eth_account import Account
from web3 import Web3
from pathlib import Path
import os
import json
from eth_account.messages import encode_defunct
from web3.auto import w3
from merkle import gen_merkle_proof
from merkle import gen_merkle_root

SSH_KEYS_DIR=f"{Path.home()}/.ssh/"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=str)
    args = parser.parse_args()

    object = {}
    with open(args.filename, 'r') as f: 
        object = json.loads(f.read())   

    username = input("Enter your GitHub username: ")

    if (username in object['keys']) == False:
        print("\nError: user not found")
        return

    ethereumAddress = input("Enter your Ethereum address to claim tokens: ")
    if Web3.isAddress(ethereumAddress) == False:
        print("\nError: Invalid Ethereum address")
        return

    files = os.listdir(SSH_KEYS_DIR)
    sshKeys = []
    for f in files:
        if (os.path.isfile(SSH_KEYS_DIR + f) == False or 
            f.endswith(".log") or 
            f.startswith("known_hosts") or 
            f == "config" or 
            f.endswith(".pub")
        ):
            continue
        sshKeys.append(f)

    print("\nWe find your ssh keys:")
    for key in sshKeys:
        print(SSH_KEYS_DIR + key)

    sshKeyPath = input("\nEnter path for ssh key: ")
    if os.path.exists(sshKeyPath) == False:
        print("\nError: file not found")
        return

    output = os.popen(f"echo \"{object['keys'][username]}\" | age --decrypt --identity \"{sshKeyPath}\"").read()
    if output == "":
        print("\nError: invalid ssh key")
        return

    account = w3.eth.account.privateKeyToAccount(output.strip())
    sign = w3.eth.account.sign_message(encode_defunct(hexstr=ethereumAddress), private_key=account.privateKey)

    if account.address.lower() in object['addresses']:
        index = object['addresses'].index(account.address.lower())
        (leaf, merkleProof) = gen_merkle_proof(object['addresses'], index)
        for i in range(len(merkleProof)):
            merkleProof[i] = merkleProof[i].hex()
        res = {
            "userId": index,
            "address": account.address.lower(),
            "signature": sign.signature.hex(),
            "merkleProof": merkleProof
        }
        print(f"\nYour proof: {json.dumps(res)}")
    else:
        print('Error: Address not found')
        return;

main()
