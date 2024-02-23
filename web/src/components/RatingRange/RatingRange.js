import React, { useCallback, useEffect, useState } from "react";

import { roundNumber } from "../../utils/utils";

import styles from "./RatingRange.module.css";

const RatingRange = ({ nice, bad }) => {
  const [width, setWidth] = useState("51%");

  const stylesIndicator = useCallback(() => {
    if (nice > 0) {
      return String((nice / (nice + bad)) * 100) + "%";
    }
    return "1%";
  }, [bad, nice]);

  useEffect(() => {
    setWidth(stylesIndicator());
  }, [stylesIndicator]);

  const style = {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,

    height: "3px",
    width: `${width}`,

    backgroundColor: "#CFFFC4",
  };

  return (
    <div className={styles.container}>
      <div className={styles.range}>
        <span className={`${styles.count} ${styles.count_nice}`}>
          {roundNumber(nice)}
        </span>
        <div className={styles.range__body}>
          <span style={style} />
        </div>
        <span className={`${styles.count} ${styles.count_bad}`}>
          {roundNumber(bad)}
        </span>
      </div>
      <span className={`${styles.count} ${styles.count_total}`}>
        {roundNumber(nice + bad)} votes
      </span>
    </div>
  );
};

export default RatingRange;
