import React from "react";

import styles from "./DefinitionList.module.css";

const DefinitionList = ({ dt, dd, colorT = "", colorD = "" }) => {
  const colorStyleD =
    colorD === "orange"
      ? "definition-list__definition_color_orange"
      : colorD === "black"
        ? "definition-list__definition_color_black"
        : "";
  const colorStyleT = colorT === "black" ? "color_black" : "";

  return (
    <dl className={styles["definition-list"]}>
      <dd
        className={`${styles["definition-list__definition"]} ${styles["definition-list__definition"]} ${styles[colorStyleD]}`}
      >
        {dd}
      </dd>
      <hr
        className={`${styles["definition-list__line"]} ${styles[colorStyleT]}`}
      />
      <dt
        className={`${styles["definition-list__term"]} ${styles[colorStyleT]}`}
      >
        {dt}
      </dt>
    </dl>
  );
};

export default DefinitionList;
