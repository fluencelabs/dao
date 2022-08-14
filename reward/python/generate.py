from array import array
from asyncio import subprocess
import csv
import argparse
from random import randint
from eth_account import Account
import secrets
import json
from merkle import MerkleTree

def read_input_csv(filename):
    usersWithPubKeys = []
    with open(filename, 'r') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for row in reader: 
            usersWithPubKeys.append({ "username": row[0], "pubKey": row[1] })
    return usersWithPubKeys

def gen_and_encrypt_keys(usersWithPubKeys):
    privateKeys = {}
        
    addresses = []
    encryptedKeys = {}
    
    for user in usersWithPubKeys:
        username = user["username"]
        privateKey = privateKeys.get(username)
        if privateKey != None:
            encryptedKeys[username].append("str") #private_key
            continue

        privateKey = "0x" + secrets.token_hex(32)
        addresses.append(Account.from_key(privateKey).address)

        privateKeys[username] = privateKey
        encryptedKeys[username] = []
        encryptedKeys[username].append("str")
        #encryptedKeys[username] = subprocess.run([ "echo", privateKey, "age", "--encrypt", "--recipient", pubKey, "-o", "- --armor"]).read()
        
    return addresses, encryptedKeys

def random_swap_in_list(addresses):
    length = len(addresses)
    count = randint(length, length * 2)
    for _ in range(0, count):
        # gen random index
        aIndex = randint(0, length-1)
        bIndex = randint(0, length-1)

        # swap a and b
        c = addresses[aIndex]
        addresses[aIndex] = addresses[bIndex]
        addresses[bIndex] = c

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=str)
    args = parser.parse_args()
    usersWithPubKeys = read_input_csv(args.filename)
    addresses, encryptedKeys = gen_and_encrypt_keys(usersWithPubKeys)

    random_swap_in_list(addresses)
    
    result = {
        "root": MerkleTree(addresses).get_root(),
        "addresses": addresses,
        "encryptedKeys": encryptedKeys
    }

    with open('output.json', 'w') as f:
        json.dump(result, f, ensure_ascii=False, indent = 4)

if __name__ == '__main__':
    main()