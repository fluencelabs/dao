import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import githubUsernameRegex from 'github-username-regex';

import Header from '../../components/Header/Header';
import Title from '../../components/Title/Title';
import Text from '../../components/Text/Text';
import Button from '../../components/Button/Button';
import Url from '../../components/Url/Url';
import Dashboard from '../../components/Dashboard/Dashboard'
import DefinitionList from '../../components/DefinitionList/DefinitionList';
import Footer from '../../components/Footer/Footer'
import TimeUntilReduce from '../../components/TimeUntilReduce/TimeUntilReduce';

import styles from './begin-page.module.css';
import { setUsername, storeKey } from '../../store/actions/user';
import { ROUTE_WALLET } from '../../constants/routes';

const PageBegin = memo(() => {
    const navigate = useNavigate()
    const { web3Provider } = useSelector(state => state.wallet)
    const { currentAward, nextHalvePeriod } = useSelector(state => state.distributor)
    const { username, key } = useSelector(state => state.user)
    const [name, setName] = useState('')
    const dispatch = useDispatch()

    const time = new Date(nextHalvePeriod * 1000)
    console.log(time)

    useEffect(() => {
        key && dispatch(storeKey(key))
    }, [web3Provider, key])

    useEffect(() => {
        if (username) {
            navigate(ROUTE_WALLET)
        } 
    }, [username])

    const [inputValid, setInputValid] = useState(true)
    const [inputPressed, setInputPressed] = useState(false)

    const handleChangeUsername = (e) => {
        e.target.value !== '' ? setInputPressed(true) : setInputPressed(false)
        setInputValid(githubUsernameRegex.test(e.target.value))
        setName(e.target.value)
    } 

    const getInputClassName = () => {
        if (!inputValid) {
            return `${styles.input} ${styles.input__invalid}`
        }

        if (inputPressed) {
            return `${styles.input} ${styles.input__pressed}`
        }

        return styles.input
    }
    
    return (
        <div className={styles.background}>
            <Header />
            <div className={`container ${styles.container}`}>
                <main className={`main ${styles.main}`}>

                    <div className={styles.title}>
                        <Title type="h1" size="large" text="Claim your FLT reward"  />
                    </div>
                    <div className={styles.dashboard}>
                        <Dashboard>
                            <div className={styles["flex-container"]}>
                                <div className={styles["flex-container__part-left"]}>
                                    <ul className={styles.texts}>
                                        <li className={styles.text}>
                                            <Text type="large" color="black" >
                                                10% of the FLT supply is distributed to ~10,000 selected Web3 developers and contributors. Public keys of selected Github accounts were added into a smart contract on Ethereum. Claim your allocation and help us build the decentralized internet together!
                                            </Text>
                                        </li>
                                        <li className={styles.text}>
                                            <Text type="mid" color="black">
                                                Authenticate via Github, to check if you are eligible and proceed with claiming.
                                            </Text>
                                        </li>
                                    </ul>
                                    <input
                                        type='text'
                                        className={getInputClassName()}
                                        placeholder="Github username"
                                        onChange={handleChangeUsername}
                                    />

                                    <p className={styles.incorrect}>{inputValid ? <>&nbsp;</> : 'Incorrect username'}</p>

                                    <ul className={styles.buttons}>
                                        <li className={styles.button}>
                                            {
                                                <Button
                                                    type="large"
                                                    icon="git"
                                                    text="Check if I’m eligible"
                                                    callback={() => dispatch(setUsername(name))}
                                                /> 
                                            }
                                        </li>
                                        <li className={styles.button}>
                                            <span className={styles.span}>or</span>
                                            <Url text="Get FLT on Uniswap"  color="black"/>
                                        </li>
                                    </ul>    
                                </div>
                                <div className={styles["flex-container__part-right"]}>
                                    <ul className={styles.definitions}>
                                        <li className={styles.definition}>
                                            <DefinitionList dd={`${currentAward || 0} FLT`} dt="Current reward" colorD="orange" colorT="black" />
                                        </li>
                                        <li className={styles.definition}>
                                            <TimeUntilReduce />
                                        </li>
                                    </ul>
                                    <div className={styles.url}>
                                        <Url text="Details about the reward" color="black" />
                                    </div>
                                    
                                </div>
                            </div>
                        </Dashboard>
                    </div>
                    
                    
                </main>
            </div>
            <Footer />
        </div>
    )
})

export default PageBegin;