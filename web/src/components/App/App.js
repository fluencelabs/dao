import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useState, memo } from 'react';
import {
  Chains,
  TheGraphProvider,
  useCreateSubgraph
} from "thegraph-react";

import './App.css';
import 'react-toastify/dist/ReactToastify.css';

import PageBegin from '../../pages/begin-page/begin-page';
import FirstStepPage from '../../pages/step1-page/step1-page';
import ProofPage from '../../pages/proof-page/proof-page';
import DelegationPage from '../../pages/delegation-page/delegation-page';
import DonePage from '../../pages/done-page/done-page';
import ClaimedPage from '../../pages/claimed-page/claimed-page';
import AccountNotFound from '../../pages/not-found-account-page/not-found-account-page';
import LandingPage from '../../pages/landing-page/landing-page';
import FinishPage from '../../pages/finish-page/finish-page';
import ConnectWallet from '../ConnectWallet/ConnectWallet';
import { getNetworkName } from '../../store/actions/wallet';
import { ToastContainer, toast } from 'react-toastify';
import { useWeb3Connection } from '../../hooks/useWeb3Connection';
import { theGraphEndpoints } from '../../constants/endpoints';
import { reduxCleanup } from '../../store/actions/common';
import {
  ROUTE_FLUENCE,
  ROUTE_INDEX,
  ROUTE_WALLET,
  ROUTE_CONNECT,
  ROUTE_PROOF,
  ROUTE_DELEGATION,
  ROUTE_DONE,
  ROUTE_FINISH,
  ROUTE_NOT_FOUND,
  ROUTE_CLAIMED
} from '../../constants/routes'
import { catchError } from '../../utils';
import { setFluenceSubgraph, setDistributorSubgraph } from '../../store/actions/graph';
import { setCurrentRoute } from '../../store/actions/routes';
import { fetchCurrentAward, fetchMerkleRoot, fetchNextHalvePeriod } from '../../store/actions/distributor';
import { useVh } from '../../hooks/useVh';

function App() {
  const { web3Provider } = useWeb3Connection()

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { error } = useSelector(state => state.error)
  const { address, prevAddress } = useSelector(state => state.wallet)
  const { username } = useSelector(state => state.user)
  const { currentRoute } = useSelector(state => state.routes)
  const location = useLocation()
  const [locationPut, setLocationPut] = useState(false)
  const [merkleRootFetched, setMerkleRootFetched] = useState(false)

  useVh()
  useEffect(() => {
    if (currentRoute
        && !locationPut
        && currentRoute !== location.pathname
      ) {
      navigate(currentRoute)
      setLocationPut(true)
    }
  }, [currentRoute])

  useEffect(() => {
    if (!merkleRootFetched) {
      dispatch(fetchMerkleRoot('kovan'))
      dispatch(fetchCurrentAward('kovan'))
      dispatch(fetchNextHalvePeriod('kovan'))
      setMerkleRootFetched(true)
    } 
  }, [])
  
  useEffect(() => {
    if (address && prevAddress && (address !== prevAddress)) {
      dispatch(reduxCleanup())
      navigate(ROUTE_INDEX)
      dispatch(setCurrentRoute(ROUTE_INDEX))
    } else if (!address && !web3Provider && username) {
      navigate(ROUTE_WALLET)
    }
  }, [address])

  const fluence = useCreateSubgraph({
    [Chains.KOVAN]: theGraphEndpoints.fluence['kovan'],
  });

  const distributor = useCreateSubgraph({
    [Chains.KOVAN]: theGraphEndpoints.distributor['kovan'],
  });

  const subgraphs = useMemo(() => {
    dispatch(setFluenceSubgraph(fluence))
    dispatch(setDistributorSubgraph(distributor))
    return [fluence, distributor];
  }, [fluence, distributor]);

  useEffect(() => {
    window.scrollTo(0, 0)
    dispatch(setCurrentRoute(location.pathname))
  }, [location]);

  useEffect(() => {
    web3Provider && dispatch(getNetworkName(web3Provider))
  },[web3Provider])

  useEffect(() => {
    if (error) {
      toast(catchError(error, true))
    }
  }, [error])

  return (
    <TheGraphProvider chain={Chains.KOVAN} subgraphs={subgraphs}>
      <div className="App">
        <ToastContainer autoClose={false}/>
        <Routes>
          <Route exact path={ROUTE_FLUENCE} element={<LandingPage />} />
          <Route exact path={ROUTE_INDEX} element={<PageBegin/>} />
          <Route exact path={ROUTE_WALLET} element={<FirstStepPage/>} />
          <Route exact path={ROUTE_CONNECT} element={<ConnectWallet />} />
          <Route exact path={ROUTE_PROOF} element={<ProofPage/>} />
          <Route exact path={ROUTE_DELEGATION} element={<DelegationPage/>} />
          <Route exact path={ROUTE_DONE} element={<DonePage/>} />
          <Route exact path={ROUTE_FINISH} element={<FinishPage />} />
          <Route exact path={ROUTE_NOT_FOUND} element={<AccountNotFound />} />
          <Route exact path={ROUTE_CLAIMED} element={<ClaimedPage />} />
          <Route
              path="*"
              element={<Navigate to="/" />}
          />
        </Routes>
      </div>
    </TheGraphProvider>
  );
}

export default memo(App);
