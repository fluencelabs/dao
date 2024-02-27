import React from "react";
import { Link } from "react-router-dom";

import styles from "./LinkWithIcon.module.css";

const LinkWithIcon = ({
  color = "",
  text,
  icon,
  iconWidth = "",
  iconHeight = "",
  url = "/",
}) => {
  const style = {
    width: "38px",
    height: "38px",
    marginRight: "10px",
    display: "inline-block",

    backgroundPosition: "center",
    backgroundRepeat: " no-repeat",

    border: "1px solid #000000",
    borderRadius: "50%",
    backgroundImage: `url(${icon})`,
  };

  const styleWhite = {
    width: "38px",
    height: "38px",
    marginRight: "10px",
    display: "inline-block",

    backgroundPosition: "center",
    backgroundRepeat: " no-repeat",

    border: "1px solid #CFFFC4",
    borderRadius: "50%",
    backgroundImage: `url(${icon})`,
  };

  return (
    <Link
      to={url}
      target="_blank"
      className={`${styles["link-with-icon"]} ${color === "white" && styles["link-with-icon_color_white"]}`}
    >
      <div style={color === "white" ? styleWhite : style} />
      <span>{text}</span>
    </Link>
  );
};

export default LinkWithIcon;
