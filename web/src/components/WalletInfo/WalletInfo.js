import React from "react";

import styles from "./WalletInfo.module.css";

const WalletInfo = ({ wallet = "", account = "" }) => {
  return (
    <dl className={styles.wallet}>
      <dt className={styles.wallet__name}>{wallet}</dt>
      <dd className={styles.wallet__account}>{account}</dd>
    </dl>
  );
};

export default WalletInfo;
