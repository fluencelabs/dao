import { ethers } from "ethers";
import keccak256 from "keccak256";

/**
 *
 * @param {number} userId
 * @param {string} address
 * @returns {Buffer}
 */
export async function hashedLeaf(userId, address) {
  const hexUserId = ethers.utils.hexZeroPad(
    "0x" + Number(userId).toString(16),
    4
  );
  console.log("hexUserId", hexUserId);

  let leafData = hexUserId.concat(address.replace("0x", ""));

  console.log("leafData", leafData);

  let leaf = keccak256(leafData);
  console.log("leaf", ethers.utils.keccak256(leafData));

  return leaf;
}
