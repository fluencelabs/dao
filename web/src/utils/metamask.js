const tokenSymbol = "FLT";
const tokenDecimals = 18;
const tokenImage =
  "https://sun9-47.userapi.com/impg/VXEDLdXIw1GrZT6nVIN7C87nDbJWC7aDZtI5cA/6ozS9JC4M9Q.jpg?size=512x512&quality=96&sign=8fa6a99090393d337a459d7413ba38b9&type=album";

export const addTokenToMetamask = async (tokenAddress) => {
  try {
    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
    const wasAdded = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: tokenAddress,
        },
      },
    });

    if (wasAdded) {
      console.log("FLT added to Metamask");
    } else {
      console.log("FLT rejected!");
    }
  } catch (error) {
    console.log(error);
  }
};
