import React from "react";

import RatingRange from "../../components/RatingRange/RatingRange";

import styles from "./Proposal.module.css";

const Proposal = ({ card }) => {
  const statusStile =
    card.status === "failed"
      ? styles.card__status_failed
      : card.status === "executed"
        ? styles.card__status_executed
        : "";

  return (
    <article
      className={`${styles.card} ${card.status === "failed" && styles.card_status_failed}`}
    >
      <div className={styles["flex-container"]}>
        <p
          className={`${styles.card__text} ${card.status === "failed" && styles.card__text_status_failed}`}
        >
          Add LP tokens to Anchor, reduse xINV reward rate and withdrawal delay,
          increase collateral factors and add Fuse Pool
        </p>
        <div className={styles.card__rating}>
          <RatingRange nice={card.nice} bad={card.bad} />
        </div>
      </div>
      <span className={`${styles.card__status} ${statusStile}`}>
        {card.status}
      </span>
      <span className={styles.card__number}>#{card.number}</span>
      <span className={styles.card__date}>{card.date}</span>
    </article>
  );
};

export default Proposal;
