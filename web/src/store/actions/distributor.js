import { governanceContracts } from "../../constants";
import {
  FETCH_CURRENT_AWARD,
  FETCH_MERKLE_ROOT,
  FETCH_NEXT_HALVE_PERIOD,
} from "./types";
import abis from "../../contracts";
import { ethers } from "ethers";

export const setMerkleRoot = (merkleRoot) => ({
  type: FETCH_MERKLE_ROOT,
  payload: merkleRoot,
});

export const fetchMerkleRoot = (network, provider) => {
  console.log(network);
  console.log(governanceContracts);
  console.log(governanceContracts[network].devRewardDistributor);
  const contract = new ethers.Contract(
    governanceContracts[network].devRewardDistributor,
    abis.DevRewardDistributor.abi,
    provider
  );

  return async (dispatch) => {
    try {
      const merkleRoot = await contract.functions.merkleRoot();
      console.log("merkleRoot: " + merkleRoot);
      dispatch(setMerkleRoot(merkleRoot));
    } catch (error) {
      console.log(error);
    }
  };
};

export const setCurrentAward = (award) => ({
  type: FETCH_CURRENT_AWARD,
  payload: award,
});

export const fetchCurrentAward = (network, provider) => {
  const contract = new ethers.Contract(
    governanceContracts[network].devRewardDistributor,
    abis.DevRewardDistributor.abi,
    provider
  );

  return async (dispatch) => {
    try {
      const award = await contract.functions.currentReward();
      const formattedAward = ethers.utils.formatUnits(award.toString(), "ether");
      dispatch(setCurrentAward(award === 0n ? "0" : formattedAward));
    } catch (error) {
      console.log(error);
    }
  };
};

export const setNextHalvePeriod = (period) => ({
  type: FETCH_NEXT_HALVE_PERIOD,
  payload: period,
});

export const fetchNextHalvePeriod = (network, provider) => {
  const contract = new ethers.Contract(
    governanceContracts[network].devRewardDistributor,
    abis.DevRewardDistributor.abi,
    provider
  );

  return async (dispatch) => {
    try {
      const halvePeriod =
        Number(await contract.functions.halvePeriod()) * 1000;
      const deployTime =
        Number(await contract.functions.deployTime()) * 1000;

      console.log("halvePeriod: " + halvePeriod);
      console.log("deployTime: " + deployTime);
      const n = Math.floor((Date.now() - deployTime) / halvePeriod);
      console.log("n: " + n);
      const nextHalvePeriod = deployTime + (n + 1) * halvePeriod;
      console.log("nextHalvePeriod: " + nextHalvePeriod);
      dispatch(setNextHalvePeriod(nextHalvePeriod));
    } catch (error) {
      console.log(error);
    }
  };
};
