import React from "react";

import styles from "./Text.module.css";

const Text = ({ type, color = "default", children }) => {
  const textStyle = `
        ${styles.text}
        ${type === "large" ? styles.text_type_large : type === "mid" ? styles.text_type_mid : type === "default" ? styles.text_type_default : type === "small" ? styles.text_type_small : ""}
        ${color === "default" ? styles.text_color_default : color === "black" ? styles.text_color_black : color === "grey" ? styles.text_color_grey : ""}
    `;
  return <p className={textStyle}>{children}</p>;
};

export default Text;
