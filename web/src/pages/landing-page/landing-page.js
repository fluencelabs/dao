import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSubgraph } from 'thegraph-react';

import Header from '../../components/Header/Header';
import Title from '../../components/Title/Title';
import Button from '../../components/Button/Button';
import Footer from '../../components/Footer/Footer';
import Url from '../../components/Url/Url';
import LinkWithIcon from '../../components/LinkWithIcon/LinkWithIcon';
import ProposalsList from '../../components/ProposalsList/ProposalsList';
import { hideString } from '../../utils';

import cardImage from '../../images/landing-card.png';
import linesImage from '../../images/Group 2125.svg';
import dataImage from '../../images/image 111.png';
import styles from './landing-page.module.css';
import dialog from '../../images/dialog.svg';
import { proposalsAccountsQuery } from '../../utils/graphQueries';
import { accountsMapper } from '../../utils/gqlMappers';


const cards = [
    {
        id: 12344,
        status: 'failed',
        nice: 300,
        bad: 1500,
        number: '034',
        date: 'Jun 24rd, 2021'
    },
    {
        id: 121344,
        status: 'executed',
        nice: 4000,
        bad: 500,
        number: '034',
        date: 'Jun 24rd, 2021'
    },
    {
        id: 123244,
        status: 'in voting',
        nice: 2200,
        bad: 1500,
        number: '034',
        date: 'Jun 24rd, 2021'
    },
    {
        id: 123844,
        status: 'executed',
        nice: 4000,
        bad: 500,
        number: '034',
        date: 'Jun 24rd, 2021'
    },
    {
        id: 1299344,
        status: 'in voting',
        nice: 2200,
        bad: 1500,
        number: '034',
        date: 'Jun 24rd, 2021'
    }
]

