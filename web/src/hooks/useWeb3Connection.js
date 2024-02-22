import WalletConnectProvider from '@walletconnect/web3-provider'
import { providers } from 'ethers'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Web3 from 'web3'
import Web3Modal from 'web3modal'
import supportedChains from '../constants/chains'
import { toast } from 'react-toastify'
import { setError } from '../store/actions/governance'
import {
    resetWeb3Provider,
    setAddress,
    setPrevAddress,
    setWeb3Provider
} from '../store/actions/wallet'

const { REACT_APP_INFURA_KEY: INFURA_ID } = process.env

const providerOptions = {
    walletconnect: {
        package: WalletConnectProvider, // required
        options: {
            infuraId: INFURA_ID, // required
        }
    }
}

let web3Modal
if  (typeof window !== 'undefined') {
        web3Modal = new Web3Modal({
            network: 'kovan', // optional
            cacheProvider: true,
            providerOptions, // required
    })
}

export const useWeb3Connection = () => {
    const state = useSelector(state => state.wallet)
    const dispatch = useDispatch()
    const { provider, web3Provider, address, chainId } = state

    function initWeb3(provider) {
        const web3 = new Web3(provider);
      
        web3.eth.extend({
          methods: [
            {
              name: "chainId",
              call: "eth_chainId",
              outputFormatter: web3.utils.hexToNumber
            }
          ]
        });
      
        return web3;
    }

    function sendTransaction(_tx) {
        return new Promise((resolve, reject) => {
          web3.eth
            .sendTransaction(_tx)
            .once("transactionHash", (txHash) => resolve(txHash))
            .catch((err) => reject(err));
        });
    }

    const web3 = initWeb3(provider)

    const connect = useCallback(async () => {
        const provider = await web3Modal.connect()
        const web3Provider = new providers.Web3Provider(provider)
        const signer = web3Provider.getSigner()
        const address = await signer.getAddress()
        const network = await web3Provider.getNetwork()

        dispatch(setWeb3Provider(provider, web3Provider, address, network))
    }, [dispatch])

    const disconnect = useCallback(
        async function () {
            await web3Modal.clearCachedProvider()
            if (provider?.disconnect && typeof provider.disconnect === 'function') {
                await provider.disconnect()
            }
            dispatch(resetWeb3Provider())
        },
        [provider, dispatch]
    )

    useEffect(() => {
        if (web3Modal.cachedProvider) {
            connect()
        }
    }, [connect])

    useEffect(() => {
        if (provider?.on) {
            const handleAccountsChanged = (accounts) => {
                dispatch(setPrevAddress(address))
                console.log('accountsChanged', accounts)
                dispatch(setAddress(accounts))
            }

            const handleChainChanged = (_hexChainId) => {
                let chainSupported = false

                supportedChains.forEach(chain => {
                    if (web3.utils.hexToNumber(_hexChainId) === chain.chain_id) {
                        chainSupported = true
                    } 
                })

                chainSupported
                    ? window.location.reload()
                    : toast(`Network not supported. Please switch to ${supportedChains[0].name}.`)
            }

            const handleDisconnect = (error) => {
                console.log('disconnect', error)
                disconnect()
            }

            provider.on('accountsChanged', handleAccountsChanged)
            provider.on('chainChanged', handleChainChanged)
            provider.on('disconnect', handleDisconnect)

        // Subscription Cleanup
        return () => {
            if (provider.removeListener) {
                provider.removeListener('accountsChanged', handleAccountsChanged)
                provider.removeListener('chainChanged', handleChainChanged)
                provider.removeListener('disconnect', handleDisconnect)
            }
        }
    }
    }, [provider, disconnect, dispatch])

    return {
        connect,
        disconnect,
        provider,
        web3Provider,
        address,
        chainId,
        web3,
        sendTransaction
    }
}