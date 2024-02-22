import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSubgraph } from 'thegraph-react';

import Header from '../../components/Header/Header';
import Progress from '../../components/Progress/Progress';
import Title from '../../components/Title/Title';
import Dashboard from '../../components/Dashboard/Dashboard';
import WalletInfo from '../../components/WalletInfo/WalletInfo';
import UserCard from '../../components/UserCard/UserCard';
import Footer from '../../components/Footer/Footer';

import styles from './delegation-page.module.css';

import { hideString } from '../../utils';
import { storeDelegatee } from '../../store/actions/governance';
import { accountsQueryFactory } from '../../utils/graphQueries';
import { accountsMapper } from '../../utils/gqlMappers';
import { ROUTE_DONE } from '../../constants/routes';

const DelegationPage = () => {
    const { address } = useSelector(state => state.wallet)
    const { delegatee } = useSelector(state => state.governance.values)
    const navigate = useNavigate()

    const dispatch = useDispatch()
    const delegateAction = (delegatee) => {
        dispatch(storeDelegatee(delegatee))
    }

    const acc = hideString(address)

    const { fluence } = useSelector(state => state.graph)
    const { useQuery } = useSubgraph(fluence)
    const [ users, setUsers ] = useState([])
    
    const { data } = useQuery(accountsQueryFactory(5));
    useEffect(() => {
        if (data) {
            const { accounts } = data
            setUsers(accounts.map(accountsMapper))
        }
    }, [data])

    useEffect(() => {
        if (delegatee) {
            navigate(ROUTE_DONE)
        }
    }, [delegatee])

    return (
        <div className={styles.background}>
            <Header />
            <div className="container">
                <main className={`main ${styles.main}`}>
                    <div className={styles.progress}>
                        <Progress />
                    </div>
                    <div className={styles.wallet}>
                        <WalletInfo wallet="wallet" account={acc} />
                    </div>
                    <div className={styles.title}>
                        <Title type="h2" size="large" text="Confirmed! Delegate FLT to complete the claim"  />
                    </div>
                    <div className={styles.dashboard}>
                        <Dashboard>
                            <p className={styles.dashboard__text}>
                                Fluence DAO is based on the Compound governance model and requires delegation in order to vote. Delegated tokens stay in your wallet and can be undelegated at any time.
                            </p>
                            <p className={styles.dashboard__caption}>
                                0.001 ETH (~$15) gas fee will be involved for delegation transaction
                            </p>
                            
                            <ul className={styles.dashboard__list}>
                                {users.map(user => (
                                    <li className={styles.dashboard__item}
                                        key={user.id}>
                                        <UserCard card={user} delegateAction={delegateAction}/>
                                    </li>
                                    
                                ))}
                                <li className={styles.dashboard__item}>
                                    <UserCard delegateAction={delegateAction} self/>
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

export default DelegationPage;