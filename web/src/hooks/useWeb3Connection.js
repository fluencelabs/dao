import { useContext } from "react";
import { Web3Context } from "../context/web3Context";

export const useWeb3Connection = () => {
  return useContext(Web3Context);
};
