import React from 'react';
import { useSelector } from 'react-redux';
import { hideString } from '../../utils';

import Button from '../Button/Button'

import styles from './UserCard.module.css';

const UserCard = ({ card=null, self=false, delegateAction }) => {
    const { address } = useSelector(state => state.wallet)

    return (<>
        {self 
            
        ?
            <article className={`${styles.card} ${styles.card_flex}`}>
                <Button
                    callback={() => delegateAction(address)}
                    text='Delegate to self'
                />
            </article>
        :
            <article className={styles.card}>
                <div className={styles["card__flex-container"]}>
                    <div className={styles["card__user-info"]}>
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
                </div>
                <p className={styles.card__text}>
                    Delegate short info that describes what they do, or contains their bio, or explains why they should be chosen as a voting delegate, or all of the mentioned above combined together.
                </p>
                <Button
                    callback={() => delegateAction(card.wallet)}
                    text='Delegate'
                />
            </article>
        }
        
    </>)
}

export default UserCard;
