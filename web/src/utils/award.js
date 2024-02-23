import { ethers } from "ethers";
import keccak256 from "keccak256";

/**
 *
 * @param {number} userId
 * @param {string} address
 * @returns {Buffer}
 */
export async function hashedLeaf(userId, address) {
  let leafData = await ethers.utils.defaultAbiCoder.encode(
    ["uint32", "address"],
    [userId, address],
  );
  let leaf = keccak256(leafData);

  return leaf;
}
