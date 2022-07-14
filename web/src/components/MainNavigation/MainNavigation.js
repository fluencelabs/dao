import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

import Button from '../Button/Button';

import styles from './MainNavigation.module.css';
import discord from '../../images/discord-black.svg';
import telegram from '../../images/telegram-black.svg';
import twitter from '../../images/twitter-black.svg';
import youtube from '../../images/youtube-black.svg';

const MainNavigation = ({ width }) => {
    const [active, setActive] = useState('dao');

    const [IsOpenMenu, setIsOpenMenu] = useState(false);

    const handleOpenMenu = ()=> {
        setIsOpenMenu(true);
    }

    const handleCloseMenu = ()=> {
        setIsOpenMenu(false);
    }
    

    // eslint-disable-next-line no-lone-blocks
    return (<>
        {width < 769
            ?
                <nav>
                    <button className={styles.burger} aria-label="Open menu" onClick={handleOpenMenu} />
                    <div className={`${styles.overlay} ${IsOpenMenu && styles.overlay_active}`}>
                        <button className={styles.close} onClick={handleCloseMenu} aria-label="Close menu" />
                        <div className={styles.body}>
                            <ul className={styles.burger__list}>
                                <li className={styles.burger__item}>
                                    <NavLink to="#" className={`${styles.burger__link} ${active === 'tech' && styles.burger__link_active}` } onClick={() => setActive('tech')}>Technology</NavLink>
                                </li>
                                <li className={styles.burger__item}>
                                    <NavLink to="#" className={`${styles.burger__link} ${active === 'dao' && styles.burger__link_active}` } onClick={() => setActive('dao')}>DAO</NavLink>
                                </li>
                                <li className={styles.burger__item}>
                                    <NavLink to="#" className={`${styles.burger__link} ${active === 'faq' && styles.burger__link_active}` } onClick={() => setActive('faq')}>FAQ</NavLink>
                                </li>
                                <li className={styles.burger__item}>
                                    <NavLink to="#" className={`${styles.burger__link} ${active === 'docs' && styles.burger__link_active}` } onClick={() => setActive('docs')}>Docs</NavLink>
                                </li>
                            </ul>
                            <Button text="Start Building" />
                            <ul className={styles["burger__socials"]}>
                                < li className={styles["burger__social"]}>
                                    <Link className={styles.footer__link} to="/">
                                        <img src={discord} style={{"width": "26px"}} alt="icon"/>
                                    </Link>
                                </li>
                                < li className={styles["burger__social"]}>
                                    <Link className={styles.footer__link} to="/">
                                        <img src={twitter} alt="icon"/>
                                    </Link>
                                </li>
                                < li className={styles["burger__social"]}>
                                    <Link className={styles.footer__link} to="/">
                                        <img src={telegram} style={{"width": "19px"}} alt="icon"/>
                                    </Link>
                                </li>
                                < li className={styles["burger__social"]}>
                                    <Link className={styles.footer__link} to="/">
                                        <img src={youtube} alt="icon"/>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            :
                <nav className={styles.nav} >
                    <ul className={styles.nav__list}>
                        <li className={styles.nav__item}>
                            <NavLink to="#" className={`${styles.nav__link} ${active === 'tech' && styles.nav__link_active}` } onClick={() => setActive('tech')}>Technology</NavLink>
                        </li>
                        <li className={styles.nav__item}>
                            <NavLink to="#" className={`${styles.nav__link} ${active === 'dao' && styles.nav__link_active}` } onClick={() => setActive('dao')}>DAO</NavLink>
                        </li>
                        <li className={styles.nav__item}>
                            <NavLink to="#" className={`${styles.nav__link} ${active === 'faq' && styles.nav__link_active}` } onClick={() => setActive('faq')}>FAQ</NavLink>
                        </li>
                        <li className={styles.nav__item}>
                            <NavLink to="#" className={`${styles.nav__link} ${active === 'docs' && styles.nav__link_active}` } onClick={() => setActive('docs')}>Docs</NavLink>
                        </li>
                    </ul>
                </nav>
        }
    </>)
    

    
}

export default MainNavigation;