const { REACT_APP_INFURA_KEY } = process.env;

const supportedChains = [
  {
    name: "Ethereum Sepolia",
    short_name: "sepolia",
    chain: "ETH",
    network: "sepolia",
    rpc_url: `https://sepolia.infura.io/v3/${REACT_APP_INFURA_KEY}`,
    native_currency: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: "18",
      contractAddress: "",
      balance: "",
    },
  },
];

export default supportedChains;
