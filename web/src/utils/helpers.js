
import { AbiCoder } from "@ethersproject/abi";

export const EXTRACT_ERROR_MESSAGE = /(?<="message":")(.*?)(?=")/g;

export const isTransactionMined = async(w3provider, transactionHash) => {
    const txReceipt = await w3provider.getTransactionReceipt(transactionHash);
    if (txReceipt && txReceipt.blockNumber) {
        return txReceipt;
    }
  }
  
export function catchError(error, isMessage = false) {
    const message = isMessage ? error : error.message
  
    // try to extract error message, otherwise return raw error
    let formatted_error;
  
    if (message.startsWith("invalid ENS name")) {
      formatted_error = "Missing or invalid parameter.";
    } else if(message.startsWith("JsonRpcEngine")) {
      formatted_error = "Cannot connect to the blockchain."
    } else if (message.startsWith("invalid BigNumber string")) {
      formatted_error = "Invalid number parameter."
    } else {
      formatted_error = message;
    }
  
    return formatted_error;
}
  
  // Helper function to prevent ambiguous failure message when dates aren't passed
export function convertToZeroIfBlank(num) {
    return parseInt(num) || 0;
}
  
export function toUnixTime(date) {
    // Return date if not a Date object
    if (Object.prototype.toString.call(date) !== "[object Date]") return date;
    return parseInt((date.getTime() / 1000).toFixed(0));
}
  
export async function getBlockNumber(w3provider) {
    return w3provider.getBlockNumber();
}
  
export function encodeParameters(types, values) {
    let abi = new AbiCoder();
    return abi.encode(types, values);
}
  
export function decodeParameters(types, values) {
    let abi = new AbiCoder();
    return abi.decode(types, values);
}
  
export function formatDate(timestamp) {
    if (timestamp === 0) {
      return "None";
    } else {
      return (new Date(timestamp * 1000)).toLocaleString();
    }
}