import React from "react";

import styles from "./Button.module.css";

const Button = ({
  type = "default",
  text,
  icon = null,
  opacity = false,
  callback = null,
}) => {
  if (type === "default")
    return (
      <button
        className={`${styles.button} ${styles.button_height_default}`}
        onClick={callback}
      >
        {text}
      </button>
    );

  if (type === "small" && opacity === true)
    return (
      <button
        className={`${styles.button} ${styles.button_height_small} ${styles.button_opacity}`}
        onClick={callback}
      >
        {text}
      </button>
    );

  if (type === "small")
    return (
      <button
        className={`${styles.button} ${styles.button_height_small}`}
        onClick={callback}
      >
        {text}
      </button>
    );

  if (type === "large" && icon === "git")
    return (
      <button
        className={`${styles.button} ${styles.button_height_large} ${styles.button_icon} ${styles.button_icon_git}`}
        onClick={callback}
      >
        {text}
      </button>
    );

  if (type === "large" && icon === "twitter")
    return (
      <button
        className={`${styles.button} ${styles.button_height_large} ${styles.button_icon} ${styles.button_icon_twitter}`}
        onClick={callback}
      >
        {text}
      </button>
    );

  if (type === "large" && opacity === true)
    return (
      <button
        className={`${styles.button} ${styles.button_height_large} ${styles.button_opacity}`}
        onClick={callback}
      >
        {text}
      </button>
    );

  if (type === "large")
    return (
      <button
        className={`${styles.button} ${styles.button_height_large} `}
        onClick={callback}
      >
        {text}
      </button>
    );
};

export default Button;
