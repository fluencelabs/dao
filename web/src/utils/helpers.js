export function catchError(error, isMessage = false) {
  const message = isMessage ? error : error.message;

  // try to extract error message, otherwise return raw error
  let formatted_error;

  if (message.startsWith("invalid ENS name")) {
    formatted_error = "Missing or invalid parameter.";
  } else if (message.startsWith("JsonRpcEngine")) {
    formatted_error = "Cannot connect to the blockchain.";
  } else if (message.startsWith("invalid BigNumber string")) {
    formatted_error = "Invalid number parameter.";
  } else {
    formatted_error = message;
  }

  return formatted_error;
}
