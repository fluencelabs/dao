import React from "react";

import Title from "../Title/Title";

import styles from "./List.module.css";

const List = ({ title = "", social = false, children }) => {
  if (social) {
    return <ul className={styles.list_social}>{children}</ul>;
  }
  return (
    <div
      className={`${styles.container} ${title === "" && styles.container_jc_end}`}
    >
      {title !== "" && <Title text={title} type="h2" size="small" />}
      <ul className={styles.list}>{children}</ul>
    </div>
  );
};

export default List;
