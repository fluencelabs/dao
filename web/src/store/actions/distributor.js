import { governanceContracts } from "../../constants";
import { infuraUrlFactory } from "../../utils";
import {
  FETCH_MERKLE_ROOT,
  FETCH_CURRENT_AWARD,
  FETCH_NEXT_HALVE_PERIOD,
} from "./types";
import Web3 from "web3";
import abis from "../../contracts";

export const setMerkleRoot = (merkleRoot) => ({
  type: FETCH_MERKLE_ROOT,
  payload: merkleRoot,
});

export const fetchMerkleRoot = (network) => {
  const web3 = new Web3(infuraUrlFactory(network));
  console.log("fetching merkle root from", web3);
  console.log(network);
  console.log(governanceContracts);
  console.log(governanceContracts[network].devRewardDistributor);
  const contract = new web3.eth.Contract(
    abis.DevRewardDistributor.abi,
    governanceContracts[network].devRewardDistributor
  );

  return async (dispatch) => {
    try {
      const merkleRoot = await contract.methods.merkleRoot().call();
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

export const fetchCurrentAward = (network) => {
  const web3 = new Web3(infuraUrlFactory(network));
  const contract = new web3.eth.Contract(
    abis.DevRewardDistributor.abi,
    governanceContracts[network].devRewardDistributor
  );

  return async (dispatch) => {
    try {
      const award = await contract.methods.currentReward().call();
      const formattedAward = web3.utils.fromWei(award, 'ether');
      dispatch(setCurrentAward(formattedAward));
    } catch (error) {
      console.log(error);
    }
  };
};

export const setNextHalvePeriod = (period) => ({
  type: FETCH_NEXT_HALVE_PERIOD,
  payload: period,
});

export const fetchNextHalvePeriod = (network) => {
  const web3 = new Web3(infuraUrlFactory(network));
  const contract = new web3.eth.Contract(
    abis.DevRewardDistributor.abi,
    governanceContracts[network].devRewardDistributor
  );

  return async (dispatch) => {
    try {
      const period = await contract.methods.halvePeriod().call();
      dispatch(setNextHalvePeriod(Number(period * 1000n)));
    } catch (error) {
      console.log(error);
    }
  };
};
