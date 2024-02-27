import React, { useEffect, useRef } from "react";

import Header from "../../components/Header/Header";
import Progress from "../../components/Progress/Progress";
import Title from "../../components/Title/Title";
import WalletInfo from "../../components/WalletInfo/WalletInfo";
import Button from "../../components/Button/Button";
import Footer from "../../components/Footer/Footer";

import styles from "./done-page.module.css";
import { useDispatch, useSelector } from "react-redux";
import { hideString } from "../../utils";
import { claim } from "../../store/actions/governance";
import { useWeb3Connection } from "../../hooks/useWeb3Connection";
import { useNavigate } from "react-router-dom";
import { ROUTE_FINISH } from "../../constants/routes";
import { MINED, MINING } from "../../constants";
import { toast } from "react-toastify";

const DonePage = () => {
  const { provider, address, network } = useWeb3Connection();
  const { claimStatus } = useSelector((state) => state.governance);
  const { currentAward } = useSelector((state) => state.distributor);
  const { proof } = useSelector((state) => state.governance.values);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleClaim = () => {
    // { userId, tmpEthAddr, signature, merkleProof }

    dispatch(
      claim(
        proof?.userId,
        proof?.merkleProof,
        proof?.tmpEthAddr,
        proof?.signature,
        provider,
        network.name,
      ),
    );
  };

  const loader = useRef();

  useEffect(() => {
    if (claimStatus === MINING) {
      loader.current = toast.loading(
        "Please wait while the transaction is being mined...",
      );
    }
    if (claimStatus === MINED) {
      toast.update(loader.current, {
        render: "Transaction mined succesfully",
        type: "success",
        isLoading: false,
      });
      navigate(ROUTE_FINISH);
      toast.dismiss(loader.current);
    }
  }, [claimStatus]);

  return (
    <div className={styles.background}>
      <Header />
      <div className="container">
        <main className={`main ${styles.main}`}>
          <div className={styles.progress}>
            <Progress />
          </div>
          <ul className={styles.wallets}>
            <li className={styles.wallet}>
              <WalletInfo wallet="wallet" account={hideString(address)} />
            </li>
          </ul>

          <div className={styles.title}>
            <Title
              type="h1"
              size="large"
              text="Almost done! You can claim your FLT now"
            />
          </div>

          <div className={styles.button}>
            <Button callback={handleClaim} text={`Claim ${currentAward} FLT`} />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DonePage;
