import React from "react";
import { useLocation } from "react-router-dom";

import styles from "./Progress.module.css";

const Progress = () => {
  const location = useLocation();

  return (
    <ul className={styles["progress-list"]}>
      <li
        className={`${styles["progress-list__item"]} ${location.pathname === "/wallet" ? styles["progress-list__item_done"] && styles["progress-item_current"] : styles["progress-item_current"]}`}
      >
        <span
          className={`${styles["progress-list__caption"]} ${location.pathname !== "/wallet" && styles["progress-list__caption_done"]}`}
        >
          Wallet
        </span>
      </li>
      <li
        className={`${styles["progress-list__item"]} ${location.pathname === "/done" || location.pathname === "/finish" || location.pathname === "/delegation" ? `${styles["progress-item_current"]}  ${styles["progress-list__item_done"]} ` : location.pathname === "/proof" ? styles["progress-item_current"] : ""}`}
      >
        <span
          className={`${styles["progress-list__caption"]} ${(location.pathname === "/done" || location.pathname === "/finish" || location.pathname === "/delegation") && styles["progress-list__caption_done"]}`}
        >
          Proof
        </span>
      </li>
      <li
        className={`${styles["progress-list__item"]} ${location.pathname === "/finish" ? `${styles["progress-list__item_done"]} && ${styles["progress-item_current"]}` : location.pathname === "/done" ? styles["progress-item_current"] : ""}`}
      >
        <span
          className={`${styles["progress-list__caption"]} ${location.pathname === "/finish" && styles["progress-list__caption_done"]}`}
        >
          Finish
        </span>
      </li>
    </ul>
  );
};

export default Progress;
