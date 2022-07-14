import React, { memo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Header from '../../components/Header/Header';
import Progress from '../../components/Progress/Progress';
import Title from '../../components/Title/Title';
import Text from '../../components/Text/Text';
import DefinitionList from '../../components/DefinitionList/DefinitionList';
import Dashboard from '../../components/Dashboard/Dashboard';
import Footer from '../../components/Footer/Footer';

import ConnectWallet from '../../components/ConnectWallet/ConnectWallet';

import styles from './step1-page.module.css';
import { useSelector } from 'react-redux';
import { ROUTE_PROOF } from '../../constants/routes';

const FirstStepPage = memo(() => {
    const navigate = useNavigate()
    const { address, web3Provider } = useSelector(state => state.wallet)
    const { currentAward } = useSelector(state => state.distributor)

    useEffect(() => {
        if (address && web3Provider) {
            navigate(ROUTE_PROOF)
        }
    }, [address])

    return (
        <div className={styles.background}>
            <Header />
            <div className="container">
                <main className={`main ${styles.main}`}>
                    <div className={styles.progress}>
                        <Progress />
                    </div>
                    <div className={styles.title}>
                        <Title type="h1" size="large" text="You are in! " icon="" />
                        <span className={styles["icon-fire"]}> 🔥</span>
                    </div>
                    <div className={styles.dashboard}>
                        <Dashboard>
                            <div className={styles["dashboard__flex-container"]}>
                                <div className={styles.dashboard__logo}/>
                                <div className={styles.definition}>
                                    <DefinitionList dd={`${currentAward || 0} FLT`} dt="ready to be claimed" colorD="orange" colorT="black"/>
                                </div>
                                
                            </div>
                            <div className={styles.dashboard__text}>
                                <Text color="black" type="large">
                                    Claiming will require an Ethereum wallet and performing basic tasks with terminal on your computer.
                                </Text>
                            </div>
                            <ol className={styles.dashboard__list}>
                                <li className={styles.dashboard__item}>
                                    Connect an Ethereum wallet
                                </li>
                                <li className={styles.dashboard__item}>
                                    Generate proof of Github account ownership
                                </li>
                                <li className={styles.dashboard__item}>
                                    Delegate or self-delegate DAO voting power
                                </li>
                                <li className={styles.dashboard__item}>
                                    Receive the tokens
                                </li>
                            </ol>
                            <div className={styles.dashboard__caption}>
                                <Text color="grey" type="small">
                                    Two Ethereum transactions of 0.001 ETH & 0.002 ETH gas fees will be involved on steps 3 & 4
                                </Text>
                            </div>
                            <div className={styles.dashboard__button}>
                                <ConnectWallet />
                            </div>
                            <p className={styles.dashboard__paragraph}>
                                If you are an advanced Ethereum user, you can claim directly from the smart contract.  <Link to='/' className={styles.dashboard__link}>Learn how to do it</Link>
                            </p>
                        </Dashboard>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    )
})

export default FirstStepPage;