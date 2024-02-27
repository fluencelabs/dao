import React, { useState } from "react";

import Button from "../Button/Button";

import styles from "./MainNavigation.module.css";
import discord from "../../images/discord-black.svg";
import telegram from "../../images/telegram-black.svg";
import twitter from "../../images/twitter-black.svg";
import youtube from "../../images/youtube-black.svg";

const navLinks = [
  {
    content: 'Developers',
    link: 'https://fluence.network/build'
  },
  {
    content: 'Network',
    link: 'https://fluencenetwork.notion.site/Employ-your-CPUs-with-Fluence-9e721f2c99c944e68e1fc8aaf5a7d96f'
  },
  {
    content: 'Community',
    link: 'https://fluence.network/governance'
  },
];

const socialLinks = [
  {
    content: <img src={discord} style={{ width: "26px" }} alt="icon" />,
    link: 'https://fluence.chat/'
  },
  {
    content: <img src={twitter} alt="icon" />,
    link: 'https://twitter.com/fluence_project'
  },
  {
    content: <img src={telegram} style={{ width: "19px" }} alt="icon" />,
    link: 'https://t.me/fluence_project'
  },
  {
    content: <img src={youtube} alt="icon" />,
    link: 'https://www.youtube.com/@fluencelabs/videos'
  },
];

const MainNavigation = ({ width }) => {
  const [IsOpenMenu, setIsOpenMenu] = useState(false);

  const handleOpenMenu = () => {
    setIsOpenMenu(true);
  };

  const handleCloseMenu = () => {
    setIsOpenMenu(false);
  };

  // eslint-disable-next-line no-lone-blocks
  return (
    <>
      {width < 769 ? (
        <nav>
          <button
            className={styles.burger}
            aria-label="Open menu"
            onClick={handleOpenMenu}
          />
          <div
            className={`${styles.overlay} ${IsOpenMenu && styles.overlay_active}`}
          >
            <button
              className={styles.close}
              onClick={handleCloseMenu}
              aria-label="Close menu"
            />
            <div className={styles.body}>
              <ul className={styles.burger__list}>
                {navLinks.map(({content, link}, i) => (
                  <li className={styles.burger__item} key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.burger__link}
                    >
                      {content}
                    </a>
                  </li>
                ))}
              </ul>
              <a href="https://fluence.dev/docs" target="_blank" rel="noreferrer">
                <Button text="Start Building" />
              </a>
              <ul className={styles["burger__socials"]}>
                {
                  socialLinks.map(({content, link}, i) => (
                    <li className={styles["burger__social"]} key={i}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.footer__link}
                      >
                        {content}
                      </a>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>
        </nav>
      ) : (
        <nav className={styles.nav}>
          <ul className={styles.nav__list}>
            {navLinks.map(({content, link}, i) => (
              <li className={styles.nav__item} key={i}>
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.nav__link}
                >
                  {content}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
};

export default MainNavigation;
