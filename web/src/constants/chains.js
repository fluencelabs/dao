const supportedChains = [
  {
    name: "Ethereum Mainnet",
    short_name: "mainnet",
    chain: "ETH",
    network: "mainnet",
    chain_id: 1,
    network_id: 1,
    explorer_url: "https://etherscan.io",
    rpc_url: `https://endpoints.omniatech.io/v1/eth/mainnet/public`,
    native_currency: {
      symbol: "ETH",
      name: "Ethereum",
      decimals: "18",
      contractAddress: "",
      balance: "",
    },
  },
  // NEXT CHAIN FOR TESTING ONLY
  // {
  //   name: "Fuji C-Chain",
  //   short_name: "fuji",
  //   chain: "C-CHAIN",
  //   network: "fuji",
  //   chain_id: 43113,
  //   network_id: 43113,
  //   explorer_url: "https://explorer.cchain.dev",
  //   rpc_url: "https://api.avax-test.network/ext/bc/C/rpc",
  //   native_currency: {
  //     symbol: "AVAX",
  //     name: "C-Chain",
  //     decimals: "18",
  //     contractAddress: "",
  //     balance: "",
  //   },
  // }
];

export default supportedChains;
