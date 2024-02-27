const supportedChains = [
  {
    name: "Ethereum Sepolia",
    short_name: "sepolia",
    chain: "ETH",
    network: "sepolia",
    chain_id: 11155111,
    network_id: 11155111,
    explorer_url: 'https://sepolia.etherscan.io/',
    rpc_url: `https://rpc.sepolia.org`,
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
