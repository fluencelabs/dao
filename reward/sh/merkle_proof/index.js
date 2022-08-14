#!/usr/bin/env node

/*
Commands
- root [KEYS FILE] – returns Merkle Root in hex
- proofs [KEYS FILE] – returns [KEYS WITH PROOF FILE]

Legend
    [KEYS FILE] is:
        Absolute path to a CSV file. Expected format is:
            userId,tmp_eth_addr,rest...
            userId,tmp_eth_addr,rest...
            userId,tmp_eth_addr,rest...

    [KEYS WITH PROOF FILE] is:
        Absolute path to a file CSV file with all fields preserved and Merkle Proofs added. Example:
            userId,tmp_eth_addr,merkle_proof,rest...
            userId,tmp_eth_addr,merkle_proof,rest...
            userId,tmp_eth_addr,merkle_proof,rest...

*/

/*
Usage scenario
    This program (PROOFGEN) is expected to be used inside generate.sh (referred to as SCRIPT).

    SCRIPT will generate [KEYS FILE] and call `PROOFGEN root` to calculate Merkle Root and pass it to DevRewardDistributor.sol.
    SCRIPT will call `PROOFGEN proofs` to calculate [KEYS WITH PROOF FILE], randomly assign a line to a GitHub user, and encrypt 'userId,tmp_eth_addr,tmp_eth_key,merkle_proof' for each GH user's SSH key.
*/

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const ethers = require('ethers');
const { readFileSync, existsSync, writeFileSync, rmSync } = require('fs');
const { resolve } = require('path');

/**
 *
 * @param {[{ userId: number, address: string, rest: []string }]} parsedKeys
 * @param {MerkleTree} merkleTree
 * @returns {[{ userId: number, address: string, merkle_proof: string, rest: []string }]}
 */
function generateProofs(parsedKeys, merkleTree) {
    return parsedKeys.map(k => {
        let leaf = hashedLeaf(k.userId, k.address);
        let proof = merkleTree.getHexProof(leaf);
        let json = JSON.stringify(proof);
        let buffer = Buffer.from(json);
        let base64 = buffer.toString('base64');
        return { userId: k.userId, address: k.address, merkle_proof: base64, rest: k.rest };
    });
}

/**
 *
 * @param {string} path
 * @returns {[{ userId: number, address: string, rest: []string }]}
 */
function parseKeysFile(path) {
    let absPath = resolve(path);

    if (!existsSync(absPath)) {
        console.error(`File ${absPath} doesn't exist`);
        process.exit(1);
    }

    let bytes = readFileSync(absPath);
    let contents = bytes.toString();
    let lines = contents.split('\n');
    let csv = lines.filter(l => l.length > 0).map(l => {
        let split = l.split(",");
        if (split.length < 2) {
            console.error(`Invalid format in ${absPath}. Expected at least fields: 'user_id,tmp_eth_addr' got ${split.length} fields`);
            process.exit(1);
        }
        let [uid, address, ...rest] = split;
        let userId = parseInt(uid);
        return { userId, address, rest };
    });

    return csv;
}

/**
 * @param {{ userId: number, address: string }} addresses
 * @returns { MerkleTree }
 */
function generateMerkleTree(addresses) {
    let hashed = addresses.map((e) => hashedLeaf(e.userId, e.address));

    // sortPairs: true because https://github.com/OpenZeppelin/workshops/blob/master/06-nft-merkle-drop/test/4-ERC721MerkleDrop.test.js#L20
    let tree = new MerkleTree(hashed, keccak256, { hashLeaves: false, sortPairs: true });

    return tree
}

/**
 *
 * @param {number} userId
 * @param {string} address
 * @returns {Buffer}
 */
function hashedLeaf(userId, address) {
    let leafData = ethers.utils.defaultAbiCoder.encode(["uint32", "address"], [userId, address]);
    let leaf = keccak256(leafData);

    return leaf;
}

function write(path, contents) {
    let output = resolve(path);
    if (existsSync(output)) {
        console.debug(`Removing ${output}`);
        rmSync(output);
    }
    writeFileSync(output, contents);
}

require('yargs')
    .scriptName("proofgen")
    .demandCommand()
    .strict()
    .usage('$0 <cmd> [args]')
    .global('KEYS')
    .positional(
        'KEYS',
        {
            type: 'string',
            demandOption: true,
            describe: 'Path to the CSV keys file'
        }
    )
    .middleware(argv => {
        argv.parsedKeys = parseKeysFile(resolve(argv.KEYS));
        argv.merkleTree = generateMerkleTree(argv.parsedKeys);
    })
    .command(
        'merkle_root KEYS',
        'compute Merkle Root, in hex',
        yargs => yargs,
        function (argv) {
            console.log(argv.merkleTree.getHexRoot());
        }
    )
    .command(
        'merkle_tree KEYS OUTPUT',
        'compute Merkle Proofs, write to file',
        yargs => yargs.positional('OUTPUT', { type: 'string', demandOption: true, describe: 'Where to write merkle tree' }),
        function (argv) {
            let layers = argv.merkleTree.getHexLayers();
            let output = resolve(argv.OUTPUT);
            write(output, JSON.stringify(layers));
        }
    )
    .command(
        'merkle_proofs KEYS OUTPUT',
        'compute Merkle Tree, return as ',
        yargs => yargs.positional('OUTPUT', { type: 'string', demandOption: true, describe: 'Where to write keys with proofs' }),
        function (argv) {
            let proofs = generateProofs(argv.parsedKeys, argv.merkleTree);
            let csv = proofs.map(p => [p.userId, p.address, p.merkle_proof, ...p.rest].join(',')).join('\n');
            let output = resolve(argv.OUTPUT);
            write(output, csv);
        }
    )
    .help()
    .parse();
