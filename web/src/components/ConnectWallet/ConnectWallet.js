import Button from "../Button/Button";
import { useWeb3Connection } from "../../hooks/useWeb3Connection";

const ConnectWallet = () => {
  const { connect, disconnect, address } = useWeb3Connection();

  return (
    <>
      {address ? (
        <Button callback={disconnect} text="Disconnect" />
      ) : (
        <Button callback={connect} text="Connect a wallet" />
      )}
    </>
  );
};

export default ConnectWallet;
