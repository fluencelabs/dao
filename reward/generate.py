#!/usr/bin/env python

import base64
import csv
import argparse
import dataclasses
import os
import subprocess
import secrets
import json
from turtle import st
from helpers.merkle import MerkleTree
from eth_account import Account
from random import randint
from helpers.common import Metadata
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization as crypto_serialization

DEFAULT_OUTPUT_DIR = "output"


@dataclasses.dataclass
class User:
    name: str
    pubKey: str


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
        addresses.append(Account.from_key(privateKey).address.lower())

    return addresses, privateKeys


def encrypt_data_with_ssh(data, sshPubKey):
    result = subprocess.run(["age", "--encrypt", "--recipient", sshPubKey,
                            "-o", "-", "--armor"], capture_output=True, input=data.encode())
    if result.returncode != 0:
        raise OSError(result.stderr)
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
    encryptedKeys: dict[str, dict[str, str]] = {}
    for user in users:
        username = user.name
        sshPubKey = user.pubKey
        privateKey = privateKeys[username]
        if not username in encryptedKeys:
            encryptedKeys[username] = {}

        encryptedKeys[username][sshPubKey] = encrypt_data_with_ssh(
            privateKey, sshPubKey
        )
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
        address = Account.from_key(privateKeys[username]).address.lower()

        if not username in encryptedKeys:
            encryptedKeys[username] = []

        index = indexes[address]

        proof = base64.b64encode(json.dumps(
            tree.get_proof(index)).encode()
        ).decode()

        key = ec.derive_private_key(int(privateKey, base=16), ec.SECP256K1())
        openSSLPrivKey = "0x" + key.private_bytes(
            crypto_serialization.Encoding.DER,
            crypto_serialization.PrivateFormat.TraditionalOpenSSL,
            crypto_serialization.NoEncryption()
        ).hex()

        encryptedData = encrypt_data_with_ssh(
            f"{index},{address},{openSSLPrivKey},{proof}", sshPubKey)\
            .replace("-----BEGIN AGE ENCRYPTED FILE-----", "")\
            .replace("-----END AGE ENCRYPTED FILE-----", "")

        encryptedKeys[username].append(base64.b64decode(encryptedData).hex())

    return encryptedKeys


def write_output(filePath, root, addresses, encryptedKeys):
    metadata = Metadata(root=root, addresses=addresses,
                        encryptedKeys=encryptedKeys)
    with open(filePath, 'w') as f:
        json.dump(metadata.to_dict(), f, ensure_ascii=False, indent=4)


def write_output_for_sh_script(filePath, encryptedKeys):
    with open(filePath, 'w') as f:
        writer = csv.writer(f, delimiter=",")
        for username in encryptedKeys:
            for key in encryptedKeys[username]:
                writer.writerow([username, key])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input', type=str)
    parser.add_argument('-o', '--output', type=str, default=DEFAULT_OUTPUT_DIR)

    args = parser.parse_args()
    inputFilePath = args.input
    outputFilePath = args.output

    metadataFilePath = os.path.join(outputFilePath, "metadata.json")
    shOutputFILEPath = os.path.join(outputFilePath, "metadata.bin")

    if not os.path.exists(outputFilePath):
        os.mkdir(outputFilePath)

    users = read_csv(inputFilePath)
    addresses, privateKeys = gen_eth_keys(users)

    random_sort(addresses)
    tree = MerkleTree(addresses)

    write_output(metadataFilePath, tree.get_root(), addresses,
                 encrypt_for_standart_output(users, privateKeys))
    write_output_for_sh_script(shOutputFILEPath, encrypt_for_sh_output(
        tree, users, addresses, privateKeys))


if __name__ == '__main__':
    main()
