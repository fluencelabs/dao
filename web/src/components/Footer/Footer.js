import React from "react";
import { Link } from "react-router-dom";

import List from "../List/List";

import discord from "../../images/discord.svg";
import twitter from "../../images/twitter.svg";
import telegram from "../../images/telegram.svg";
import youtube from "../../images/youtube.svg";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footer__container}>
        <div className={styles.footer_row_bottom}>
          <div className={styles.footer_column_left}>
            <List title="Resources">
              <li className={styles.footer__item}>
                <Link
                  className={styles.footer__link}
                  to="https://fluence.dev/docs/learn/overview"
                  target="_blank"
                >
                  Overview
                </Link>
              </li>
              <li
                className={`${styles.footer__item} ${styles.footer__item_list_arrow}`}
              >
                <Link
                  className={styles.footer__link}
                  to="https://www.youtube.com/@fluencelabs/videos"
                  target="_blank"
                >
                  Videos
                </Link>
              </li>
            </List>
            <List title="Build">
              <li className={styles.footer__item}>
                <Link
                  className={styles.footer__link}
                  to="https://fluence.dev/docs/build-mvm/introducing_fluence"
                  target="_blank"
                >
                  Docs
                </Link>
              </li>
              <li className={styles.footer__item}>
                <Link
                  className={styles.footer__link}
                  to="https://fluence.dev/docs/build-mvm/overview/getting_started"
                  target="_blank"
                >
                  Get Started
                </Link>
              </li>
              <li className={`${styles.footer__item}`}>
                <Link
                  className={styles.footer__link}
                  to="https://github.com/fluencelabs"
                  target="_blank"
                >
                  Github
                </Link>
              </li>
            </List>
          </div>
          <div className={styles.footer_column_right}>
            <div className={styles["footer__flex-column"]}>
              <List title="Get involved">
                <li className={styles.footer__item}>
                  <Link
                    className={styles.footer__link}
                    to="https://fluence.network/governance"
                    target="_blank"
                  >
                    DAO{" "}
                  </Link>
                </li>
              </List>
              <div style={{ marginTop: "20px" }}>
                <List>
                  <li
                    className={`${styles.footer__item} ${styles.footer__item_list_arrow}`}
                  >
                    <Link
                      className={styles.footer__link}
                      to="https://t.me/fluence_project"
                      target="_blank"
                    >
                      Telegram
                    </Link>
                  </li>
                  <li
                    className={`${styles.footer__item} ${styles.footer__item_list_arrow}`}
                  >
                    <Link
                      className={styles.footer__link}
                      to="https://fluence.chat"
                      target="_blank"
                    >
                      Discord
                    </Link>
                  </li>
                  <li
                    className={`${styles.footer__item} ${styles.footer__item_list_arrow}`}
                  >
                    <Link
                      className={styles.footer__link}
                      to="https://gov.fluence.network/"
                      target="_blank"
                    >
                      Forum
                    </Link>
                  </li>
                </List>
              </div>
            </div>
            <div className={styles["footer__column_flex-end"]}>
              <List social>
                <li
                  className={`${styles.footer__item} ${styles.footer__item_mr}`}
                >
                  <Link
                    className={styles.footer__link}
                    to="https://fluence.chat/"
                    target="_blank"
                  >
                    <img
                      src={discord}
                      className={styles.footer__icon_discord}
                      alt="icon"
                    />
                  </Link>
                </li>
                <li
                  className={`${styles.footer__item} ${styles.footer__item_mr}`}
                >
                  <Link
                    className={styles.footer__link}
                    to="https://twitter.com/fluence_project"
                    target="_blank"
                  >
                    <img
                      src={twitter}
                      className={styles.footer__icon_twitter}
                      alt="icon"
                    />
                  </Link>
                </li>
                <li
                  className={`${styles.footer__item} ${styles.footer__item_mr}`}
                >
                  <Link
                    className={styles.footer__link}
                    to="https://t.me/fluence_project"
                    target="_blank"
                  >
                    <img
                      src={telegram}
                      className={styles.footer__icon_telegram}
                      alt="icon"
                    />
                  </Link>
                </li>
                <li
                  className={`${styles.footer__item} ${styles.footer__item_mr}`}
                >
                  <Link
                    className={styles.footer__link}
                    to="https://www.youtube.com/@fluencelabs/videos"
                    target="_blank"
                  >
                    <img
                      src={youtube}
                      className={styles.footer__icon_youtube}
                      alt="icon"
                    />
                  </Link>
                </li>
              </List>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
