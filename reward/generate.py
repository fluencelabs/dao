import csv
import argparse
from eth_account import Account
from web3 import Web3
import secrets
import os
import json
from merkle import gen_merkle_root

def generate_account(): 
    priv = secrets.token_hex(32)
    private_key = "0x" + priv
    acct = Account.from_key(private_key)
    return (acct.address, private_key)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('filename', type=str)
    args = parser.parse_args()
    keysResult = {}
    addresses = []
    with open(args.filename, 'r') as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        for row in reader:
            if len(row) != 2:
                continue
            
            address, private_key = generate_account()
            addresses.append(address.lower())
            output = os.popen(f"echo \"{private_key}\" | age --encrypt --recipient \"{row[1]}\" -o - --armor").read()
            keysResult[row[0]] = output
            
    addresses.sort()
    result = {
        "root": gen_merkle_root(addresses),
        "addresses": addresses,
        "keys": keysResult
    }

    with open('output.json', 'w') as f:
        json.dump(result, f, ensure_ascii=False, indent = 4)

main()
