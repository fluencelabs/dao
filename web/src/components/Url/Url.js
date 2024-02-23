import React from "react";
import { Link } from "react-router-dom";

import styles from "./Url.module.css";

const Url = ({ text, color = "" }) => {
  return (
    <Link
      to="/"
      className={`${styles.url} ${color === "black" && styles.url_color_black}`}
    >
      {text}
    </Link>
  );
};

export default Url;
