const supportedChains = [
  {
    name: "Ethereum Mainnet",
    short_name: "mainnet",
    chain: "ETH",
    network: "mainnet",
    chain_id: 1,
    network_id: 1,
    explorer_url: "https://etherscan.io",
    rpc_url: `https://mainnet.gateway.tenderly.co`,
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
