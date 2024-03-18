import { createContext, useCallback, useEffect, useState } from "react";
import { providers } from "ethers";
import supportedChains from "../constants/chains";
import {
  createWeb3Modal,
  defaultConfig,
  useDisconnect,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider
} from "@web3modal/ethers5/react";
import { toast } from "react-toastify";

const metadata = {
  name: 'Fluence reward',
  description: 'Fluence dao reward for participating in web3 development',
  url: 'https://claim.fluence.network',
  icons: ['https://claim.fluence.network/favicon.ico']
}

const chains = supportedChains.map(({chain_id, network, native_currency, explorer_url, rpc_url}) => ({
  chainId: chain_id,
  name: network,
  currency: native_currency.symbol,
  explorerUrl: explorer_url,
  rpcUrl: rpc_url
}));

const DEFAULT_NETWORK = supportedChains[0];

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains,
  defaultChain: DEFAULT_NETWORK.network,
  projectId: 'c7ce6e969f0b45089bfe1aed1187d348',
  enableAnalytics: false // Optional - defaults to your Cloud configuration
});

const defaultProvider = new providers.JsonRpcProvider(
  supportedChains[0].rpc_url,
  {
    name: supportedChains[0].network,
    chainId: supportedChains[0].chain_id,
  },
);

export const Web3Context = createContext(null);

export const Web3ContextProvider = ({ children }) => {
  const { open } = useWeb3Modal()
  const [provider, setProvider] = useState(defaultProvider);
  const { walletProvider } = useWeb3ModalProvider();
  const { address } = useWeb3ModalAccount();
  const { disconnect: disconnectWallet } = useDisconnect();

  const connect = useCallback(async () => {
    try {
      await open();
    } catch (e) {
      console.log(e);
    }
  }, [open]);

  useEffect(() => {
    if (walletProvider) {
      const chainId = Number(walletProvider.chainId ?? walletProvider.networkVersion);
      const network = supportedChains.find(chain => chain.chain_id === chainId);
      if (network === undefined) {
        toast(`The supported networks are: ${supportedChains.map(chain => chain.network).join(',')}. Falling back to default provider.`);
        setProvider(defaultProvider);
        return;
      }
      const web3Provider = new providers.Web3Provider(
        walletProvider,
        {
          name: network.network,
          chainId
        }
      );
      setProvider(web3Provider)
    } else {
      setProvider(defaultProvider);
    }
  }, [walletProvider]);

  const disconnect = useCallback(async function () {
    await disconnectWallet();
    setProvider(defaultProvider);
  }, []);

  return (
    <Web3Context.Provider
      value={{
        connect,
        disconnect,
        provider,
        address,
        network: provider.network,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
