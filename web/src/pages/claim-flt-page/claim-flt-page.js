import { memo, useEffect, useState } from "react";
import { useWeb3Connection } from "../../hooks/useWeb3Connection";
import { ethers } from "ethers";
import ConnectWallet from "../../components/ConnectWallet/ConnectWallet";
import styles from "./claim-flt-page.module.css";
import Header from "../../components/Header/Header";
import Title from "../../components/Title/Title";
import Dashboard from "../../components/Dashboard/Dashboard";
import DefinitionList from "../../components/DefinitionList/DefinitionList";
import Text from "../../components/Text/Text";
import Footer from "../../components/Footer/Footer";
import { governanceContracts } from "../../constants";
import abis from "../../contracts";
import { formatSeconds } from "./helpers";
import Button from "../../components/Button/Button";
import supportedChains from "../../constants/chains";


export const ClaimFltPage = memo(() => {
  const { address, provider, network } = useWeb3Connection();
  const [amountAndDate, setAmountAndDate] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!amountAndDate || !address) {
      return;
    }

    const updateSecondsLeft = () => {
      const now = Date.now();
      const unlockTime = amountAndDate.unlockTime.getTime() / 1000;
      const newSecondsLeft = Math.floor((unlockTime - now / 1000));
      setSecondsLeft(newSecondsLeft);
    };

    updateSecondsLeft();

    let intervalId;
    if (!secondsLeft || secondsLeft > 0) {
      intervalId = setInterval(updateSecondsLeft, 500);
    }
    return () => clearInterval(intervalId);
  }, [amountAndDate, address, network]);

  useEffect(() => {
    if (!provider) return;
    (async () => {
      const contract = new ethers.Contract(
        governanceContracts[network.name].devRewardDistributor,
        abis.DevRewardDistributor.abi,
        provider
      );
      if (address) {
        const data = await contract.functions.lockedBalances(address);
        const { amount, unlockTime } = data;
        const _amount = +ethers.utils.formatEther(amount);
        const _unlockTime = new Date(unlockTime.toNumber() * 1000);
        setAmountAndDate({ amount: _amount, unlockTime: _unlockTime });
      }
    })();
  }, [address, provider, network]);

  const [waitForSigning, setWaitForSigning] = useState(false);
  const [waitForReceipt, setWaitForReceipt] = useState(false);
  const [confirmedTxHash, setConfirmedTxHash] = useState(null);

  const handleClaim = async () => {
    const contract = new ethers.Contract(
      governanceContracts[network.name].devRewardDistributor,
      abis.DevRewardDistributor.abi,
      provider.getSigner(),
    );
    setWaitForSigning(true);
    const response = await contract.functions.transfer(address, amountAndDate.amount, { from: address });
    setWaitForSigning(false);
    setWaitForReceipt(true);
    const receipt = await response.wait();
    setWaitForReceipt(false);
    setConfirmedTxHash(receipt.transactionHash);
  }

  const dateInFuture = amountAndDate?.unlockTime > new Date();

  return (
    <>
      <div className={styles.background}>
        <Header />
        <div className="container">
          <main className={`main ${styles.main}`}>
            <div className={styles.title}>
              <Title type="h1" size="large" text="FLT-DROP Claim" icon="" />
            </div>
            <div className={styles.dashboard}>
              <Dashboard>
                <div className={styles["dashboard__flex-container"]}>
                  <div className={styles.dashboard__logo} />
                  <div className={styles.definition}>
                    {amountAndDate?.unlockTime ? <>
                      {amountAndDate.amount !== 0 && <DefinitionList
                        dd={`${amountAndDate.amount} FLT`}
                        dt={dateInFuture ? formatSeconds(secondsLeft) : "ready to be claimed"}
                        colorD="orange"
                        colorT="black"
                      />}
                      {amountAndDate.amount === 0 && "No FLT to claim"}
                    </> : (
                      <>
                        {(!address || !network) && "Connect your wallet"}
                        {address && network && "Loading data..."}
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.dashboard__text}>
                  <Text color="black" type="large">
                    Claiming is a transfer of tokens to yourself or another address
                  </Text>
                </div>
                <ol className={styles.dashboard__list}>
                  <li className={styles.dashboard__item}>
                    Connect an Ethereum wallet
                  </li>
                  <li className={styles.dashboard__item}>
                    Press claim and sign a transaction
                  </li>
                  <li className={styles.dashboard__item}>
                    Or just use metamask or another wallet – transfer tokens to yourself
                  </li>
                  {secondsLeft > 0 && <li className={styles.dashboard__item}>
                    You will be able to claim at {amountAndDate.unlockTime.toLocaleString()}
                  </li>}
                </ol>
                <div className={styles.dashboard__caption}>
                  <Text color="grey" type="small"></Text>
                </div>
                <div className={styles["dashboard__flex-container-flat"]}>
                  <div className={styles.dashboard__button}>
                    <ConnectWallet />
                  </div>
                  {!dateInFuture && Boolean(amountAndDate?.amount) && <div className={styles.dashboard__button}>
                    {waitForSigning && "Please sign tx in your wallet"}
                    {waitForReceipt && "Confirming..."}
                    {confirmedTxHash && <a href={supportedChains[0].explorer_url + "/tx/" + confirmedTxHash} target="_blank" rel="noreferrer">Transaction confirmed</a>}
                    {!waitForSigning && !waitForReceipt && !confirmedTxHash && <Button callback={handleClaim} text={`Claim FLT`} />}
                  </div>}
                </div>
              </Dashboard>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </>
  );  
});