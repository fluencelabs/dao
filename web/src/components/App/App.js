import { Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { memo, useEffect, useState } from "react";

import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import PageBegin from "../../pages/begin-page/begin-page";
import FirstStepPage from "../../pages/step1-page/step1-page";
import ProofPage from "../../pages/proof-page/proof-page";
import DonePage from "../../pages/done-page/done-page";
import ClaimedPage from "../../pages/claimed-page/claimed-page";
import AccountNotFound from "../../pages/not-found-account-page/not-found-account-page";
import FinishPage from "../../pages/finish-page/finish-page";
import ConnectWallet from "../ConnectWallet/ConnectWallet";
import { toast, ToastContainer } from "react-toastify";
import { useWeb3Connection } from "../../hooks/useWeb3Connection";
import { reduxCleanup } from "../../store/actions/common";
import {
  ROUTE_CLAIMED,
  ROUTE_CONNECT,
  ROUTE_DONE,
  ROUTE_FINISH,
  ROUTE_INDEX,
  ROUTE_NOT_FOUND,
  ROUTE_PROOF,
  ROUTE_WALLET
} from "../../constants/routes";
import { catchError } from "../../utils";
import { fetchCurrentAward, fetchMerkleRoot, fetchNextHalvePeriod } from "../../store/actions/distributor";
import { useVh } from "../../hooks/useVh";

function App() {
  const { network, address, provider } = useWeb3Connection();

  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.error);
  const [merkleRootFetched, setMerkleRootFetched] = useState(false);

  useVh();

  useEffect(() => {
    console.log("nerwork: " + network.name);
    dispatch(fetchNextHalvePeriod(network.name, provider));
    if (!merkleRootFetched && network?.name && network.name !== "unknown") {
      dispatch(fetchMerkleRoot(network.name, provider));
      dispatch(fetchCurrentAward(network.name, provider));
      setMerkleRootFetched(true);
    }
  }, [network]);

  useEffect(() => {
    dispatch(reduxCleanup());
  }, [address]);

  useEffect(() => {
    if (error) {
      toast(catchError(error, true));
    }
  }, [error]);

  return (
    <div className="App">
      <ToastContainer autoClose={false} />
      <Routes>
        <Route exact path={ROUTE_INDEX} element={<PageBegin />} />
        <Route exact path={ROUTE_WALLET} element={<FirstStepPage />} />
        <Route exact path={ROUTE_CONNECT} element={<ConnectWallet />} />
        <Route exact path={ROUTE_PROOF} element={<ProofPage />} />
        <Route exact path={ROUTE_DONE} element={<DonePage />} />
        <Route exact path={ROUTE_FINISH} element={<FinishPage />} />
        <Route exact path={ROUTE_NOT_FOUND} element={<AccountNotFound />} />
        <Route exact path={ROUTE_CLAIMED} element={<ClaimedPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default memo(App);
