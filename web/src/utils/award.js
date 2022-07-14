import { ethers } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

export async function generateSigner() {
  let wallet = await ethers.Wallet.createRandom();

  return wallet;
}

export async function signWithSigner(signer, leaf) {
  if (!ethers.utils.isBytesLike(leaf) || ethers.utils.hexDataLength(leaf) !== 32) {
    throw 'ERROR: leaf must be a bytes32 value. Length was ' + ethers.utils.hexDataLength(leaf);
  }

  let signature = await signer.signMessage(leaf);

  return signature;
}

/**
 * @param {[string]} addresses 
 * @returns {{
 *  enumerated: [{ userId: number, address: string }], 
 *  tree: MerkleTree,
 *  userIds: { [string]: number }
 * }}
 */
export async function generateMerkleTree(addresses) {
  // shuffle to make sure we don't accidentaly reveal GitHub usernames via userId enumeration
  let shuffled = addresses
    .map(address => ({ address, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort);
  
  let enumerated = shuffled
    .map((e, userId) => ({ userId, address: e.address }));
  
  let hashed = await Promise.all(enumerated
    .map(async (e) => await hashedLeaf(e.userId, e.address)));

  // TODO: why sortPairs: true? https://github.com/OpenZeppelin/workshops/blob/master/06-nft-merkle-drop/test/4-ERC721MerkleDrop.test.js#L20
  let tree = new MerkleTree(hashed, keccak256, { hashLeaves: false, sortPairs: true });

  let userIds = enumerated.reduce((acc, next) => acc.set(next.address, next.userId), new Map());

  return ({ enumerated, tree, userIds })
}

/**
 * 
 * @param {number} userId 
 * @param {string} address 
 * @returns {Buffer}
 */
export async function hashedLeaf(userId, address) {
  let leafData = await ethers.utils.defaultAbiCoder.encode(["uint32", "address"], [userId, address]);
  let leaf = keccak256(leafData);

  return leaf;
}