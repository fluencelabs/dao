import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSubgraph } from 'thegraph-react';
import { proposalsQuery } from '../../utils/graphQueries';

import Header from '../../components/Header/Header';
import Progress from '../../components/Progress/Progress';
import Title from '../../components/Title/Title';
import WalletInfo from '../../components/WalletInfo/WalletInfo';
import Button from '../../components/Button/Button';
import Footer from '../../components/Footer/Footer';
import ProposalsList from '../../components/ProposalsList/ProposalsList';
import Url from '../../components/Url/Url';
import LinkWithIcon from '../../components/LinkWithIcon/LinkWithIcon';

import dialog from '../../images/dialog.svg';
import styles from './finish-page.module.css';
import { hideString } from '../../utils';
import { addTokenToMetamask } from '../../utils/metamask';
import { governanceContracts } from '../../constants';
import TwitterShare from '../../hoc/TwitterShare';

const TwitterShareButton = TwitterShare(Button)

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
        id: 1234004,
        status: 'executed',
        nice: 4000,
        bad: 500,
        number: '034',
        date: 'Jun 24rd, 2021'
    },
    {
        id: 1234,
        status: 'in voting',
        nice: 2200,
        bad: 1500,
        number: '034',
        date: 'Jun 24rd, 2021'
    }
]

const FinishPage = () => {
    const { address, networkName } = useSelector(state => state.wallet)
    const { delegatee } = useSelector(state => state.governance.values)
    const { fluence } = useSelector(state => state.graph)
    const { useQuery } = useSubgraph(fluence)
    const { currentAward } = useSelector(state => state.distributor)
    const [ proposals, setProposals ] = useState([])

    const handleAddToken = () => {
        addTokenToMetamask(governanceContracts[networkName].token)
    }

    const { error, loading, data } = useQuery(proposalsQuery);
    useEffect(() => {
        if (data) {
            const { proposals } = data
        }
    }, [data])

    return (
        <div className={styles.background}>
            <div className={styles.background__image}>
                
            </div>
            <div className={styles.header}>
                <Header button />
            </div>
            
            
            <div className="container">
                <main className={` main ${styles.main}`}>
                    <div className={styles.progress}>
                        <Progress />
                    </div> 
                    <ul className={styles.wallets}>
                        <li className={styles.wallet}>
                            <WalletInfo wallet="wallet" account={hideString(address)} />
                        </li>
                        <li className={styles.wallet}>
                            <WalletInfo wallet="delegate" account={hideString(delegatee)} />
                        </li>
                    </ul>
                    
                    <div className={styles.title}>
                        <Title type="h1" size="large" text={`${currentAward} FLT claimed`}  />
                        <span className={styles["icon-fire"]}> 🔥</span>
                    </div>

                    <p className={styles.caption}>
                        You have successfully claimed the FLT reward!
                    </p>
                    <ul className={styles.buttons}>
                        <li className={styles.button}>
                            <Button callback={handleAddToken} type="large" text="Display FLT in Metamask" />
                        </li>
                        <li className={styles.button}>
                            <TwitterShareButton
                                type="large"
                                icon="twitter"
                                text="Share on Twitter"
                                caption={`I just claimed ${currentAward} FLT tokens on the Fluence Network!`}
                                url="https://fluence.one"
                            />
                        </li>
                        <li className={styles.button}>
                            <Url text="Get more FLT on Uniswap" />
                        </li>
                    </ul>
                    
                    <section className={styles.involved}>
                        <div className={styles.involved__title}>
                            <Title type="h3" size="medium" text="Get involved with the DAO" />
                        </div>
                        <div className={styles.involved__list}>
                            {
                                ( loading || error )
                                ?   <div style={{color: '#fff'}}>loading...</div>
                                // no proposals on chain yet
                                :   <ProposalsList cards={cards} />
                            }
                        </div>
                    </section>

                    <div className={styles.conversation}>
                        <div className={styles.conversation__title}>
                            <Title  type="h3" size="medium" text="Get involved in conversations" />
                        </div>
                        <div className={styles.conversation__link}>
                            <LinkWithIcon color="white" text="Governance forum" icon={dialog} />
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    )
}

export default FinishPage;