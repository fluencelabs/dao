import React from "react";

import styles from "./Title.module.css";

const Title = ({ size = "default", text, type, color = "" }) => {
  const styleSize =
    size === "large"
      ? styles.title_size_large
      : size === "big"
        ? styles.title_size_big
        : size === "medium"
          ? styles.title_size_medium
          : size === "default"
            ? styles.title_size_default
            : size === "small"
              ? styles.title_size_small
              : "";

  const styleColor = color === "black" ? styles.title_color_black : "";

  return (
    <>
      {type === "h1" ? (
        <h1 className={`${styles.title} ${styleSize} ${styleColor}`}>{text}</h1>
      ) : type === "h2" ? (
        <h2 className={`${styles.title} ${styleSize} ${styleColor}`}>{text}</h2>
      ) : type === "h3" ? (
        <h3 className={`${styles.title} ${styleSize} ${styleColor}`}>{text}</h3>
      ) : type === "h4" ? (
        <h4 className={`${styles.title} ${styleSize} ${styleColor}`}>{text}</h4>
      ) : type === "h5" ? (
        <h5 className={`${styles.title} ${styleSize} ${styleColor}`}>{text}</h5>
      ) : (
        <></>
      )}
    </>
  );
};

export default Title;
