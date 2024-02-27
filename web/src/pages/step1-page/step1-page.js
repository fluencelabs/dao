import React, { memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Progress from "../../components/Progress/Progress";
import Title from "../../components/Title/Title";
import Text from "../../components/Text/Text";
import DefinitionList from "../../components/DefinitionList/DefinitionList";
import Dashboard from "../../components/Dashboard/Dashboard";
import Footer from "../../components/Footer/Footer";

import ConnectWallet from "../../components/ConnectWallet/ConnectWallet";

import styles from "./step1-page.module.css";
import { useSelector } from "react-redux";
import { useWeb3Connection } from "../../hooks/useWeb3Connection";
import Button from "../../components/Button/Button";
import { ROUTE_PROOF } from "../../constants/routes";

const FirstStepPage = memo(() => {
  const navigate = useNavigate();
  const { address } = useWeb3Connection();
  const { currentAward } = useSelector((state) => state.distributor);

  const submitProofCallback = useCallback(() => {
    navigate(ROUTE_PROOF);
  }, [navigate]);

  return (
    <div className={styles.background}>
      <Header />
      <div className="container">
        <main className={`main ${styles.main}`}>
          <div className={styles.progress}>
            <Progress />
          </div>
          <div className={styles.title}>
            <Title type="h1" size="large" text="You are in! " icon="" />
            <span className={styles["icon-fire"]}> 🔥</span>
          </div>
          <div className={styles.dashboard}>
            <Dashboard>
              <div className={styles["dashboard__flex-container"]}>
                <div className={styles.dashboard__logo} />
                <div className={styles.definition}>
                  <DefinitionList
                    dd={`${currentAward || 0} FLT`}
                    dt="ready to be claimed"
                    colorD="orange"
                    colorT="black"
                  />
                </div>
              </div>
              <div className={styles.dashboard__text}>
                <Text color="black" type="large">
                  Claiming will require an Ethereum wallet and performing basic
                  tasks with terminal on your computer.
                </Text>
              </div>
              <ol className={styles.dashboard__list}>
                <li className={styles.dashboard__item}>
                  Connect an Ethereum wallet
                </li>
                <li className={styles.dashboard__item}>
                  Generate proof of Github account ownership
                </li>
                <li className={styles.dashboard__item}>Receive FLT</li>
              </ol>
              <div className={styles.dashboard__caption}>
                <Text color="grey" type="small"></Text>
              </div>
              {address && (
                <div className={styles.dashboard__button}>
                  <Button callback={submitProofCallback} text="Submit proofs" />
                </div>
              )}
              <div className={styles.dashboard__button}>
                <ConnectWallet />
              </div>
              <p className={styles.dashboard__paragraph}>
                If you are not comfortable connecting your wallet and submiting
                the proof via web UI, you can claim directly from the smart
                contract{" "}
                <Link
                  to="https://etherscan.io/address/0x6081d7F04a8c31e929f25152d4ad37c83638C62b#code"
                  className={styles.dashboard__link}
                >
                  on Etherscan
                </Link>
              </p>
            </Dashboard>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
});

export default FirstStepPage;
