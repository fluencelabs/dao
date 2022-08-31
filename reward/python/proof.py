import argparse
import base64
import json
import os
import subprocess
from web3 import Web3
from pathlib import Path
from eth_account.messages import encode_defunct
from web3.auto import w3
from common import Metadata
from merkle import MerkleTree

SSH_KEYS_DIR=os.path.join(Path.home(), ".ssh")

def parse_metadata(filename):
    with open(filename, 'r') as f: 
        return Metadata.from_json(f.read())

def ask_user_info(metadata): 
    username = input("Enter your GitHub username: ")
    if not username in metadata.encryptedKeys:
        raise Exception("User not found")

    ethereumAddress = input("Enter your Ethereum address to claim tokens: ")
    if not Web3.isAddress(ethereumAddress):
        raise Exception("Invalid Ethereum address")

    return (username, ethereumAddress)

def choose_ssh_key():
    files = os.listdir(SSH_KEYS_DIR)
    sshKeys = []
    for f in files:
        path = os.path.join(SSH_KEYS_DIR, f)
        if not is_ssh_key(path):
            continue
        sshKeys.append(path)

    if len(sshKeys) > 0:
        print(f"\nYour ssh keys:")
        for key in sshKeys:
            print(key)

    sshKeyPath = input("\nEnter path for ssh key: ")
    pubKeyPath = sshKeyPath + ".pub"
    
    if not os.path.exists(sshKeyPath):
        raise Exception("File is not exist")
    elif not is_ssh_key(sshKeyPath):
        raise Exception("File is not ssh key")
    elif not os.path.isfile(pubKeyPath) or not os.path.exists(pubKeyPath):
        raise Exception(f"Pubkey ({pubKeyPath}) is not exist")
    
    pubKey = ""
    with open(pubKeyPath, 'r') as pubKeyFile: 
        pubKey = " ".join(pubKeyFile.read().split(" ")[0:2])

    return pubKey, sshKeyPath

def is_ssh_key(path):
    if not os.path.isfile(path):
        return False
    
    with open(path, 'r') as file: 
        return file.read().startswith("-----BEGIN OPENSSH PRIVATE KEY-----")

def decrypt_temp_eth_account(sshPubKey, sshPrivKey, username, metadata):
    if not sshPubKey in metadata.encryptedKeys[username]:
        raise Exception("Pubkey not found in metadata")
    
    data = metadata.encryptedKeys[username][sshPubKey]
    result = subprocess.run(["age", "--decrypt", "--identity", sshPrivKey], capture_output=True, input=data.encode())
    if result.returncode != 0:
        raise Exception(result.stderr)
    
    return w3.eth.account.privateKeyToAccount(result.stdout.decode())

def get_merkle_proof(metadata, tempETHAccount):
    address = tempETHAccount.address.lower()
    if not address in metadata.addresses:
        raise Exception("Invalid temp address. Please contact with team.")

    tree = MerkleTree(metadata.addresses)
    index = metadata.addresses.index(address)
    return index, tree.get_proof(index)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('metadataPath', type=str)
    args = parser.parse_args()
    metadataPath = args.metadataPath
    
    metadata = parse_metadata(metadataPath)
    username, receiverAddress = ask_user_info(metadata)
    sshPubKey, sshKeyPath = choose_ssh_key()
    tempETHAccount = decrypt_temp_eth_account(sshPubKey, sshKeyPath, username, metadata)
    index, merkleProof = get_merkle_proof(metadata, tempETHAccount)
    base64MerkleProof = base64.b64encode(json.dumps(merkleProof).encode()).decode();
    
    sign = tempETHAccount.sign_message(encode_defunct(hexstr=receiverAddress))
    
    print("Success! Copy the line below and paste it in the browser.")
    print(f"{index},{tempETHAccount.address.lower()},{sign.signature.hex()},{base64MerkleProof}")

if __name__ == '__main__':
    main()