const LandingPage = () => {
    const { fluence } = useSelector(state => state.graph)
    const { useQuery } = useSubgraph(fluence)
    const [ users, setUsers ] = useState([])
    
    const { error, loading, data } = useQuery(proposalsAccountsQuery);
    useEffect(() => {
        if (data) {
            const { accounts } = data
            setUsers(accounts.map(accountsMapper))
        }
    }, [data])

    return (
        <div className={styles.overflow}>
            <Header button />
            <div className={styles.container}>
                <main className={styles.main1}>
                    <div className={styles.content}>
                        <section className={styles.promo}>
                            <div className={styles.promo__title}>
                                <Title type="h1" size="large" text="Fluence DAO" />
                            </div>
                            <p className={styles.promo__text}>
                                Fluence is managed via a digital, global, and decentralised organization which everyone can take part of
                            </p>
                            <ul className={styles.promo__buttons}>
                                <li className={styles.promo__button}>
                                    <Button type="large" text="Claim your token" />
                                </li>
                                <li className={styles.promo__button}>
                                    <Button 
                                        type="large" 
                                        opacity={true} 
                                        text="Active proposals" 
                                    />
                                </li>
                            </ul>
                        </section>
                        <section className={styles.future}>
                            <div className={styles.future__title}>
                                <Title type="h3" size="medium" text="Govern the future of the Internet" />
                            </div>
                            <div className={styles.future__line} />
                            <ul className={styles.future__paragraphs}>
                                <li className={styles.future__paragraph}>
                                    <p className={styles.future__text}>
                                        Fluence enables the new generation of internet infrastructure that is owned and controlled by the community. Crowdsourcing intellectual capacity from a broad community helps to make the best decisions, move quickly, and safeguard project values over the long-term.
                                    </p>
                                </li>
                                <li className={styles.future__paragraph}>
                                    <p className={styles.future__text}>
                                        The Fluence DAO was established to collectively manage the project via decentralized governance. It is a digital organization on the Ethereum blockchain which is not constrained by corporate structures, and welcomes anyone’s participation in a transparent decision making process.
                                    </p>
                                </li>
                            </ul>
                        </section>
                        
                        <section className={styles.token}>
                            <div className={styles.token__container}>

                                

                                <div className={styles.token__title}>
                                    <Title type="h2" size="large" text="The Fluence token"/>
                                </div>
                                
                                <p className={styles.token__text}>
                                    The Fluence token (FLT) enables the collective governance of the Fluence project and facilitates escrow, payment and reward distribution
                                </p>
                            </div>
                            <ul className={styles.token__advantages}>
                                <li className={styles.token__advantage}>
                                    <div className={`${styles.token__content} ${styles.token__content_small}`}>
                                        <Title type="h3" text="$50,123,456"/>
                                        <p className={styles.token__caption}>
                                            total treasury holdings
                                        </p>
                                    </div>
                                    <Title type="h3" text="Treasury allocation"/>
                                    <p className={styles["token__card-text"]}>
                                        Vote for the distribution of the DAO treasury towards marketing, development, or liquidity providing activities.
                                    </p>
                                </li>
                                <li className={styles.token__advantage}>
                                    <img src={cardImage} alt="card-rating" className={styles.token__image} />
                                    <Title type="h3" text="Protocol upgrades"/>
                                    <p className={styles["token__card-text"]}>
                                        Suggest protocol improvements, new features and participate in the collective token engineering.
                                    </p>
                                </li>
                                <li className={styles.token__advantage}>
                                    <div className={`${styles.token__content} ${styles.token__content_large}`}>
                                        <div className={styles.token__dashboard}>
                                            <img src={linesImage} alt="lines" className={styles.token__lines} />
                                            <img src={dataImage} alt="data" className={styles.token__data}/>
                                        </div>
                                    </div>
                                    <div className={styles.advantage__flex}>
                                        <Title type="h3" text="Cloud economy"/>
                                        <span className={styles.token__note} >coming soon</span>
                                    </div>
                                    
                                    <p className={styles["token__card-text"]}>
                                        Suggest protocol improvements, new features and participate in the collective token engineering.
                                    </p>
                                </li>

                            </ul>
                            <div className={styles.token__button}>
                                <Button text="Learn more about FLT" type="small" opacity />
                            </div>
                        </section>
                    </div>
                    
                        
                    
                    <section className={styles.developer}>
                        <div className={styles.developer__title}>
                            <Title size="large" type="h2" text="Developer reward" />
                        </div>
                        <p className={styles.developer__text}>
                            Fluence has distributed FLT rewards to ~10,000 selected Web3 developers and contributors
                        </p>
                        <p className={styles.developer__text}>
                            Claim your reward and join the DAO
                        </p>
                        <div className={styles.developer__button}>
                            <Button size="large" text="Check if I’m eligible" />
                        </div>
                        
                        <p className={styles.developer__paragraph}>
                            Didn’t receive a reward? <span className={styles.developer__span}><Url  text="Get FLT on Uniswap" /></span>
                        </p>
                    </section>
                    <div className={styles.content}>
                        <section className={styles.involved}>
                            <div className={styles.involved__title}>
                                <Title text="Get involved in the Fluence DAO" type="h2" size="big" />
                            </div>
                            
                            <div className={styles["involved__flex-container"]}>
                                <div className={styles.involved__left}>
                                    {
                                        ( loading || error )
                                        ?   <div style={{color: '#fff'}}>loading...</div>
                                        // no proposals on chain yet
                                        :   <ProposalsList cards={cards} />
                                    }
                                </div>
                                <div className={styles.delegates}>
                                    <div className={styles.delegates__title}>
                                        <Title text="Top delegates" type="h3" />
                                    </div>
                                    <div className={styles.delegates__container}>
                                        <ul className={styles.delegates__list}>
                                            {users.map(card => (
                                                <li className={styles.delegates__item} key={card.id}>
                                                    <div className={styles["card__user-info"]} key={card.id}>
                                                        <img className={styles.card__avatar} alt={card.name} src={card.url} />
                                                        <div className={styles.card__info}>
                                                            <p className={styles.card__name}>{card.name}</p>

                                                            <span className={styles.card__wallet}>{hideString(card.wallet)}</span>
                                                            <span className={`${styles.card__wallet} ${styles.card__wallet_left}`}>{card.votes} votes</span>

                                                        </div>
                                                    </div>
                                                    <div className={styles["card__rating-container"]}>
                                                        <p className={styles.card__rating}>{card.rating}</p>
                                                        <p className={styles.card__delegator}>
                                                            {card.delegators} delegators
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        
                                        </ul>
                                        <div className={styles["delegates__flex-container"]}>
                                            <Link to="/" className={styles.link} >Show all</Link>
                                            <Button text={`Become a delegate`} type="small" />
                                        </div>
                                    </div>
                                    
                                </div>
                                <div className={styles.conversation}>
                                    <div className={styles.conversation__title}>
                                        <Title  type="h3" size="medium" text="Get involved in conversations" />
                                    </div>
                                    <div className={styles.conversation__link}>
                                        <LinkWithIcon color="white" text="Governance forum" icon={dialog} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
            
            <Footer />
        </div>
    )
}

export default LandingPage;