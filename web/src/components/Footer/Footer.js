import React, {useEffect} from 'react';
import { Link } from 'react-router-dom';

import Title from '../Title/Title';
import Text from '../Text/Text';
import List from '../List/List';

import { useFormWithValidation } from '../../hooks/useForm';

import discord from '../../images/discord.svg';
import twitter from '../../images/twitter.svg';
import telegram from '../../images/telegram.svg';
import youtube from '../../images/youtube.svg';
import styles from './Footer.module.css';

const Footer = () => {

    const { values, handleChange, isValid, resetForm } = useFormWithValidation();

    useEffect(() => {
        resetForm()
    }, [])
    const handleSubmit = (e) => {
        e.preventDefault();
    }
    return (
        <footer className={styles.footer}>
            <div className={styles.footer__container}>
                <div className={styles.footer_row_top}>
                    <div className={styles[`footer__flex-container`]}>
                        <Title size="medium" type="h2" text="Stay up to date" />
                        <div className={styles.footer__text}>
                            <Text type='default' color='grey'>
                                Fluence Labs sends regular updates about the project. Subscribe via email to get notified.
                            </Text>
                        </div>
                    </div>
                    <form className={styles.footer__form} onSubmit={handleSubmit}>
                        <input 
                            className={`${styles.footer__input} ${!isValid && values.email  && styles.footer__input_type_error}`}
                            type='email'
                            placeholder='Enter email'
                            name='email'
                            required
                            value={values.email || ''}
                            onChange={handleChange}
                        />
                        <span className={`${styles.footer__error} ${!isValid && values.email && styles.footer__error_show}`}>That doesn’t look like a valid email</span>
                        <button type='submit' className={styles.footer__submit} disabled={!isValid}>
                        </button>
                    </form>
                </div>
                <div className={styles.footer_row_bottom}>
                    <div className={styles.footer_column_left}>
                        <List title='Learn' >
                            <li className={styles.footer__item}>
                                <Link className={styles.footer__link} to="/">Technology</Link>
                            </li>
                            <li className={styles.footer__item}>
                                <Link className={styles.footer__link} to="/">FAQ</Link>
                            </li>
                            <li className={`${styles.footer__item} ${styles.footer__item_list_arrow}`}>
                                <Link className={styles.footer__link} to="/">Videos</Link>
                            </li>
                        </List>
                        <List title='Build' >
                            <li className={styles.footer__item}>
                                <Link className={styles.footer__link} to="/">Quick start </Link>
                            </li>
                            <li className={styles.footer__item}>
                                <Link className={styles.footer__link} to="/">Tutorials</Link>
                            </li>
                            <li className={`${styles.footer__item}`}>
                                <Link className={styles.footer__link} to="/">Docs</Link>
                            </li>
                        </List>
                    </div>
                    <div className={styles.footer_column_right}>
                        <div className={styles["footer__flex-column"]}>
                            <List title='Get involved' >
                                <li className={styles.footer__item}>
                                    <Link className={styles.footer__link} to="/">DAO </Link>
                                </li>
                                <li className={styles.footer__item}>
                                    <Link className={styles.footer__link}  to="/">Events</Link>
                                </li>
                            </List>
                            <div style={{"marginTop": "20px"}}>
                                <List>
                                    <li className={`${styles.footer__item} ${styles.footer__item_list_arrow}`}>
                                        <Link className={styles.footer__link} to="/">Telegram</Link>
                                    </li>
                                    <li className={`${styles.footer__item} ${styles.footer__item_list_arrow}`}>
                                        <Link className={styles.footer__link} to="/">Discord</Link>
                                    </li>
                                    <li className={`${styles.footer__item} ${styles.footer__item_disabled} ${styles.footer__item_list_arrow}`}>
                                        Forum <span className={styles.footer__caption}>soon</span>
                                    </li>
                                </List>
                            </div>
                            
                        </div>
                        <div className={styles["footer__column_flex-end"]}>
                            <List social>
                                <li className={`${styles.footer__item} ${styles.footer__item_mr}`}>
                                    <Link className={styles.footer__link} to="/">
                                        <img src={discord} className={styles.footer__icon_discord} alt="icon"/>
                                    </Link>
                                </li>
                                <li className={`${styles.footer__item} ${styles.footer__item_mr}`}>
                                    <Link className={styles.footer__link} to="/">
                                    <img src={twitter} className={styles.footer__icon_twitter} alt="icon"/>
                                    </Link>
                                </li>
                                <li className={`${styles.footer__item} ${styles.footer__item_mr}`}>
                                    <Link className={styles.footer__link} to="/">
                                        <img src={telegram} className={styles.footer__icon_telegram} alt="icon"/>
                                    </Link>
                                </li>
                                <li className={`${styles.footer__item} ${styles.footer__item_mr}`}>
                                    <Link className={styles.footer__link} to="/">
                                    <img src={youtube} className={styles.footer__icon_youtube} alt="icon"/>
                                    </Link>
                                </li>
                            </List>
                        </div>
                        
                    </div>
                </div>
            </div>
            <div className={styles.footer__corner} />
            
            
        </footer>
    )
}

export default Footer;