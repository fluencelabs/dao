import React, { memo, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import githubUsernameRegex from "github-username-regex";

import Header from "../../components/Header/Header";
import Title from "../../components/Title/Title";
import Text from "../../components/Text/Text";
import Button from "../../components/Button/Button";
import Dashboard from "../../components/Dashboard/Dashboard";
import DefinitionList from "../../components/DefinitionList/DefinitionList";
import Footer from "../../components/Footer/Footer";
import TimeUntilReduce from "../../components/TimeUntilReduce/TimeUntilReduce";

import styles from "./begin-page.module.css";
import { ROUTE_NOT_FOUND, ROUTE_WALLET } from "../../constants/routes";

const PageBegin = memo(() => {
  const navigate = useNavigate();
  const { currentAward, nextHalvePeriod } = useSelector(
    (state) => state.distributor,
  );
  const [username, setUsername] = useState("");
  const [githubAccounts, setGithubAccounts] = useState(new Set());

  useEffect(() => {
    (async function() {
      const { default: url } = await import('../../assets/github-accounts.txt');
      const accounts = await fetch(url).then(res => res.text());
      setGithubAccounts(new Set(accounts.split(',').map(account => account.toLowerCase())));
    })();
  }, []);

  const [inputValid, setInputValid] = useState(true);
  const [inputPressed, setInputPressed] = useState(false);

  const onEligibilityCheckButtonClick = () => {
    console.log(githubAccounts);
    console.log(username);
    if (githubAccounts.has(username)) {
      navigate(ROUTE_WALLET);
    } else {
      navigate(ROUTE_NOT_FOUND);
    }
  };

  const handleChangeUsername = (e) => {
    const value = e.target.value.toLowerCase();
    value !== "" ? setInputPressed(true) : setInputPressed(false);
    setInputValid(githubUsernameRegex.test(value));
    setUsername(value);
  };

  const getInputClassName = () => {
    if (!inputValid) {
      return `${styles.input} ${styles.input__invalid}`;
    }

    if (inputPressed) {
      return `${styles.input} ${styles.input__pressed}`;
    }

    return styles.input;
  };

  return (
    <div className={styles.background}>
      <Header />
      <div className={`container ${styles.container}`}>
        <main className={`main ${styles.main}`}>
          <div className={styles.title}>
            <Title type="h1" size="large" text="Claim your FLT reward" />
          </div>
          <div className={styles.dashboard}>
            <Dashboard>
              <div className={styles["flex-container"]}>
                <div className={styles["flex-container__part-left"]}>
                  <ul className={styles.texts}>
                    <li className={styles.text}>
                      <Text type="large" color="black">
                        5% of the FLT supply is allocated to ~110,000 developers
                        who contributed into open source web3 repositories
                        during last year. Public keys of selected Github
                        accounts were added into a smart contract on Ethereum.
                        Claim your allocation and help us build the
                        decentralized internet together!
                      </Text>
                    </li>
                    <li className={styles.text}>
                      <Text type="mid" color="black">
                        Check if you are eligible and proceed with claiming
                      </Text>
                    </li>
                  </ul>
                  <input
                    value={username}
                    type="text"
                    className={getInputClassName()}
                    placeholder="Github username"
                    onChange={handleChangeUsername}
                  />
                  <p className={styles.incorrect}>{inputValid ? <>&nbsp;</> : "Incorrect username"}</p>

                  <ul className={styles.buttons}>
                    <li className={styles.button}>
                      <Button
                        type="large"
                        icon="git"
                        text="Check if I’m eligible"
                        callback={onEligibilityCheckButtonClick}
                      />
                    </li>
                  </ul>
                </div>
                <div className={styles["flex-container__part-right"]}>
                  <ul className={styles.definitions}>
                    <li className={styles.definition}>
                      <DefinitionList
                        dd={`${currentAward || 0} FLT`}
                        dt="Current reward"
                        colorD="orange"
                        colorT="black"
                      />
                    </li>
                    <li className={styles.definition}>
                      <TimeUntilReduce />
                    </li>
                  </ul>
                  <div className={styles.url}>
                    <Link to="https://blog.fluence.network/the-future-is-cloudless-fluences-depin-computing-platform-and-flt-token-are-now-live/" target="_blank" className={styles.dashboard__link}>
                      Read the announcement
                    </Link>
                  </div>
                </div>
              </div>
            </Dashboard>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
});

export default PageBegin;
