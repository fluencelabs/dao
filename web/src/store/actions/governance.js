import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import abis from "../../contracts";
import { governanceContracts } from "../../constants";

import {
    DELEGATE_STATUS,
    SET_DELEGATEE,
    SET_PROPOSAL_COUNT,
    SET_ERROR,
    CLAIM_STATUS,
    SET_ALEGIBILITY,
    SET_LOCAL_PROOF,
    SET_OWNERSHIP,
    SET_CLAIM_STATUS,
    STORE_DELEGATEE,
    STORE_PROOF
} from "./types"

import {
    FAIL,
    MINED,
    MINING,
    PENDING,
    REJECTED
} from '../../constants'
import supportedChains from "../../constants/chains";

export const setLocalProof = (proof) => ({
    type: SET_LOCAL_PROOF,
    payload: proof
})

export const delegateStatus = (status) => ({
    type: DELEGATE_STATUS,
    payload: status
})

export const claimStatus = (status) => ({
    type: CLAIM_STATUS,
    payload: status
})

export const setDelegatee = (address) => ({
    type: SET_DELEGATEE,
    payload: address
})

export const setError = (message) => {
    let msg
    try {
        const isEthJs = /ethjs-query/.test(message)
        const parsedMessage = isEthJs
            ? JSON.parse(
                message
                    .replace("[ethjs-query] while formatting outputs from RPC '", '')
                    .slice(0, -1)
            )
            : message
        console.log(parsedMessage)

        const newMessage = isEthJs
            ? `${parsedMessage.value.data.message}. Error code: ${parsedMessage.value.code}`
            : message

        msg = newMessage
    } catch (error) {
        msg = message
    }
    return {
        type: SET_ERROR,
        payload: msg
    }
}

const WRONG_CHAIN_MESSAGE = `Looks like the contract does not support the current network. Please switch to ${supportedChains[0].name}`

export const claim = (
    userId,
    merkleProof,
    tmpEthAddr,
    senderSignatureHex,
    w3provider,
    network
) => {
    return async dispatch => {
        let signer = w3provider.getSigner();
        try {
            let contract = new Contract(governanceContracts[network].devRewardDistributor, abis.DevRewardDistributor.abi, w3provider);
            let signed = await contract.connect(signer);
            try {
                console.log("claiming with", { userId, merkleProof, tmpEthAddr, senderSignatureHex })
                const tx = await signed.claimTokens(
                    userId,
                    merkleProof,
                    tmpEthAddr,
                    senderSignatureHex
                );
                dispatch(claimStatus(MINING))
                try {
                    await tx.wait()
                    dispatch(claimStatus(MINED))
                } catch (error) {
                    dispatch(claimStatus(FAIL))
                    dispatch(setError(error.message))
                }
            } catch (error) {
                dispatch(claimStatus(REJECTED))
                dispatch(setError(error?.data?.message || error.message))
            }
        } catch (error) {
            dispatch(setError(WRONG_CHAIN_MESSAGE))
        }
    }
}

export const setAlegibility = (alegible) => ({
    type: SET_ALEGIBILITY,
    payload: {
        isAlegible: alegible,
        checked: true
    }
})

export const setHasClaimed = (hasClaimed) => ({
    type: SET_CLAIM_STATUS,
    payload: {
        checked: true,
        claimed: hasClaimed
    }
})

export const checkHasClaimed = (userId, w3provider, network) => {
    return async dispatch => {
        let signer = w3provider.getSigner();
        try {
            let contract = new Contract(governanceContracts[network].devRewardDistributor, abis.DevRewardDistributor.abi, w3provider);
            let signed = await contract.connect(signer);
            try {
                const hasClaimed = await signed.isClaimed(userId);
                console.log(`isClaimed for ${userId} is ${hasClaimed}. Contract is ${governanceContracts[network].devRewardDistributor}`);
                dispatch(setHasClaimed(hasClaimed))
            } catch (error) {
                dispatch(setError('Cannot confirm that tokens are not claimed yet.'))
                console.error(error);
            }
        } catch (error) {
            dispatch(setError(WRONG_CHAIN_MESSAGE))
        }
    }
}

export const storeProof = (proof) => ({
    type: STORE_PROOF,
    payload: proof
})

export const setGithubOwnership = (owner) => ({
    type: SET_OWNERSHIP,
    payload: {
        isOwner: owner,
        checked: true
    }
})

export const storeDelegatee = (delegatee) => ({
    type: STORE_DELEGATEE,
    payload: delegatee
})

export const delegate = (w3provider, delegatee, network) => {
    return async dispatch => {
        dispatch(delegateStatus(PENDING))
        let signer = w3provider.getSigner();
        let contract = new Contract(governanceContracts[network].token, abis.Comp.abi, w3provider);
        let signed = await contract.connect(signer);
        try {
            const tx = await signed.delegate(delegatee);
            dispatch(delegateStatus(MINING))
            try {
                await tx.wait()
                dispatch(delegateStatus(MINED))
                dispatch(setDelegatee(delegatee))
            } catch (error) {
                dispatch(delegateStatus(FAIL))
                dispatch(setError(error.message))
            }
        } catch (error) {
            dispatch(delegateStatus(REJECTED))
            dispatch(setError(error.message))
        }
    }
}

export const setProposalCount = (count) => ({
    type: SET_PROPOSAL_COUNT,
    payload: count
})

export const getProposalCount = (w3provider, network) => {
    return async dispatch => {
        try {
            let contract = new Contract(governanceContracts[network].alpha, abis.GovernorAlpha.abi, w3provider);
            try {
                const count = await contract.proposalCount();
                dispatch(setProposalCount(count.toNumber()))
            } catch (error) {
                dispatch(setProposalCount(0))
                dispatch(setError(error.message))
            }
        } catch (error) {
            dispatch(setError(WRONG_CHAIN_MESSAGE))
        }
    }
}

/*
 *
 *  DAO token contract functions
 *
 */

export const daoTokenBalanceOf = (w3provider, account, network) => {
    return async dispatch => {
        let contract = new Contract(governanceContracts[network].token, abis.Comp.abi, w3provider);
        let balance;
        try {
            let fetchedBalance = await contract.balanceOf(account);
            let decimals = BigNumber.from("1000000000000000000");
            balance = fetchedBalance.div(decimals).toNumber();
        } catch (error) {
            balance = error.message;
        }
        return balance;
    }
}