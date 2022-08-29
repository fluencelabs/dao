
import base64
import csv
import argparse
import os
from random import randint
import subprocess
from eth_account import Account
import secrets
import json
from merkle import MerkleTree
from dataclasses import dataclass


@dataclass
class User:
    name: str
    pubKey: str
    
outputDir = "output"
outputFilePath = os.path.join(outputDir, "output.json")
shOutputFilePath = os.path.join(outputDir, "key.bin")

def read_csv(filename):
    users = []
    with open(filename, 'r') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for row in reader: 
            users.append(User(name=row[0], pubKey=row[1]))
    return users

def gen_eth_keys(users):
    addresses = []
    privateKeys = {}
    
    for user in users:
        username = user.name
        privateKey = privateKeys.get(username)
        
        if privateKey != None:
           continue
        
        privateKey = "0x" + secrets.token_hex(32)
        privateKeys[username] = privateKey
        addresses.append(Account.from_key(privateKey).address)
        
    return addresses, privateKeys

def encrypt_data_with_ssh(data, sshPubKey):
    result = subprocess.run(["age", "--encrypt", "--recipient", sshPubKey, "-o", "-", "--armor"], capture_output=True, input=data.encode())
    if result.returncode != 0:
        raise Exception(result.stderr)
    return result.stdout.decode()

def random_sort(addresses):
    length = len(addresses)
    count = randint(length, length * 2)
    for _ in range(0, count):
        # gen random index
        aIndex = randint(0, length-1)
        bIndex = randint(0, length-1)

        # swap a and b using c
        c = addresses[aIndex]
        addresses[aIndex] = addresses[bIndex]
        addresses[bIndex] = c

def encrypt_for_standart_output(users, privateKeys):
    encryptedKeys = {}
    for user in users:
        username = user.name
        sshPubKey = user.pubKey
        privateKey = privateKeys[username]
        if not username in encryptedKeys:
            encryptedKeys[username] = []
        
        encryptedKeys[username].append(encrypt_data_with_ssh(privateKey, sshPubKey))
    return encryptedKeys

def encrypt_for_sh_output(tree, users, addresses, privateKeys):
    encryptedKeys = {}
    indexes = {}
    
    for i in range(len(addresses)):
        indexes[addresses[i]] = i  
        
    for user in users:
        username = user.name
        sshPubKey = user.pubKey
        privateKey = privateKeys[username]
        address = Account.from_key(privateKeys[username]).address
        
        if not username in encryptedKeys:
            encryptedKeys[username] = []
        
        proof = base64.b64encode(json.dumps(tree.get_proof(indexes[address])).encode())
        encryptedData = encrypt_data_with_ssh(f"{user},{address},{privateKey},{proof}", sshPubKey)\
            .replace("-----BEGIN AGE ENCRYPTED FILE-----", "")\
            .replace("-----END AGE ENCRYPTED FILE-----", "")

        encryptedKeys[username].append(base64.b64decode(encryptedData).hex())
        
    return encryptedKeys

def write_output(root, addresses, encryptedKeys):
    result = {
        "root": root,
        "addresses": addresses,
        "encryptedKeys": encryptedKeys
    }

    with open(outputFilePath, 'w') as f:
        json.dump(result, f, ensure_ascii=False, indent = 4)

def write_output_for_sh_script(encryptedKeys):
    with open(shOutputFilePath, 'w') as f:
        writer = csv.writer(f, delimiter=",")
        for username in encryptedKeys:
            for key in encryptedKeys[username]:                
                writer.writerow([username, key])

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', '-i', type=str, required=True)
    
    if not os.path.exists(outputDir):
        os.mkdir(outputDir)
        
    args = parser.parse_args()
    
    inputFilePath = args.input
        
    users = read_csv(inputFilePath)
    addresses, privateKeys = gen_eth_keys(users)

    random_sort(addresses)
    tree = MerkleTree(addresses)
    
    write_output(tree.get_root(), addresses, encrypt_for_standart_output(users, privateKeys))
    write_output_for_sh_script(encrypt_for_sh_output(tree, users, addresses, privateKeys))

if __name__ == '__main__':
    main()