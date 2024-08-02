import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import MainNavigation from "../MainNavigation/MainNavigation";
import Button from "../Button/Button";

import logo from "../../images/logo.svg";
import styles from "./Header.module.css";

const Header = ({ button = false }) => {
  const [currentWidthWindow, setCurrentWidthWindow] = useState(
    window.innerWidth,
  );

  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/");
  };

  useEffect(() => {
    const resizeCurrentWidth = () => {
      setCurrentWidthWindow(window.innerWidth);
    };

    window.addEventListener("resize", resizeCurrentWidth);

    return () => {
      window.removeEventListener("resize", resizeCurrentWidth);
    };
  }, []);
  return (
    <>
      <div className={styles["header__top_notification"]}>
        Join the FLT Stake Race • 1 million FLT in prizes
        <a href="https://race.fluence.network/" target="_blank" className={styles["header__top_link"]}>Learn more</a>
      </div>
      <header className={styles.header}>
        <div className={styles["header__flex-container"]}>
          <Link to="/fluence">
            <img
              src={logo}
              alt="fluence logotype"
              className={styles.header__logo}
            />
          </Link>

          <MainNavigation width={currentWidthWindow} />
        </div>
        {button && currentWidthWindow > 768 && (
          <Button type="default" text="Start building" callback={handleClick} />
        )}
      </header>
    </>
  );
};

export default Header;
