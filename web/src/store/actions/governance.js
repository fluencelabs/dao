import { Contract } from "@ethersproject/contracts";
import abis from "../../contracts";
import { FAIL, governanceContracts, MINED, MINING, REJECTED } from "../../constants";

import { CLAIM_STATUS, DELEGATE_STATUS, SET_CLAIM_STATUS, SET_DELEGATEE, SET_ERROR, STORE_PROOF } from "./types";
import supportedChains from "../../constants/chains";

export const delegateStatus = (status) => ({
  type: DELEGATE_STATUS,
  payload: status,
});

export const claimStatus = (status) => ({
  type: CLAIM_STATUS,
  payload: status,
});

export const setDelegatee = (address) => ({
  type: SET_DELEGATEE,
  payload: address,
});

export const setError = (message) => {
  console.error(message);
  let msg;
  try {
    const isEthJs = /ethjs-query/.test(message);
    const parsedMessage = isEthJs
      ? JSON.parse(
          message
            .replace("[ethjs-query] while formatting outputs from RPC '", "")
            .slice(0, -1),
        )
      : message;

    const newMessage = isEthJs
      ? `${parsedMessage.value.data.message}. Error code: ${parsedMessage.value.code}`
      : message;

    msg = newMessage;
  } catch (error) {
    msg = message;
  }
  return {
    type: SET_ERROR,
    payload: msg,
  };
};

const WRONG_CHAIN_MESSAGE = `Looks like the contract does not support the current network. Please switch to ${supportedChains[0].name}`;

export const claim = (
  userId,
  merkleProof,
  tmpEthAddr,
  senderSignatureHex,
  w3provider,
  network,
) => {
  return async (dispatch) => {
    let signer = w3provider.getSigner();
    try {
      let contract = new Contract(
        governanceContracts[network].devRewardDistributor,
        abis.DevRewardDistributor.abi,
        w3provider,
      );
      let signed = await contract.connect(signer);
      try {
        console.log("claiming with", {
          userId,
          merkleProof,
          tmpEthAddr,
          senderSignatureHex,
        });
        const tx = await signed.claimTokens(
          userId,
          merkleProof,
          tmpEthAddr,
          senderSignatureHex,
        );
        dispatch(claimStatus(MINING));
        try {
          await tx.wait();
          dispatch(claimStatus(MINED));
        } catch (error) {
          dispatch(claimStatus(FAIL));
          dispatch(setError(error.message));
        }
      } catch (error) {
        dispatch(claimStatus(REJECTED));
        dispatch(setError(error?.data?.message || error.message));
      }
    } catch (error) {
      dispatch(setError(WRONG_CHAIN_MESSAGE));
    }
  };
};

export const setHasClaimed = (hasClaimed) => ({
  type: SET_CLAIM_STATUS,
  payload: {
    checked: true,
    claimed: hasClaimed,
  },
});

export const checkHasClaimed = (userId, w3provider, network) => {
  return async (dispatch) => {
    let signer = w3provider.getSigner();
    try {
      let contract = new Contract(
        governanceContracts[network].devRewardDistributor,
        abis.DevRewardDistributor.abi,
        w3provider,
      );
      let signed = await contract.connect(signer);
      try {
        const hasClaimed = await signed.isClaimed(userId);
        console.log(
          `isClaimed for ${userId} is ${hasClaimed}. Contract is ${governanceContracts[network].devRewardDistributor}`,
        );
        dispatch(setHasClaimed(hasClaimed));
      } catch (error) {
        dispatch(setError("Cannot confirm that tokens are not claimed yet."));
        console.error(error);
      }
    } catch (error) {
      dispatch(setError(WRONG_CHAIN_MESSAGE));
    }
  };
};

export const storeProof = (proof) => ({
  type: STORE_PROOF,
  payload: proof,
});
