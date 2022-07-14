import React from 'react';
import { Link } from 'react-router-dom';

import Title from '../Title/Title';
import Proposal from '../Proposal/Proposal';
import Button from '../Button/Button';

import styles from './ProposalsList.module.css';

const ProposalsList = ({ cards }) => {
    return (
        <>
            < div className={styles.title}>
                <Title type="h4"  text="Latest proposals" />
            </div>
            <ul className={styles.list}>
                {cards.map(card => (
                    <li className={styles.item} key={card.id}>
                        <Proposal card={card} />
                    </li>
                ))}
            </ul>
            <div className={styles["flex-container"]}>
                <Link to="/" className={styles.link} >Show all</Link>
                <Button text={`+   Add new proposal`} type="small" />
            </div>
            
        </>
    )
}

export default ProposalsList;