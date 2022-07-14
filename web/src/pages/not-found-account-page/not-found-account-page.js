import React from 'react';
import { Link } from 'react-router-dom';

import Header from '../../components/Header/Header';

import Title from '../../components/Title/Title';
import Dashboard from '../../components/Dashboard/Dashboard';
import LinkWithIcon from '../../components/LinkWithIcon/LinkWithIcon';
import Footer from '../../components/Footer/Footer';

import dialogBlack from '../../images/dialog-black.svg';
import telegramBlack from '../../images/telegram-black.svg';
import discordBlack from '../../images/discord-black.svg';
import styles from './not-found-account-page.module.css';

const AccountNotFound = () => {
    return (
        <div className={styles.background}>
            <div className={styles.header}>
                <Header button />
            </div>
            
            <div className="container">
                <main className={`main ${styles.main}`}>

                    <div className={styles.title}>
                        <Title type="h1" size="large" text=":| Sorry, seems like you're not eligible for this."  />
                    </div>
                    <div className={styles.dashboard}>
                        <Dashboard>
                            <p className={styles.dashboard__text}>
                                Your account hasn’t been included in the list. Only people who contributed to the development of selected Web3 projects are included. If we missed you ... we are sorry!
                            </p>
                            <p className={styles.dashboard__caption}>
                                Also, there could be a case that you haven’t uploaded public keys to your Github account, so we couldn’t add you to the reward. <Link  className={styles.dashboard__link} to="/">Learn more</Link> about how this reward is designed.
                            </p>
                            <p className={`${styles.dashboard__text} ${styles.dashboard__text_mid}`}>
                                Don’t worry, there will be other ways to get FLT. The Fluence DAO will work on various programs that would allow to earn FLT for valuable contributions.
                            </p>
                            <p className={`${styles.dashboard__text} ${styles.dashboard__text_mid}`}>
                                If you are interested in getting FLT now, you can <Link  className={`${styles.dashboard__link} ${styles.dashboard__text_mid}`} to="/">buy it on Uniswap.</Link>
                            </p>
                            <div className={styles.dashboard__title}>
                                <Title type="h2" size="medium" color="black" text="Get involved in the community"  />
                            </div>
                            
                            <ul className={styles.dashboard__list}>
                                
                                <li className={styles.dashboard__item}>
                                        <LinkWithIcon text="Join the Discord server" icon={discordBlack} />
                                </li>
                                <li className={styles.dashboard__item}>
                                        <LinkWithIcon text="Connect on Telegram" style={{"backgroundSize": "14px"}} icon={telegramBlack} />
                                </li>
                                <li className={styles.dashboard__item}>
                                        <LinkWithIcon text="Governance forum"  icon={dialogBlack} />
                                </li>
                                

                            </ul>

                        </Dashboard>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    )
}

export default AccountNotFound;