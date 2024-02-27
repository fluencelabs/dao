import React from "react";
import { useSelector } from "react-redux";

import Header from "../../components/Header/Header";
import Title from "../../components/Title/Title";
import Button from "../../components/Button/Button";
import Footer from "../../components/Footer/Footer";
import TwitterShare from "../../hoc/TwitterShare";
import { addTokenToMetamask } from "../../utils/metamask";
import { governanceContracts } from "../../constants";
import styles from "./claimed-page.module.css";
import { useWeb3Connection } from "../../hooks/useWeb3Connection";

const TwitterShareButton = TwitterShare(Button);

const ClaimedPage = () => {
  const { network } = useWeb3Connection();
  const { currentAward } = useSelector((state) => state.distributor);

  const handleAddToken = () => {
    addTokenToMetamask(governanceContracts[network.name].devRewardDistributor);
  };

  return (
    <div className={styles.background}>
      <div className={styles.background__image}></div>
      <div className={styles.header}>
        <Header button />
      </div>

      <div className="container">
        <main className={`main ${styles.main}`}>
          <div className={styles.title}>
            <Title
              type="h1"
              size="large"
              text="Seems like you have claimed your FLT already"
            />
          </div>

          <ul className={styles.buttons}>
            <li className={styles.button}>
              <Button
                callback={handleAddToken}
                type="large"
                text="Display FLT-DROP in Metamask"
              />
            </li>
            <li className={styles.button}>
              <TwitterShareButton
                type="large"
                icon="twitter"
                text="Share on Twitter"
                caption={`I just claimed ${currentAward} FLT tokens of Fluence!`}
                url="https://fluence.network"
              />
            </li>
          </ul>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ClaimedPage;
