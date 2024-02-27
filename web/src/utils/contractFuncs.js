import { Contract } from "@ethersproject/contracts";
import abis from "../contracts";
import { governanceContracts } from "../constants";
import { catchError } from "../utils";

const SUCCESS_MSG = "Success! Please wait for transaction confirmation.";

export async function delegates(w3provider, address, network) {
  let contract = new Contract(
    governanceContracts[network].token,
    abis.Comp.abi,
    w3provider,
  );
  let delegates;
  try {
    delegates = await contract.delegates(address);
  } catch (error) {
    delegates = error.message;
  }
  return delegates;
}

/*
 *
 *  Governor contract functions
 *
 */

export async function propose(
  w3provider,
  targets,
  values,
  signatures,
  calldatas,
  description,
  network,
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(
    governanceContracts[network].alpha,
    abis.GovernorAlpha.abi,
    w3provider,
  );
  let signed = await contract.connect(signer);
  let proposal;
  try {
    if (targets && targets.length > 1) {
      console.log("propose calling proposeMultiAttribute with", {
        targets,
        values,
        signatures,
        calldatas,
        description,
      });
      await signed.proposeMultiAttribute(
        targets,
        values,
        signatures,
        calldatas,
        description,
      );
    } else {
      console.log("propose calling propose with", {
        targets,
        values,
        signatures,
        calldatas,
        description,
      });
      await signed.propose(
        targets,
        values,
        signatures,
        calldatas,
        description,
        network,
      );
    }
    proposal = SUCCESS_MSG;
  } catch (error) {
    console.error(error);
    let err = catchError(error);
    proposal = err + " Is your delegatee set?";
  }
  return proposal;
}

export async function getReceipt(w3provider, proposalId, voter, network) {
  let contract = new Contract(
    governanceContracts[network].alpha,
    abis.GovernorAlpha.abi,
    w3provider,
  );
  let receipt;
  try {
    receipt = await contract.getReceipt(proposalId, voter);
  } catch (error) {
    receipt = catchError(error);
  }
  return receipt;
}

export async function getActions(w3provider, proposalId, network) {
  let contract = new Contract(
    governanceContracts[network].alpha,
    abis.GovernorAlpha.abi,
    w3provider,
  );
  let actions;
  try {
    actions = await contract.getActions(proposalId);
  } catch (error) {
    actions = catchError(error);
  }
  return actions;
}

export async function castVote(
  w3provider,
  proposalId,
  support,
  votes,
  network,
) {
  let signer = w3provider.getSigner();
  let contract = new Contract(
    governanceContracts[network].alpha,
    abis.GovernorAlpha.abi,
    w3provider,
  );
  let signed = await contract.connect(signer);
  let castVote;
  try {
    await signed.castVote(proposalId, support, votes);
    castVote = SUCCESS_MSG;
  } catch (error) {
    castVote = catchError(error);
  }
  return castVote;
}

export async function queue(w3provider, proposalId, network) {
  let signer = w3provider.getSigner();
  let contract = new Contract(
    governanceContracts[network].alpha,
    abis.GovernorAlpha.abi,
    w3provider,
  );
  let signed = await contract.connect(signer);
  let queue;
  try {
    await signed.queue(proposalId);
    queue = SUCCESS_MSG;
  } catch (error) {
    queue = catchError(error);
  }
  return queue;
}

export async function execute(w3provider, proposalId, network) {
  let signer = w3provider.getSigner();
  let contract = new Contract(
    governanceContracts[network].alpha,
    abis.GovernorAlpha.abi,
    w3provider,
  );
  let signed = await contract.connect(signer);
  let execute;
  try {
    await signed.execute(proposalId);
    execute = SUCCESS_MSG;
  } catch (error) {
    execute = catchError(error);
  }
  return execute;
}

export async function cancel(w3provider, proposalId, network) {
  let signer = w3provider.getSigner();
  let contract = new Contract(
    governanceContracts[network].alpha,
    abis.GovernorAlpha.abi,
    w3provider,
  );
  let signed = await contract.connect(signer);
  let cancel;
  try {
    await signed.cancel(proposalId);
    cancel = SUCCESS_MSG;
  } catch (error) {
    cancel = catchError(error);
  }
  return cancel;
}

export async function refund(w3provider, proposalId, network) {
  let signer = w3provider.getSigner();
  let contract = new Contract(
    governanceContracts[network].alpha,
    abis.GovernorAlpha.abi,
    w3provider,
  );
  let signed = await contract.connect(signer);
  let refund;
  try {
    await signed.refund(proposalId);
    refund = SUCCESS_MSG;
  } catch (error) {
    refund = catchError(error);
  }
  return refund;
}
