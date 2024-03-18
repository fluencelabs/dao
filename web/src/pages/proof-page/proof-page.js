import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Header from "../../components/Header/Header";
import Progress from "../../components/Progress/Progress";
import Title from "../../components/Title/Title";
import Button from "../../components/Button/Button";
import Dashboard from "../../components/Dashboard/Dashboard";
import WalletInfo from "../../components/WalletInfo/WalletInfo";
import TextArea from "../../components/TextArea/TextArea";
import Footer from "../../components/Footer/Footer";

import danger from "../../images/danger.svg";
import styles from "./proof-page.module.css";
import { hideString } from "../../utils";

import { checkHasClaimed, storeProof } from "../../store/actions/governance";
import { ROUTE_CLAIMED, ROUTE_DONE, ROUTE_WALLET } from "../../constants/routes";
import { toast } from "react-toastify";
import { Buffer } from "buffer";
import { findEthereumSig } from "../../utils/asn1";
import { Contract, ethers } from "ethers";
import { useWeb3Connection } from "../../hooks/useWeb3Connection";
import { governanceContracts } from "../../constants";
import abis from "../../contracts";

const ProofPage = () => {
  const { address, provider, network } = useWeb3Connection();
  const { hasClaimed } = useSelector((state) => state.governance);
  console.log("address", address);

  const { merkleRoot } = useSelector((state) => state.distributor);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [proofValue, setProofValue] = useState("");

  console.log("merkleRoot is", merkleRoot);

  useEffect(() => {
    if (hasClaimed?.claimed) {
      navigate(ROUTE_CLAIMED);
    }
  }, [hasClaimed]);

  const handleForm = async (e) => {
    e.preventDefault();

    if (!address) {
      navigate(ROUTE_WALLET);
      return;
    }

    try {
      // TODO: validate data better
      let [userId, tmpEthAddrNoPrefix, signatureHex, merkleProofHex] =
        proofValue.split(",");
      let tmpEthAddr = tmpEthAddrNoPrefix;

      dispatch(checkHasClaimed(userId, provider, network.name));

      try {
        console.log("signatureHex", signatureHex);
        console.log("tmpEthAddr", tmpEthAddr);
        let isASN1 = !signatureHex.startsWith("0x");
        console.log("isASN1", isASN1);

        let merkleProof = JSON.parse(
          Buffer.from(merkleProofHex, "base64").toString(),
        );
        let verified = false;
        console.log("network", network);

        let contract = new Contract(
          governanceContracts[network.name].devRewardDistributor,
          abis.DevRewardDistributor.abi,
          provider,
        );

        let signer = provider.getSigner();
        let signed = await contract.connect(signer);

        let signature = signatureHex;
        if (isASN1) {
          let asn1Signature = Buffer.from(signatureHex, "hex");

          let bufferSig = Buffer.from(asn1Signature);

          let { r, s } = findEthereumSig(bufferSig);
          let v = 27;
          let raw_signature = {
            r: "0x" + r.toString(16, 32),
            s: "0x" + s.toString(16, 32),
            v,
          };
          signature = ethers.utils.splitSignature(raw_signature);
          signature = ethers.utils.joinSignature(signature);
          try {
            await signed.estimateGas.claimTokens(
              userId,
              merkleProof,
              tmpEthAddr,
              signature,
            );
          } catch (error) {
            console.log("invalid v", error);
            raw_signature.v = 28;
            signature = ethers.utils.splitSignature(raw_signature);
            signature = ethers.utils.joinSignature(signature);
          }
        }

        console.log("claiming with", {
          userId,
          merkleProof,
          tmpEthAddr,
          signature,
        });
        await signed.estimateGas.claimTokens(
          userId,
          merkleProof,
          tmpEthAddr,
          signature,
        );
        verified = true;

        if (verified) {
          dispatch(storeProof({ userId, tmpEthAddr, signature, merkleProof }));
          navigate(ROUTE_DONE);
        } else {
          toast("Invalid merkle proof. Please check the data.");
        }
      } catch (error) {
        const message = error.error.message;
        console.log(message);
        if (message === "execution reverted: Invalid signature") {
          toast(
            "Invalid signature. Are you using the same wallet you specified in proof generation?",
          );
        } else {
          toast(error.error.message);
        }
      }
    } catch (error) {
      console.log(error);
      toast("Proof has invalid format");
    }
  };

  return (
    <div className={styles.background}>
      <Header />
      <div className={styles.container}>
        <main className={styles.main1}>
          <div className={styles.content}>
            <div className={styles.progress}>
              <Progress />
            </div>
            <div className={styles.wallet}>
              <WalletInfo
                wallet="wallet"
                account={address ? hideString(address) : ""}
              />
            </div>
            <div className={styles.title}>
              <Title
                type="h1"
                size="large"
                text="Submit the proof of Github account ownership"
              />
            </div>
          </div>

          <div className={styles.dashboard}>
            <Dashboard>
              <form onSubmit={handleForm}>
                <ul className={styles.dashboard__list}>
                  <li className={styles.dashboard__item}>
                    <p
                      className={`${styles.dashboard__text} ${styles.dashboard__text_size_large}`}
                    >
                      <span className={styles.dashboard__span}>Step 1: </span>
                      Get proof generator
                    </p>
                    <p
                      className={`${styles.dashboard__text} ${styles.dashboard__text_size_mid}`}
                    >
                      <Link
                        to="https://github.com/fluencelabs/dev-rewards"
                        className={styles.dashboard__link}
                      >
                        Clone this repo
                      </Link>{" "}
                      the proof generation script to your local machine from
                      Github and run it with the following command.
                    </p>
                    <p
                      className={`${styles.dashboard__paragraph} ${styles.dashboard__paragraph_pl_27}`}
                    >
                      <img
                        src={danger}
                        className={styles.dashboard__danger}
                        alt="danger-icon"
                      />
                      This script will read your private key, so we highly
                      recommend inspecting the source code first
                    </p>
                  </li>

                  <li className={styles.dashboard__item}>
                    <p
                      className={`${styles.dashboard__text} ${styles.dashboard__text_size_large}`}
                    >
                      <span className={styles.dashboard__span}>Step 2: </span>
                      Generate a proof
                    </p>
                    <p
                      className={`${styles.dashboard__text} ${styles.dashboard__text_size_mid}`}
                    >
                      Run the script in your machine terminal. Make sure keys
                      that are uploaded to Github are also stored on this
                      machine. You can sign with any of those keys (only RSA and
                      Ed25519 are supported).
                    </p>
                    <p
                      className={`${styles.dashboard__text} ${styles.dashboard__text_size_mid}`}
                    >
                      If everything went well, you should see a base64-encoded
                      string in your terminal — that’s your proof.
                    </p>
                    For docker:
                    <div className={styles.dashboard__textarea}>
                      <p className={styles.paragraph}>
                        docker build -t dev-reward-script .
                      </p>
                      <p className={styles.paragraph}>
                        docker run -it --network none -v ~/.ssh:/root/.ssh:ro dev-reward-script
                      </p>
                    </div>
                    For python:
                    <div className={styles.dashboard__textarea}>
                      <p className={styles.paragraph}>./install.sh</p>
                      <p className={styles.paragraph}>
                        python3 -m venv claim-venv
                      </p>
                      <p className={styles.paragraph}>
                        source claim-venv/bin/activate
                      </p>
                      <p className={styles.paragraph}>
                        pip3 install -r python/requirements.txt
                      </p>
                      <p className={styles.paragraph}>
                        python3 python/proof.py
                      </p>
                    </div>
                    For bash script:
                    <div className={styles.dashboard__textarea}>
                      <p className={styles.paragraph}>./install.sh</p>
                      <p className={styles.paragraph}>./proof-sh/proof.sh</p>
                    </div>
                  </li>

                  <li className={styles.dashboard__item}>
                    <p
                      className={`${styles.dashboard__text} ${styles.dashboard__text_size_large}`}
                    >
                      <span className={styles.dashboard__span}>Step 3: </span>
                      Enter your proof
                    </p>
                    <p
                      className={`${styles.dashboard__text} ${styles.dashboard__text_size_mid}`}
                    >
                      Copy the base64-encoded proof from your terminal into the
                      box below. The proof will be sent to the smart contract to
                      unlock your tokens.
                    </p>

                    <div className={styles.dashboard__textarea}>
                      <TextArea
                        onChange={(e) => setProofValue(e.target.value)}
                        name="token"
                        rows="4"
                      />
                    </div>
                  </li>
                </ul>

                <div className={styles.dashboard__button}>
                  <Button type="large" text={address ? "Submit proof" : "Connect wallet"} />
                </div>
                <p className={styles.dashboard__paragraph}>
                  If you are not comfortable submiting the proof via web UI, you
                  can claim directly from the smart contract{" "}
                  <Link
                    to="https://etherscan.io/address/0x6081d7F04a8c31e929f25152d4ad37c83638C62b#code"
                    className={styles.dashboard__link}
                  >
                    on Etherscan
                  </Link>
                </p>
              </form>
            </Dashboard>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ProofPage;
